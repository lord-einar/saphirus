import { useState, useEffect } from 'react';
import { getSettings, updateNotificationEmail } from '../utils/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await getSettings();
      setSettings(response.data);
      setEmail(response.data.notification_email);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Email inválido');
      return;
    }

    setSaving(true);
    try {
      await updateNotificationEmail(email);
      toast.success('Configuración guardada');
      loadSettings();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuración</h1>

      {/* Información de cuenta */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Información de cuenta</h2>
        <div className="space-y-2">
          <p><strong>Nombre:</strong> {settings?.name || 'N/A'}</p>
          <p><strong>Email:</strong> {settings?.email || 'N/A'}</p>
        </div>
      </div>

      {/* Email de notificaciones */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Email de notificaciones</h2>
        <p className="text-gray-600 mb-4">
          Los pedidos nuevos se enviarán a este email
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
              placeholder="tu-email@ejemplo.com"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* Ayuda */}
      <div className="card bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Ayuda</h2>
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>Configuración de Gmail:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Ve a tu cuenta de Google</li>
            <li>Habilita verificación en 2 pasos</li>
            <li>Genera una "Contraseña de aplicación"</li>
            <li>Usa esa contraseña en la configuración del backend (.env)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
