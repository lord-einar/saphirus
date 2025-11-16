import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

// Páginas públicas
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import AccessDenied from './pages/AccessDenied';

// Páginas del dashboard (protegidas)
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import CreateOrder from './pages/CreateOrder';
import NewProducts from './pages/NewProducts';
import ScrapingDashboard from './pages/ScrapingDashboard';
import SupplierOrders from './pages/SupplierOrders';
import SalesPoints from './pages/SalesPoints';
import SalesPointDetail from './pages/SalesPointDetail';
import Settings from './pages/Settings';

function App() {
  const { accessDenied } = useAuth();

  // Si el acceso fue denegado, mostrar página de acceso denegado
  if (accessDenied) {
    return <AccessDenied />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="container mx-auto px-4 py-8">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/productos" element={<Products />} />
            <Route path="/producto/:id" element={<ProductDetail />} />
            <Route path="/carrito" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />

            {/* Rutas protegidas del dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/inventario"
              element={
                <ProtectedRoute>
                  <Inventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/pedidos"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/pedidos/:id"
              element={
                <ProtectedRoute>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/pedidos/crear"
              element={
                <ProtectedRoute>
                  <CreateOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/productos-nuevos"
              element={
                <ProtectedRoute>
                  <NewProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/lista-proveedor"
              element={
                <ProtectedRoute>
                  <SupplierOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/puestos-venta"
              element={
                <ProtectedRoute>
                  <SalesPoints />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/puestos-venta/:id"
              element={
                <ProtectedRoute>
                  <SalesPointDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/scraping"
              element={
                <ProtectedRoute>
                  <ScrapingDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/configuracion"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="text-center py-12">
                  <h1 className="text-4xl font-bold mb-4">404</h1>
                  <p className="text-gray-600">Página no encontrada</p>
                </div>
              }
            />
          </Routes>
        </main>

        <Toaster position="bottom-right" />
      </div>
    </Router>
  );
}

export default App;
