# Logos de Marcas

## Descripción

La aplicación muestra los logos de las marcas de productos en varios lugares:
- Filtro de productos (botones visuales con logos)
- Tarjetas de productos (logo junto al nombre de la marca)
- Selector de marcas en formularios

Los logos se descargan desde el sitio web de Saphirus y se almacenan localmente en el servidor para mejor rendimiento.

## Ubicación de los logos

- **Carpeta:** `/backend/public/brand-logos/`
- **Base de datos:** Tabla `brands` (columna `logo_url`)
- **Servidos en:** `http://localhost:3000/brand-logos/`

## Actualizar logos

### Automáticamente (recomendado)

Los logos se obtienen automáticamente cuando:
1. Se accede al detalle de un producto por primera vez
2. El sistema detecta que el producto tiene una marca sin logo
3. Se scrapea el logo desde la página del producto
4. Se guarda en la BD y se descarga localmente

### Manualmente

Para actualizar todos los logos manualmente:

```bash
cd backend
node update-brand-logos.js
```

Este script:
1. Obtiene todas las marcas de productos activos
2. Scrapea los logos desde Saphirus.com.ar
3. Los descarga y guarda en `/backend/public/brand-logos/`
4. Actualiza la base de datos con las rutas locales

## Estructura de archivos

```
backend/
├── public/
│   └── brand-logos/
│       ├── ambar.svg
│       ├── red-on.svg
│       ├── saphirus.svg
│       ├── saphirus-hierbas.svg
│       ├── saphirus-himalaya.svg
│       └── shiny.svg
├── database/
│   └── database.sqlite (tabla brands)
└── update-brand-logos.js (script de actualización)
```

## Frontend

### Context API

Se utiliza `BrandContext` para:
- Cargar todas las marcas con logos al iniciar la app
- Proporcionar función `getBrandLogo(brandName)` para acceder rápidamente
- Cachear los datos para evitar múltiples llamadas al API

### Componentes que usan logos

1. **ProductFilter** (`/components/ProductFilter.jsx`)
   - Muestra botones con logos para filtrar por marca
   - Select dropdown con nombres de marcas

2. **ProductCard** (`/components/ProductCard.jsx`)
   - Muestra logo junto al nombre de la marca
   - En cada tarjeta de producto

3. **CreateOrder** (`/pages/CreateOrder.jsx`)
   - Select de marcas (compatible con el nuevo formato)

## API Endpoints

### GET `/api/products/brands`

Devuelve todas las marcas con sus logos:

```json
[
  {
    "name": "Ambar",
    "logo": "/brand-logos/ambar.svg"
  },
  {
    "name": "Saphirus",
    "logo": "/brand-logos/saphirus.svg"
  }
]
```

### GET `/brand-logos/:filename`

Sirve archivos estáticos de logos (configurado en `server.js`)

## Notas técnicas

### Scraper mejorado

El scraper (`services/scraper.js`) fue mejorado para:
- Priorizar `data-src` sobre `src` (evita placeholders de lazy loading)
- Filtrar URLs que contengan "lazy.svg"
- Extraer logos de múltiples atributos: `data-src`, `data-lazy-src`, `data-wood-src`, etc.

### Compatibilidad

El código es compatible con:
- Formato antiguo: `["Marca1", "Marca2"]`
- Formato nuevo: `[{ name: "Marca1", logo: "/path" }]`

Esto permite una transición gradual sin romper funcionalidad existente.

## Agregar nueva marca

Cuando aparece una nueva marca en los productos:

1. El scraping automático la detectará
2. Al acceder al detalle de un producto de esa marca, se obtendrá el logo
3. O ejecutar `node update-brand-logos.js` para actualizar todas de una vez

## Troubleshooting

### Los logos no se muestran

1. Verificar que los archivos existan en `/backend/public/brand-logos/`
2. Verificar que el servidor esté sirviendo estáticos: `curl http://localhost:3000/brand-logos/ambar.svg`
3. Verificar que la tabla `brands` tenga las rutas correctas
4. Revisar la consola del navegador para errores de CORS o 404

### Logos rotos después de scraping

Si aparecen logos de placeholder (lazy.svg):
1. Ejecutar `node update-brand-logos.js` para re-descargarlos
2. El scraper ahora filtra automáticamente estos placeholders

### Marcas sin logo

Es normal que algunas marcas no tengan logo si:
- No hay productos activos de esa marca
- La página del producto no tiene el logo
- El selector CSS cambió en el sitio web

Para forzar actualización:
```bash
node update-brand-logos.js
```
