import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSalesPoints, deleteSalesPoint, createSalesPoint, updateSalesPoint } from '../utils/api';
import toast from 'react-hot-toast';

export default function SalesPoints() {
  const navigate = useNavigate();
  const [salesPoints, setSalesPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contact_name: '',
    contact_phone: '',
    notes: ''
  });

  useEffect(() => {
    loadSalesPoints();
  }, []);

  const loadSalesPoints = async () => {
    try {
      setLoading(true);
      const response = await getSalesPoints();
      setSalesPoints(response.data);
    } catch (error) {
      console.error('Error al cargar puestos de venta:', error);
      toast.error('Error al cargar puestos de venta');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingPoint(null);
    setFormData({
      name: '',
      location: '',
      contact_name: '',
      contact_phone: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (point) => {
    setEditingPoint(point);
    setFormData({
      name: point.name,
      location: point.location || '',
      contact_name: point.contact_name || '',
      contact_phone: point.contact_phone || '',
      notes: point.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      if (editingPoint) {
        await updateSalesPoint(editingPoint.id, formData);
        toast.success('Puesto de venta actualizado');
      } else {
        await createSalesPoint(formData);
        toast.success('Puesto de venta creado');
      }
      setShowModal(false);
      loadSalesPoints();
    } catch (error) {
      console.error('Error al guardar puesto:', error);
      toast.error('Error al guardar puesto de venta');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de eliminar el puesto "${name}"?`)) {
      return;
    }

    try {
      await deleteSalesPoint(id);
      toast.success('Puesto eliminado');
      loadSalesPoints();
    } catch (error) {
      console.error('Error al eliminar puesto:', error);
      toast.error('Error al eliminar puesto');
    }
  };

  const handleToggleStatus = async (point) => {
    const newStatus = point.status === 'active' ? 'inactive' : 'active';
    try {
      await updateSalesPoint(point.id, { status: newStatus });
      toast.success(`Puesto ${newStatus === 'active' ? 'activado' : 'desactivado'}`);
      loadSalesPoints();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error('Error al cambiar estado');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando puestos de venta...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Puestos de Venta</h1>
        <button onClick={handleCreateNew} className="btn-primary">
          + Nuevo Puesto
        </button>
      </div>

      {salesPoints.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">No tienes puestos de venta todavía</p>
          <button onClick={handleCreateNew} className="btn-primary">
            Crear primer puesto
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salesPoints.map(point => (
            <div key={point.id} className="card hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {point.name}
                  </h3>
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    point.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {point.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Información de contacto */}
              {(point.location || point.contact_name || point.contact_phone) && (
                <div className="text-sm text-gray-600 space-y-1 mb-4 pb-4 border-b">
                  {point.location && (
                    <p className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{point.location}</span>
                    </p>
                  )}
                  {point.contact_name && (
                    <p className="flex items-center gap-2">
                      <span>👤</span>
                      <span>{point.contact_name}</span>
                    </p>
                  )}
                  {point.contact_phone && (
                    <p className="flex items-center gap-2">
                      <span>📞</span>
                      <span>{point.contact_phone}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Estadísticas */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Productos</p>
                  <p className="text-lg font-bold text-blue-900">
                    {point.stats?.total_products || 0}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Vendidos</p>
                  <p className="text-lg font-bold text-green-900">
                    {point.stats?.total_sold || 0}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Recaudado</p>
                  <p className="text-lg font-bold text-purple-900">
                    ${(point.stats?.total_revenue || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Esperado</p>
                  <p className="text-lg font-bold text-orange-900">
                    ${(point.stats?.total_expected || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/dashboard/puestos-venta/${point.id}`)}
                  className="btn-primary flex-1"
                >
                  Ver Detalles
                </button>
                <button
                  onClick={() => handleEdit(point)}
                  className="btn-secondary px-4"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleToggleStatus(point)}
                  className="btn-secondary px-4"
                  title={point.status === 'active' ? 'Desactivar' : 'Activar'}
                >
                  {point.status === 'active' ? '🔒' : '🔓'}
                </button>
                <button
                  onClick={() => handleDelete(point.id, point.name)}
                  className="btn-secondary px-4 hover:bg-red-100"
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              {editingPoint ? 'Editar Puesto de Venta' : 'Nuevo Puesto de Venta'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del puesto *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                  placeholder="Ej: Kiosco Central"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input"
                  placeholder="Ej: Av. Principal 123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del contacto
                </label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="input"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="input"
                  placeholder="Ej: +54 11 1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows="3"
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingPoint ? 'Guardar Cambios' : 'Crear Puesto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
