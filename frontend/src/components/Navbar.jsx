import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();
  const { getCartItemsCount } = useCart();
  const [showAuth, setShowAuth] = useState(false);

  // Mostrar botón de auth después de 2 segundos si Auth0 sigue cargando
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAuth(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-primary-600">
            Saphirus
          </Link>

          {/* Links de navegación */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Inicio
            </Link>

            <Link
              to="/productos"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Productos
            </Link>

            {/* Carrito */}
            <Link
              to="/carrito"
              className="relative text-gray-700 hover:text-primary-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {getCartItemsCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getCartItemsCount()}
                </span>
              )}
            </Link>

            {/* Auth */}
            {(!isLoading || showAuth) && (
              <>
                {isAuthenticated ? (
                  <div className="flex items-center gap-4">
                    <Link
                      to="/dashboard"
                      className="text-gray-700 hover:text-primary-600 transition-colors"
                    >
                      Dashboard
                    </Link>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {user?.name}
                      </span>
                      <button
                        onClick={logout}
                        className="btn-secondary text-sm"
                      >
                        Salir
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={login}
                    className="btn-primary"
                  >
                    Iniciar sesión
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
