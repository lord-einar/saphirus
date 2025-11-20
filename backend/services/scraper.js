import axios from 'axios';
import * as cheerio from 'cheerio';
import db from '../database/db-auto.js';

const BASE_URL = 'https://saphirus.com.ar/tienda';
const DELAY_MS = 1500; // 1.5 segundos entre requests

// Función para esperar un tiempo determinado
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Extraer número de la última página del paginador
async function getLastPageNumber() {
  try {
    console.log('Detectando número de páginas...');
    const response = await axios.get(BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const pageNumbers = [];

    // Buscar todos los números de página en el paginador
    $('.woocommerce-pagination .page-numbers a').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && href.includes('/page/')) {
        const match = href.match(/\/page\/(\d+)\//);
        if (match) {
          pageNumbers.push(parseInt(match[1]));
        }
      }
    });

    if (pageNumbers.length === 0) {
      console.log('No se encontró paginador, solo hay 1 página');
      return 1;
    }

    const lastPage = Math.max(...pageNumbers);
    console.log(`✓ Detectadas ${lastPage} páginas`);
    return lastPage;
  } catch (error) {
    console.error('Error al detectar páginas:', error.message);
    return 1; // Si falla, asumir que hay solo 1 página
  }
}

// Extraer productos de una página
function extractProductsFromPage($) {
  const products = [];

  $('.wd-product').each((i, elem) => {
    try {
      const $product = $(elem);

      // Extraer SKU del atributo data-id (puede no existir)
      const sku = $product.attr('data-id') || $product.find('[data-product_sku]').attr('data-product_sku');

      // Nombre del producto
      const name = $product.find('.wd-entities-title a').text().trim();

      // URL del producto
      const productUrl = $product.find('.product-image-link').attr('href') ||
                        $product.find('.wd-entities-title a').attr('href');

      // URL de la imagen (intentar múltiples atributos por lazy loading)
      const $img = $product.find('.product-image-link img');
      let imageUrl = $img.attr('data-lazy-src') ||
                     $img.attr('data-wood-src') ||
                     $img.attr('data-wd-src') ||
                     $img.attr('data-original') ||
                     $img.attr('data-src') ||
                     $img.attr('src');

      // Filtrar placeholder de lazy loading
      if (imageUrl && imageUrl.includes('lazy.svg')) {
        // Intentar obtener de srcset si existe
        const srcset = $img.attr('data-srcset') || $img.attr('srcset');
        if (srcset) {
          const match = srcset.match(/(https?:\/\/[^\s]+)/);
          if (match) {
            imageUrl = match[1].split(' ')[0];
          }
        }
      }

      // Marca
      const brand = $product.find('.wd-product-brands-links a').text().trim();

      // Precio
      let price = 0;
      const priceText = $product.find('.woocommerce-Price-amount').first().text().trim();
      const priceMatch = priceText.replace(/[^\d,]/g, '').replace(',', '.');
      if (priceMatch) {
        price = parseFloat(priceMatch);
      }

      // Categorías (extraer de las clases product_cat-*)
      const classes = ($product.attr('class') || '').split(' ');
      const categories = classes
        .filter(c => c.startsWith('product_cat-'))
        .map(c => c.replace('product_cat-', '').replace(/-/g, ' '))
        .filter(c => c.toLowerCase() !== brand.toLowerCase()) // Filtrar la marca si aparece como categoría
        .map(c => c.charAt(0).toUpperCase() + c.slice(1)); // Capitalizar

      const category = categories.length > 0 ? categories.join(', ') : 'Sin categoría';

      // Detectar rótulos especiales (labels)
      const labels = [];

      // Detectar "Sin Stock"
      if ($product.hasClass('outofstock') || $product.find('.out-of-stock').length > 0) {
        labels.push('Sin Stock');
      }

      // Detectar "Novedad" y otros rótulos de berocket_better_labels
      $product.find('.berocket_better_labels span').each((j, labelElem) => {
        const bgStyle = $(labelElem).attr('style') || '';

        // Detectar Novedad por la imagen de fondo
        if (bgStyle.includes('Novedad.png')) {
          labels.push('Novedad');
        }
        // Agregar otros rótulos si tienen imágenes identificables
        else if (bgStyle.includes('Sale.png') || bgStyle.includes('SALE')) {
          labels.push('Oferta');
        }
      });

      // También verificar labels estándar de WooCommerce
      $product.find('.product-labels span').each((j, labelElem) => {
        const labelText = $(labelElem).text().trim();
        if (labelText && !labels.includes(labelText)) {
          labels.push(labelText);
        }
      });

      // Solo agregar si tiene nombre y URL
      if (name && productUrl) {
        products.push({
          sku: sku || `temp-${Date.now()}-${i}`,
          name,
          brand: brand || 'Sin marca',
          category,
          price,
          image_url: imageUrl || '',
          product_url: productUrl,
          description: '',
          labels: labels.length > 0 ? JSON.stringify(labels) : null
        });
      }
    } catch (error) {
      console.error('Error al extraer producto:', error.message);
    }
  });

  return products;
}

// Scrapear una página específica
async function scrapePage(pageNumber) {
  const url = pageNumber === 1 ? BASE_URL : `${BASE_URL}/page/${pageNumber}/`;

  try {
    console.log(`Scrapeando página ${pageNumber}...`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const products = extractProductsFromPage($);

    console.log(`✓ Encontrados ${products.length} productos en página ${pageNumber}`);
    return products;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`Página ${pageNumber} no existe (404)`);
      return [];
    }
    console.error(`Error al scrapear página ${pageNumber}:`, error.message);
    return [];
  }
}

