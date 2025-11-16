import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getSalesPoint,
  getSalesPointInventory,
  addProductToSalesPoint,
  updateSalesPointProduct,
  removeProductFromSalesPoint,
  getProducts,
  getBrands,
  getCategories
} from '../utils/api';
import toast from 'react-hot-toast';

export default function SalesPointDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [salesPoint, setSalesPoint] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Para agregar productos
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');

  useEffect(() => {
    loadSalesPoint();
    loadInventory();
  }, [id]);

  const loadSalesPoint = async () => {
    try {
      const response = await getSalesPoint(id);
      setSalesPoint(response.data);
    } catch (error) {
      console.error('Error al cargar puesto:', error);
      toast.error('Error al cargar puesto de venta');
      navigate('/dashboard/puestos-venta');
    }
  };

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await getSalesPointInventory(id);
      setInventory(response.data);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const params = {};
      if (selectedBrand) params.brand = selectedBrand;
      if (selectedCategory) params.category = selectedCategory;
      if (search) params.search = search;

      const response = await getProducts(params);
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await getBrands();
      setBrands(response.data);
    } catch (error) {
      console.error('Error al cargar marcas:', error);
    }
  };

  const loadCategories = async (brand = '') => {
    try {
      const params = brand ? { brand } : {};
      const response = await getCategories(params);
      setCategories(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  useEffect(() => {
    if (showAddModal) {
      loadBrands();
      loadProducts();
    }
  }, [showAddModal]);

  useEffect(() => {
    if (showAddModal) {
      loadCategories(selectedBrand);
    }
  }, [selectedBrand]);

  useEffect(() => {
    if (showAddModal) {
      loadProducts();
    }
  }, [selectedBrand, selectedCategory, search]);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setPrice(product.price || '');
    setQuantity(1);
  };

  const handleAddProduct = async () => {
    if (!selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast.error('Ingresa un precio válido');
      return;
    }
    if (quantity <= 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }

    try {
      await addProductToSalesPoint(id, {
        product_id: selectedProduct.id,
        quantity: quantity,
        price: parseFloat(price)
      });
      toast.success('Producto agregado al puesto');
      setShowAddModal(false);
      setSelectedProduct(null);
      setQuantity(1);
      setPrice('');
      loadInventory();
      loadSalesPoint(); // Recargar para actualizar stats
    } catch (error) {
      console.error('Error al agregar producto:', error);
      toast.error('Error al agregar producto');
    }
  };

  const handleUpdateSold = async (item, newQuantitySold) => {
    if (newQuantitySold < 0 || newQuantitySold > item.quantity_assigned) {
      toast.error(`La cantidad debe estar entre 0 y ${item.quantity_assigned}`);
      return;
    }

    try {
      await updateSalesPointProduct(id, item.id, {
        quantity_sold: newQuantitySold
      });
      toast.success('Cantidad actualizada');
      loadInventory();
      loadSalesPoint();
    } catch (error) {
      console.error('Error al actualizar:', error);
      toast.error(error.response?.data?.error || 'Error al actualizar cantidad');
    }
  };

  const handleRemoveProduct = async (itemId, productName) => {
    if (!window.confirm(`¿Eliminar "${productName}" del puesto?`)) {
      return;
    }

    try {
      await removeProductFromSalesPoint(id, itemId);
      toast.success('Producto eliminado');
      loadInventory();
      loadSalesPoint();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar producto');
    }
  };

  if (!salesPoint) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  const stats = salesPoint.stats || {};
  const totalAssigned = stats.total_assigned || 0;
  const totalSold = stats.total_sold || 0;
  const totalPending = stats.total_pending || 0;
  const totalRevenue = stats.total_revenue || 0;
  const totalExpected = stats.total_expected || 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/puestos-venta')}
          className="text-sm text-gray-600 hover:text-primary-600 mb-2"
        >
          ← Volver a puestos de venta
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{salesPoint.name}</h1>
            {salesPoint.location && (
              <p className="text-gray-600 mt-1">📍 {salesPoint.location}</p>
            )}
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            + Agregar Productos
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid md:grid-cols-5 gap-4 mb-6">
        <div className="card bg-blue-50">
          <p className="text-sm text-gray-600">Asignados</p>
          <p className="text-2xl font-bold text-blue-900">{totalAssigned}</p>
        </div>
        <div className="card bg-green-50">
          <p className="text-sm text-gray-600">Vendidos</p>
          <p className="text-2xl font-bold text-green-900">{totalSold}</p>
        </div>
        <div className="card bg-orange-50">
          <p className="text-sm text-gray-600">Pendientes</p>
          <p className="text-2xl font-bold text-orange-900">{totalPending}</p>
        </div>
        <div className="card bg-purple-50">
          <p className="text-sm text-gray-600">Recaudado</p>
          <p className="text-2xl font-bold text-purple-900">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="card bg-gray-50">
          <p className="text-sm text-gray-600">Esperado</p>
          <p className="text-2xl font-bold text-gray-900">${totalExpected.toFixed(2)}</p>
        </div>
      </div>

      {/* Inventario */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Productos en el puesto</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Cargando inventario...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <p className="mb-4">No hay productos en este puesto</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              Agregar primer producto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Asignados</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Vendidos</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pendientes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recaudado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Esperado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventory.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-xs text-gray-500">{item.product_brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">${item.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">{item.quantity_assigned}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleUpdateSold(item, item.quantity_sold - 1)}
                          disabled={item.quantity_sold <= 0}
                          className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.quantity_sold}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            handleUpdateSold(item, val);
                          }}
                          className="w-16 text-center border border-gray-300 rounded px-1 py-1 text-sm"
                          min="0"
                          max={item.quantity_assigned}
                        />
                        <button
                          onClick={() => handleUpdateSold(item, item.quantity_sold + 1)}
                          disabled={item.quantity_sold >= item.quantity_assigned}
                          className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        item.quantity_pending === 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.quantity_pending}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-green-700">
                      ${item.revenue.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-600">
                      ${item.expected_revenue.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemoveProduct(item.id, item.product_name)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Agregar Productos */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Agregar Productos al Puesto</h2>

            {/* Filtros */}
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input"
                  placeholder="Buscar productos..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="input"
                >
                  <option value="">Todas</option>
                  {brands.map(brand => (
                    <option
                      key={typeof brand === 'string' ? brand : brand.name}
                      value={typeof brand === 'string' ? brand : brand.name}
                    >
                      {typeof brand === 'string' ? brand : brand.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input"
                >
                  <option value="">Todas</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista de productos */}
            <div className="border rounded-lg mb-4 max-h-60 overflow-y-auto">
              {products.length === 0 ? (
                <p className="text-center text-gray-600 py-4">No se encontraron productos</p>
              ) : (
                <div className="divide-y">
                  {products.map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className={`w-full p-3 text-left hover:bg-gray-50 flex items-center gap-3 ${
                        selectedProduct?.id === product.id ? 'bg-primary-50' : ''
                      }`}
                    >
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.brand} - ${product.price}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Producto seleccionado */}
            {selectedProduct && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Producto seleccionado:</h3>
                <div className="bg-gray-50 p-3 rounded mb-4">
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-sm text-gray-600">{selectedProduct.brand}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="input"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio de venta *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="input"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button onClick={handleAddProduct} className="btn-primary flex-1">
                    Agregar al Puesto
                  </button>
                </div>
              </div>
            )}

            {!selectedProduct && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
