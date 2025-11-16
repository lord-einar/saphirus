import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../utils/api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await getOrders(params);
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const labels = {
      pending: 'Pendiente',
      completed: 'Completado',
      cancelled: 'Cancelado'
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
        <p className="text-gray-600">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pedidos</h1>

      {/* Filtros */}
      <div className="flex gap-3">
        <button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={filter === 'pending' ? 'btn-primary' : 'btn-secondary'}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={filter === 'completed' ? 'btn-primary' : 'btn-secondary'}
        >
          Completados
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={filter === 'cancelled' ? 'btn-primary' : 'btn-secondary'}
        >
          Cancelados
        </button>
      </div>

      {/* Lista de pedidos */}
      {orders.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No hay pedidos para mostrar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/dashboard/pedidos/${order.id}`}
              className="card hover:shadow-md transition-shadow block"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">
                    Pedido #{order.id}
                  </h3>
                  <p className="text-gray-600">
                    {order.customer_name} {order.customer_lastname}
                  </p>
                  <p className="text-sm text-gray-500">{order.customer_phone}</p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                  {new Date(order.created_at).toLocaleString('es-AR')}
                </span>
                <span className="text-primary-600 font-semibold">
                  Ver detalles →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
