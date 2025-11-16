import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { createOrder } from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function OrderForm() {
  const { cart, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_lastname: '',
    customer_phone: '',
    customer_notes: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        ...formData,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      };

      const response = await createOrder(orderData);

      toast.success('¡Pedido realizado con éxito!');
      clearCart();

      // Redirigir a página de confirmación
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error al crear pedido:', error);
      toast.error('Error al procesar el pedido. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Información de contacto</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              required
              className="input"
              placeholder="Juan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apellido *
            </label>
            <input
              type="text"
              name="customer_lastname"
              value={formData.customer_lastname}
              onChange={handleChange}
              required
              className="input"
              placeholder="Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              name="customer_phone"
              value={formData.customer_phone}
              onChange={handleChange}
              required
              className="input"
              placeholder="+54 9 11 1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas adicionales (opcional)
            </label>
            <textarea
              name="customer_notes"
              value={formData.customer_notes}
              onChange={handleChange}
              rows="3"
              className="input"
              placeholder="Instrucciones especiales, preferencias de entrega, etc."
            />
          </div>
        </div>
      </div>

      <div className="card bg-gray-50">
        <h3 className="font-semibold mb-2">Resumen del pedido</h3>
        <div className="flex justify-between items-center text-xl font-bold">
          <span>Total:</span>
          <span>${getCartTotal().toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {cart.length} producto{cart.length !== 1 ? 's' : ''}
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || cart.length === 0}
        className="btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Procesando...' : 'Confirmar pedido'}
      </button>
    </form>
  );
}
