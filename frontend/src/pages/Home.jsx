import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getProducts } from '../utils/api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const response = await getProducts({ limit: 8 });
      setFeaturedProducts(response.data.products);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-2xl p-12 text-center">
        <h1 className="text-5xl font-bold mb-4">Bienvenido a Saphirus</h1>
        <p className="text-xl mb-8 text-primary-100">
          Productos de limpieza y cuidado del hogar
        </p>
        <button
          onClick={() => navigate('/productos')}
          className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
        >
          Ver todos los productos
        </button>
      </section>

      {/* Featured products */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Productos destacados</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando productos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Info section */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-4xl mb-3">🚚</div>
          <h3 className="font-bold text-lg mb-2">Envío rápido</h3>
          <p className="text-gray-600">Entrega en todo el país</p>
        </div>

        <div className="card text-center">
          <div className="text-4xl mb-3">💳</div>
          <h3 className="font-bold text-lg mb-2">Pago seguro</h3>
          <p className="text-gray-600">Múltiples medios de pago</p>
        </div>

        <div className="card text-center">
          <div className="text-4xl mb-3">✨</div>
          <h3 className="font-bold text-lg mb-2">Calidad garantizada</h3>
          <p className="text-gray-600">Productos de primera calidad</p>
        </div>
      </section>
    </div>
  );
}
