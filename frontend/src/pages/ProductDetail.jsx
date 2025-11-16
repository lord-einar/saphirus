import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, getInventory } from '../utils/api';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useBrands } from '../context/BrandContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { getBrandLogo } = useBrands();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [myStock, setMyStock] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await getProduct(id);
      setProduct(response.data);

      // Si está autenticado, cargar el stock personal
      if (isAuthenticated) {
        loadMyStock(id);
      }
    } catch (error) {
      console.error('Error al cargar producto:', error);
      toast.error('Error al cargar el producto');
      navigate('/productos');
    } finally {
      setLoading(false);
    }
  };

  const loadMyStock = async (productId) => {
    try {
      const response = await getInventory();
      const inventoryItem = response.data.find(item => item.product_id === parseInt(productId));
      setMyStock(inventoryItem?.stock || 0);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      // No mostrar error al usuario, simplemente mostrar stock 0
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      ...product,
      quantity
    });

    toast.success(`${quantity} ${product.name} agregado${quantity > 1 ? 's' : ''} al carrito`);
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
        <button onClick={() => navigate('/productos')} className="btn-primary">
          Volver a productos
        </button>
      </div>
    );
  }

  const labels = product.labels ? JSON.parse(product.labels) : [];
  const attributes = product.attributes ? JSON.parse(product.attributes) : [];
  const hasStockInStore = !labels.includes('Sin Stock');

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-gray-600">
        <button onClick={() => navigate('/')} className="hover:text-primary-600">
          Inicio
        </button>
        <span className="mx-2">/</span>
        <button onClick={() => navigate('/productos')} className="hover:text-primary-600">
          Productos
        </button>
        {product.brand && (
          <>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{product.brand}</span>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Columna izquierda - Imagen */}
        <div className="relative">
          {labels.length > 0 && (
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              {labels.map((label, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 text-sm font-bold rounded shadow-md ${
                    label === 'Sin Stock'
                      ? 'bg-gray-600 text-white'
                      : label === 'Novedad'
                      ? 'bg-orange-500 text-white'
                      : label === 'Oferta'
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-auto object-contain"
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center bg-gray-100">
                <span className="text-gray-400 text-4xl">📦</span>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha - Información del producto */}
        <div className="space-y-6">
          {/* Marca */}
          {product.brand && (
            <div className="flex items-center gap-3">
              {getBrandLogo(product.brand) && (
                <img
                  src={`${import.meta.env.VITE_API_URL}${getBrandLogo(product.brand)}`}
                  alt={product.brand}
                  className="h-12 w-auto object-contain"
                />
              )}
              <span className="inline-block px-4 py-2 bg-gray-100 rounded text-sm font-semibold text-gray-700">
                {product.brand}
              </span>
            </div>
          )}

          {/* Título */}
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
            {product.name}
          </h1>

          {/* Precio */}
          <div className="text-3xl font-bold text-primary-600">
            ${product.price?.toFixed(2)}
          </div>

          {/* Descripción */}
          {product.description && (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700">{product.description}</p>
            </div>
          )}

          {/* Características */}
          {attributes.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3">Características</h5>
              <table className="w-full">
                <tbody className="divide-y divide-gray-200">
                  {attributes.map((attr, index) => (
                    <tr key={index} className="text-sm">
                      <td className="py-2 pr-4 font-medium text-gray-700">{attr.key}</td>
                      <td className="py-2 text-gray-600">{attr.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Estado de stock */}
          <div className="space-y-2">
            {/* Stock en tienda oficial */}
            <div className="flex items-center gap-2">
              {hasStockInStore ? (
                <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-md font-medium text-sm flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  Stock en tienda
                </span>
              ) : (
                <span className="px-3 py-1.5 bg-red-100 text-red-800 rounded-md font-medium text-sm flex items-center gap-2">
                  <span className="text-lg">✗</span>
                  Sin stock en tienda
                </span>
              )}
            </div>

            {/* Stock en inventario personal (solo si está autenticado) */}
            {isAuthenticated && (
              <div className="flex items-center gap-2">
                {myStock > 0 ? (
                  <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md font-medium text-sm flex items-center gap-2">
                    <span className="text-lg">📦</span>
                    Stock en inventario: {myStock} unidades
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md font-medium text-sm flex items-center gap-2">
                    <span className="text-lg">📦</span>
                    Sin stock en inventario
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Selector de cantidad y botón de agregar al carrito */}
          {hasStockInStore && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded">
                  <button
                    onClick={decrementQuantity}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                    aria-label="Disminuir cantidad"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 1) setQuantity(value);
                    }}
                    className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none"
                    min="1"
                  />
                  <button
                    onClick={incrementQuantity}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="btn-primary flex-1"
                >
                  Añadir al carrito
                </button>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-sm text-gray-600 space-y-1 pt-4 border-t border-gray-200">
            {product.sku && (
              <p>
                <span className="font-medium">SKU:</span> {product.sku}
              </p>
            )}
            {product.category && (
              <p>
                <span className="font-medium">Categoría:</span> {product.category}
              </p>
            )}
          </div>

          {/* Botón volver */}
          <button
            onClick={() => navigate('/productos')}
            className="btn-secondary w-full mt-6"
          >
            ← Volver a productos
          </button>
        </div>
      </div>
    </div>
  );
}
