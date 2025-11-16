import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token de Auth0
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Configurar interceptor para detectar acceso denegado (403)
export const setupAccessDeniedInterceptor = (onAccessDenied) => {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 403) {
        // Llamar callback cuando se detecta acceso denegado
        onAccessDenied();
      }
      return Promise.reject(error);
    }
  );
};

// PRODUCTOS
export const getProducts = (params = {}) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const getBrands = () => api.get('/products/brands');
export const getCategories = (params = {}) => api.get('/products/categories', { params });
export const getNewProducts = () => api.get('/products/new');
export const getRemovedProducts = () => api.get('/products/removed');

// AUTH
export const getUser = () => api.get('/auth/user');

// INVENTARIO
export const getInventory = () => api.get('/inventory');
export const addToInventory = (productId, stock) => api.post(`/inventory/${productId}`, { stock });
export const updateInventoryStock = (productId, stock) => api.put(`/inventory/${productId}`, { stock });
export const removeFromInventory = (productId) => api.delete(`/inventory/${productId}`);

// PEDIDOS
export const createOrder = (orderData) => api.post('/orders', orderData);
export const getOrders = (params = {}) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const updateOrderItem = (orderId, itemId, data) =>
  api.put(`/orders/${orderId}/items/${itemId}`, data);
export const completeOrder = (orderId) => api.put(`/orders/${orderId}/complete`);
export const cancelOrder = (orderId) => api.put(`/orders/${orderId}/cancel`);

// SCRAPING
export const runScraping = () => api.post('/scraping/run');
export const getScrapingLogs = (params = {}) => api.get('/scraping/logs', { params });
export const getLatestScraping = () => api.get('/scraping/latest');

// CONFIGURACIÓN
export const getSettings = () => api.get('/settings');
export const updateNotificationEmail = (email) => api.put('/settings/email', { notification_email: email });

// PEDIDOS AL PROVEEDOR
export const getSupplierOrders = (params = {}) => api.get('/supplier-orders', { params });
export const createSupplierOrder = (data) => api.post('/supplier-orders', data);
export const updateSupplierOrder = (id, data) => api.put(`/supplier-orders/${id}`, data);
export const deleteSupplierOrder = (id) => api.delete(`/supplier-orders/${id}`);

// PUESTOS DE VENTA
export const getSalesPoints = (params = {}) => api.get('/sales-points', { params });
export const getSalesPoint = (id) => api.get(`/sales-points/${id}`);
export const createSalesPoint = (data) => api.post('/sales-points', data);
export const updateSalesPoint = (id, data) => api.put(`/sales-points/${id}`, data);
export const deleteSalesPoint = (id) => api.delete(`/sales-points/${id}`);
export const getSalesPointInventory = (salesPointId) => api.get(`/sales-points/${salesPointId}/inventory`);
export const addProductToSalesPoint = (salesPointId, data) => api.post(`/sales-points/${salesPointId}/inventory`, data);
export const updateSalesPointProduct = (salesPointId, itemId, data) => api.put(`/sales-points/${salesPointId}/inventory/${itemId}`, data);
export const removeProductFromSalesPoint = (salesPointId, itemId) => api.delete(`/sales-points/${salesPointId}/inventory/${itemId}`);

export default api;