// Función principal de scraping
export async function runScraping() {
  const startTime = Date.now();
  console.log('\n========================================');
  console.log('Iniciando scraping de Saphirus...');
  console.log('========================================\n');

  let allProducts = [];
  let newProductsCount = 0;
  let removedProductsCount = 0;
  let status = 'success';
  let errorMessage = null;

  try {
    // Detectar número de páginas
    const lastPage = await getLastPageNumber();

    // Scrapear todas las páginas
    for (let page = 1; page <= lastPage; page++) {
      const products = await scrapePage(page);
      allProducts = allProducts.concat(products);

      // Esperar entre requests (excepto en la última página)
      if (page < lastPage) {
        await delay(DELAY_MS);
      }
    }

    console.log(`\n✓ Total de productos encontrados: ${allProducts.length}`);

    // Obtener todos los SKUs actuales en la BD
    const existingProducts = await db.prepare('SELECT sku, id FROM products WHERE is_active = TRUE').all();
    const existingSkus = new Set(existingProducts.map(p => p.sku));
    const scrapedSkus = new Set(allProducts.map(p => p.sku));

    // Iniciar transacción
    const insertStmt = db.prepare(`
      INSERT INTO products (sku, name, brand, category, price, image_url, product_url, description, attributes, labels, is_active, is_new)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, TRUE)
    `);

    const updateStmt = db.prepare(`
      UPDATE products
      SET name = ?, brand = ?, category = ?, price = ?, image_url = ?, product_url = ?,
          description = ?, attributes = ?, labels = ?, is_active = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE sku = ?
    `);

    const deactivateStmt = db.prepare(`
      UPDATE products SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE sku = ?
    `);

    const resetNewFlagStmt = db.prepare(`
      UPDATE products SET is_new = FALSE WHERE is_new = TRUE
    `);

    // Resetear flag de "nuevo" de productos anteriores
    await resetNewFlagStmt.run();

    // Procesar productos
    const transaction = db.transaction(async () => {
      for (const product of allProducts) {
        if (existingSkus.has(product.sku)) {
          // Actualizar producto existente
          await updateStmt.run(
            product.name,
            product.brand,
            product.category,
            product.price,
            product.image_url,
            product.product_url,
            product.description,
            product.attributes || null,
            product.labels,
            product.sku
          );
        } else {
          // Insertar nuevo producto
          await insertStmt.run(
            product.sku,
            product.name,
            product.brand,
            product.category,
            product.price,
            product.image_url,
            product.product_url,
            product.description,
            product.attributes || null,
            product.labels
          );
          newProductsCount++;
        }
      }

      // Desactivar productos que ya no existen
      for (const existingProduct of existingProducts) {
        if (!scrapedSkus.has(existingProduct.sku)) {
          await deactivateStmt.run(existingProduct.sku);
          removedProductsCount++;
        }
      }
    });

    await transaction();

    console.log(`✓ Productos nuevos: ${newProductsCount}`);
    console.log(`✓ Productos dados de baja: ${removedProductsCount}`);

  } catch (error) {
    console.error('✗ Error durante el scraping:', error);
    status = 'error';
    errorMessage = error.message;
  }

  // Guardar log de scraping
  const logStmt = db.prepare(`
    INSERT INTO scraping_logs (products_found, new_products, removed_products, status, error_message)
    VALUES (?, ?, ?, ?, ?)
  `);

  await logStmt.run(allProducts.length, newProductsCount, removedProductsCount, status, errorMessage);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✓ Scraping completado en ${duration}s`);
  console.log('========================================\n');

  return {
    productsFound: allProducts.length,
    newProducts: newProductsCount,
    removedProducts: removedProductsCount,
    status,
    error: errorMessage
  };
}

// Función para scrapear detalles de un producto específico
export async function scrapeProductDetail(productUrl) {
  try {
    console.log(`Obteniendo detalles de: ${productUrl}`);

    const response = await axios.get(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    // Extraer descripción corta
    let description = $('.woocommerce-product-details__short-description p').first().text().trim();

    // Extraer atributos/características de la tabla
    const attributes = [];
    $('.single-product-attributes__row').each((i, row) => {
      const $row = $(row);
      const key = $row.find('td').first().text().trim();
      const value = $row.find('td').last().text().trim();

      if (key && value) {
        attributes.push({ key, value });
      }
    });

    // Extraer SKU si está disponible
    let sku = null;
    const skuText = $('.sku_wrapper .sku').text().trim();
    if (skuText) {
      sku = skuText;
    }

    // Extraer logo de la marca
    let brandName = null;
    let brandLogoUrl = null;
    const $brandLogo = $('.wd-product-brands img');
    if ($brandLogo.length > 0) {
      // Priorizar data-src sobre src (para evitar lazy loading placeholders)
      brandLogoUrl = $brandLogo.attr('data-src') ||
                     $brandLogo.attr('data-lazy-src') ||
                     $brandLogo.attr('data-wood-src') ||
                     $brandLogo.attr('data-wd-src') ||
                     $brandLogo.attr('src');

      // Filtrar placeholder de lazy loading
      if (brandLogoUrl && brandLogoUrl.includes('lazy.svg')) {
        brandLogoUrl = null;
      }

      brandName = $brandLogo.attr('alt') || $brandLogo.attr('title');
    }

    return {
      description,
      attributes: attributes.length > 0 ? JSON.stringify(attributes) : null,
      sku,
      brandName,
      brandLogoUrl
    };
  } catch (error) {
    console.error('Error al obtener detalles del producto:', error.message);
    return {
      description: null,
      attributes: null,
      sku: null,
      brandName: null,
      brandLogoUrl: null
    };
  }
}
