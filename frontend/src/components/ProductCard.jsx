import { useCart } from '../context/CartContext';
import { useBrands } from '../context/BrandContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { getBrandLogo } = useBrands();
  const navigate = useNavigate();

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Evitar que se active el click del card
    addToCart(product, 1);
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleCardClick = () => {
    navigate(`/producto/${product.id}`);
  };

  // Parsear labels si existen
  const labels = product.labels ? JSON.parse(product.labels) : [];

  return (
    <div
      onClick={handleCardClick}
      className="card hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Sin imagen
          </div>
        )}

        {/* Labels/Rótulos especiales */}
        {labels.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {labels.map((label, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-xs font-bold rounded shadow-md ${
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
      </div>

      <div className="space-y-2">
        {product.brand && (
          <div className="flex items-center gap-2">
            {getBrandLogo(product.brand) && (
              <img
                src={`${import.meta.env.VITE_API_URL}${getBrandLogo(product.brand)}`}
                alt={product.brand}
                className="h-6 w-auto object-contain"
              />
            )}
            <p className="text-xs text-primary-600 font-semibold uppercase">
              {product.brand}
            </p>
          </div>
        )}

        <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {product.category && (
          <p className="text-xs text-gray-500">{product.category}</p>
        )}

        <div className="flex items-center justify-between pt-2">
          <p className="text-2xl font-bold text-gray-900">
            ${product.price?.toFixed(2) || '0.00'}
          </p>

          <button
            onClick={handleAddToCart}
            className="btn-primary text-sm"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
