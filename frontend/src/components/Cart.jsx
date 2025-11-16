import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">Tu carrito está vacío</p>
        <button
          onClick={() => navigate('/productos')}
          className="btn-primary"
        >
          Ver productos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cart.map(item => (
        <div key={item.id} className="card flex gap-4">
          <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                Sin imagen
              </div>
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{item.name}</h3>
            {item.brand && (
              <p className="text-sm text-primary-600">{item.brand}</p>
            )}
            <p className="text-lg font-bold text-gray-900 mt-1">
              ${item.price?.toFixed(2)}
            </p>
          </div>

          <div className="flex flex-col items-end justify-between">
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Eliminar
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
              >
                -
              </button>
              <span className="w-12 text-center font-semibold">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
              >
                +
              </button>
            </div>

            <p className="font-bold text-gray-900">
              ${(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        </div>
      ))}

      <div className="card bg-gray-50">
        <div className="flex justify-between items-center text-xl font-bold">
          <span>Total:</span>
          <span>${getCartTotal().toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={() => navigate('/checkout')}
        className="btn-primary w-full text-lg py-3"
      >
        Finalizar compra
      </button>
    </div>
  );
}
