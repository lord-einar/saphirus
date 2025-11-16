import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import OrderForm from '../components/OrderForm';

export default function Checkout() {
  const { cart } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Carrito vacío</h1>
        <p className="text-gray-600 mb-6">
          No tienes productos en el carrito
        </p>
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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Finalizar compra</h1>

      <div className="mb-6">
        <h2 className="font-semibold mb-3">Productos en tu pedido:</h2>
        <div className="space-y-2">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-sm bg-gray-50 p-3 rounded">
              <span>
                {item.name} x{item.quantity}
              </span>
              <span className="font-semibold">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <OrderForm />
    </div>
  );
}
