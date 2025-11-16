import { useAuth } from '../context/AuthContext';

export default function AccessDenied() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 px-4">
      <div className="max-w-md w-full">
        <div className="card text-center py-12">
          {/* Icono */}
          <div className="text-8xl mb-6">🚫</div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Acceso Denegado
          </h1>

          {/* Mensaje */}
          <div className="space-y-4 mb-8">
            <p className="text-gray-600">
              Tu cuenta no tiene permisos para acceder a este sistema.
            </p>

            {user?.email && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Email utilizado:</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
              <p className="text-sm text-blue-900 font-medium mb-2">
                ℹ️ ¿Necesitas acceso?
              </p>
              <p className="text-sm text-blue-800">
                Si crees que deberías tener acceso a este sistema, contacta al administrador para solicitar autorización.
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="space-y-3">
            <button
              onClick={logout}
              className="btn-primary w-full"
            >
              Cerrar Sesión
            </button>

            <button
              onClick={() => window.location.href = 'mailto:marisojeda50@gmail.com,germanojeda83@gmail.com?subject=Solicitud de Acceso al Sistema Saphirus'}
              className="btn-secondary w-full"
            >
              ✉️ Contactar Administrador
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Sistema Saphirus - Acceso Restringido
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
