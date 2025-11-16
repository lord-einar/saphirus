import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder, updateOrderItem, completeOrder, cancelOrder } from '../utils/api';
import toast from 'react-hot-toast';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const response = await getOrder(id);
      setOrder(response.data);
    } catch (error) {
      console.error('Error al cargar pedido:', error);
      toast.error('Error al cargar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (itemId, status, replacedProductId = null) => {
    try {
      await updateOrderItem(id, itemId, {
        status,
        replaced_with_product_id: replacedProductId
      });
      toast.success('Item actualizado');
      loadOrder();
    } catch (error) {
      console.error('Error al actualizar item:', error);
      toast.error('Error al actualizar item');
    }
  };

  const handleCompleteOrder = async () => {
    if (!confirm('¿Marcar este pedido como completado?')) return;

    try {
      await completeOrder(id);
      toast.success('Pedido completado');
      navigate('/dashboard/pedidos');
    } catch (error) {
      console.error('Error al completar pedido:', error);
      toast.error('Error al completar pedido');
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('¿Estás seguro de cancelar este pedido?')) return;

    try {
      await cancelOrder(id);
      toast.success('Pedido cancelado');
      navigate('/dashboard/pedidos');
    } catch (error) {
      console.error('Error al cancelar pedido:', error);
      toast.error('Error al cancelar pedido');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-gray-100 text-gray-800',
      sold: 'bg-green-100 text-green-800',
      not_sold: 'bg-red-100 text-red-800',
      replaced: 'bg-blue-100 text-blue-800'
    };

    const labels = {
      pending: 'Pendiente',
      sold: 'Vendido',
      not_sold: 'No vendido',
      replaced: 'Reemplazado'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Pedido no encontrado</p>
      </div>
    );
  }

  const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pedido #{order.id}</h1>
        <button
          onClick={() => navigate('/dashboard/pedidos')}
          className="btn-secondary"
        >
          ← Volver
        </button>
      </div>

      {/* Información del cliente */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Información del cliente</h2>
        <div className="space-y-2">
          <p><strong>Nombre:</strong> {order.customer_name} {order.customer_lastname}</p>
          <p><strong>Teléfono:</strong> {order.customer_phone}</p>
          {order.customer_notes && (
            <p><strong>Notas:</strong> {order.customer_notes}</p>
          )}
          <p><strong>Fecha:</strong> {new Date(order.created_at).toLocaleString('es-AR')}</p>
          <p><strong>Estado:</strong> {getStatusBadge(order.status)}</p>
        </div>
      </div>

      {/* Items del pedido */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Productos</h2>
        <div className="space-y-4">
          {order.items.map(item => (
            <div key={item.id} className="border-b pb-4 last:border-b-0">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold">{item.product_name}</h3>
                  {item.brand && (
                    <p className="text-sm text-primary-600">{item.brand}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    Cantidad: {item.quantity} × ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}
                  </p>
                  <div className="mt-2">
                    {getStatusBadge(item.status)}
                  </div>

                  {item.replaced_with_product_id && (
                    <p className="text-sm text-blue-600 mt-1">
                      Reemplazado con: {item.replaced_product_name}
                    </p>
                  )}
                </div>

                {order.status === 'pending' && item.status === 'pending' && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleUpdateItem(item.id, 'sold')}
                      className="btn-primary text-xs px-3 py-1"
                    >
                      ✓ Vendido
                    </button>
                    <button
                      onClick={() => handleUpdateItem(item.id, 'not_sold')}
                      className="btn-danger text-xs px-3 py-1"
                    >
                      ✗ No vendido
                    </button>
                    <button
                      onClick={() => {
                        const productId = prompt('Ingresa el ID del producto de reemplazo:');
                        if (productId) {
                          handleUpdateItem(item.id, 'replaced', parseInt(productId));
                        }
                      }}
                      className="btn-secondary text-xs px-3 py-1"
                    >
                      🔄 Reemplazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between items-center text-xl font-bold">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Acciones */}
      {order.status === 'pending' && (
        <div className="flex gap-4">
          <button
            onClick={handleCompleteOrder}
            className="btn-primary flex-1"
          >
            Marcar como completado
          </button>
          <button
            onClick={handleCancelOrder}
            className="btn-danger flex-1"
          >
            Cancelar pedido
          </button>
        </div>
      )}
    </div>
  );
}
