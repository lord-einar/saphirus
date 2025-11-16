import { useState, useEffect } from 'react';
import { getNewProducts } from '../utils/api';
import ProductCard from '../components/ProductCard';

export default function NewProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNewProducts();
  }, []);

  const loadNewProducts = async () => {
    try {
      const response = await getNewProducts();
      setProducts(response.data);
    } catch (error) {
      console.error('Error al cargar productos nuevos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando productos nuevos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Productos Nuevos</h1>

      <div className="card bg-blue-50 border-blue-200">
        <p className="text-blue-800">
          ℹ️ Estos productos fueron detectados en el último scraping y no existían antes en el catálogo.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No hay productos nuevos</p>
        </div>
      ) : (
        <>
          <p className="text-gray-600">
            {products.length} producto{products.length !== 1 ? 's' : ''} nuevo{products.length !== 1 ? 's' : ''}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
