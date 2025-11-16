import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getOrders, getInventory, getLatestScraping } from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    pendingOrders: 0,
    inventoryItems: 0,
    lastScraping: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [ordersRes, inventoryRes, scrapingRes] = await Promise.all([
        getOrders({ status: 'pending' }),
        getInventory(),
        getLatestScraping()
      ]);

      setStats({
        pendingOrders: ordersRes.data.orders.length,
        inventoryItems: inventoryRes.data.length,
        lastScraping: scrapingRes.data
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/dashboard/pedidos" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pedidos pendientes</p>
              <p className="text-3xl font-bold text-primary-600">
                {stats.pendingOrders}
              </p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </Link>

        <Link to="/dashboard/inventario" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Productos en inventario</p>
              <p className="text-3xl font-bold text-primary-600">
                {stats.inventoryItems}
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </Link>

        <Link to="/dashboard/scraping" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Último scraping</p>
              <p className="text-lg font-bold text-primary-600">
                {stats.lastScraping?.status === 'success' ? '✓ Exitoso' : '✗ Error'}
              </p>
              {stats.lastScraping && (
                <p className="text-xs text-gray-500">
                  {new Date(stats.lastScraping.created_at).toLocaleString('es-AR')}
                </p>
              )}
            </div>
            <div className="text-4xl">🔄</div>
          </div>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Acciones rápidas</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link to="/dashboard/pedidos/crear" className="btn-primary text-center bg-blue-600 hover:bg-blue-700">
            ➕ Crear pedido manual
          </Link>
          <Link to="/dashboard/pedidos" className="btn-primary text-center">
            📦 Ver pedidos
          </Link>
          <Link to="/dashboard/lista-proveedor" className="btn-primary text-center bg-orange-600 hover:bg-orange-700">
            📋 Lista pedidos proveedor
          </Link>
          <Link to="/dashboard/puestos-venta" className="btn-primary text-center bg-purple-600 hover:bg-purple-700">
            🏪 Puestos de venta
          </Link>
          <Link to="/dashboard/inventario" className="btn-primary text-center">
            📊 Gestionar inventario
          </Link>
          <Link to="/dashboard/scraping" className="btn-primary text-center bg-green-600 hover:bg-green-700">
            🔄 Ejecutar scraping manual
          </Link>
          <Link to="/dashboard/productos-nuevos" className="btn-secondary text-center">
            ✨ Productos nuevos
          </Link>
          <Link to="/dashboard/configuracion" className="btn-secondary text-center">
            ⚙️ Configuración
          </Link>
        </div>
      </div>
    </div>
  );
}
