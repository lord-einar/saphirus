import { useState, useEffect } from 'react';
import { getProducts, getBrands, getCategories } from '../utils/api';

/**
 * Componente reutilizable para seleccionar productos con filtros
 *
 * Props:
 * - onSelect: función llamada cuando se selecciona un producto (recibe el producto)
 * - excludeIds: array de IDs de productos a excluir de la lista (opcional)
 * - showFilters: mostrar filtros de marca/categoría (default: true)
 */
export default function ProductPicker({ onSelect, excludeIds = [], showFilters = true }) {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBrands();
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedBrand, selectedCategory, search, excludeIds]);

  useEffect(() => {
    if (selectedBrand) {
      loadCategories(selectedBrand);
    } else {
      loadCategories();
    }
  }, [selectedBrand]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedBrand) params.brand = selectedBrand;
      if (selectedCategory) params.category = selectedCategory;
      if (search) params.search = search;
      params.limit = 100;

      const response = await getProducts(params);

      // Filtrar productos excluidos
      const filteredProducts = response.data.products.filter(
        p => !excludeIds.includes(p.id)
      );

      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await getBrands();
      setBrands(response.data);
    } catch (error) {
      console.error('Error al cargar marcas:', error);
    }
  };

  const loadCategories = async (brand = '') => {
    try {
      const params = brand ? { brand } : {};
      const response = await getCategories(params);
      setCategories(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const handleSelectProduct = (product) => {
    onSelect(product);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      {showFilters && (
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              placeholder="Buscar productos..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setSelectedCategory(''); // Reset category when brand changes
              }}
              className="input"
            >
              <option value="">Todas</option>
              {brands.map(brand => (
                <option
                  key={typeof brand === 'string' ? brand : brand.name}
                  value={typeof brand === 'string' ? brand : brand.name}
                >
                  {typeof brand === 'string' ? brand : brand.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input"
            >
              <option value="">Todas</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Lista de productos */}
      <div className="border rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-600 py-8">
            {search || selectedBrand || selectedCategory
              ? 'No se encontraron productos con los filtros seleccionados'
              : 'No hay productos disponibles'}
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y">
            {products.map(product => (
              <button
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center gap-4"
              >
                {product.image_url && (
                  <div className="w-16 h-16 flex-shrink-0">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {product.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {product.brand} {product.category && `• ${product.category}`}
                  </p>
                  <p className="text-sm font-semibold text-primary-600">
                    ${product.price?.toFixed(2)}
                  </p>
                </div>
                <div className="text-primary-600">
                  ➜
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {!showFilters && products.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          {products.length} producto{products.length !== 1 ? 's' : ''} disponible{products.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
