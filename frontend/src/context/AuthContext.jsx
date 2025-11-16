import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { setAuthToken, setupAccessDeniedInterceptor } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently
  } = useAuth0();

  const [accessDenied, setAccessDenied] = useState(false);

  // Configurar interceptor para detectar acceso denegado
  useEffect(() => {
    setupAccessDeniedInterceptor(() => {
      setAccessDenied(true);
    });
  }, []);

  // Configurar token en axios cuando el usuario se autentique
  useEffect(() => {
    const configureToken = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          setAuthToken(token);
        } catch (error) {
          console.error('Error al obtener token:', error);
        }
      } else {
        setAuthToken(null);
        setAccessDenied(false);
      }
    };

    configureToken();
  }, [isAuthenticated, getAccessTokenSilently]);

  const login = () => {
    loginWithRedirect();
  };

  const logout = () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
    setAuthToken(null);
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    getAccessTokenSilently,
    accessDenied
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
