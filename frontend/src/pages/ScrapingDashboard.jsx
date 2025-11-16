import { useState, useEffect } from 'react';
import { getScrapingLogs, runScraping } from '../utils/api';
import toast from 'react-hot-toast';

export default function ScrapingDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await getScrapingLogs({ limit: 10 });
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Error al cargar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScraping = async () => {
    if (!confirm('¿Iniciar scraping manual? Esto puede tardar varios minutos.')) {
      return;
    }

    setRunning(true);
    try {
      await runScraping();
      toast.success('Scraping iniciado. Revisa los logs en unos minutos.');

      // Recargar logs después de 30 segundos
      setTimeout(() => {
        loadLogs();
        setRunning(false);
      }, 30000);
    } catch (error) {
      console.error('Error al ejecutar scraping:', error);
      toast.error('Error al iniciar scraping');
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Scraping Dashboard</h1>
        <button
          onClick={handleRunScraping}
          disabled={running}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? 'Ejecutando...' : '▶ Ejecutar scraping manual'}
        </button>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• El scraping automático se ejecuta todos los días a las 3:00 AM</li>
          <li>• Detecta productos nuevos y productos dados de baja</li>
          <li>• Actualiza precios y datos de productos existentes</li>
          <li>• Puedes ejecutar scraping manual en cualquier momento</li>
        </ul>
      </div>

      {/* Historial de scraping */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Historial de scraping</h2>

        {logs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay logs de scraping</p>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div
                key={log.id}
                className={`p-4 rounded-lg border-l-4 ${
                  log.status === 'success'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`font-semibold ${
                      log.status === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {log.status === 'success' ? '✓ Exitoso' : '✗ Error'}
                    </span>
                    <p className="text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString('es-AR')}
                    </p>
                  </div>

                  <div className="text-right text-sm">
                    <p className="text-gray-700">
                      <strong>{log.products_found}</strong> productos encontrados
                    </p>
                    {log.new_products > 0 && (
                      <p className="text-green-600">
                        <strong>{log.new_products}</strong> nuevos
                      </p>
                    )}
                    {log.removed_products > 0 && (
                      <p className="text-red-600">
                        <strong>{log.removed_products}</strong> dados de baja
                      </p>
                    )}
                  </div>
                </div>

                {log.error_message && (
                  <p className="text-sm text-red-700 mt-2">
                    Error: {log.error_message}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
