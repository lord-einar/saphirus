import { useState, useEffect } from 'react';
import { getSupplierOrders, updateSupplierOrder, deleteSupplierOrder, createSupplierOrder, getProducts } from '../utils/api';
import toast from 'react-hot-toast';

export default function SupplierOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  // Modal agregar producto
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addQuantity, setAddQuantity] = useState(1);

  // Modal recepción
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState(null);
  const [receiveQuantity, setReceiveQuantity] = useState(0);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      loadProducts();
    }
  }, [searchTerm]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await getSupplierOrders(filter !== 'all' ? { status: filter } : {});
      setOrders(response.data);
    } catch (error) {
      console.error('Error al cargar pedidos al proveedor:', error);
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await getProducts({ search: searchTerm });
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProduct || addQuantity <= 0) {
      toast.error('Selecciona un producto y cantidad válida');
      return;
    }

    try {
      await createSupplierOrder({
        product_id: selectedProduct.id,
        quantity: addQuantity
      });

      toast.success('Producto agregado a la lista');
      setShowAddModal(false);
      setSelectedProduct(null);
      setAddQuantity(1);
      setSearchTerm('');
      loadOrders();
    } catch (error) {
      console.error('Error al agregar producto:', error);
      toast.error('Error al agregar producto');
    }
  };

  const markAsOrdered = async (id) => {
    try {
      await updateSupplierOrder(id, { status: 'ordered' });
      loadOrders();
      toast.success('Marcado como pedido');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar');
    }
  };

  const openReceiveModal = (order) => {
    setReceivingOrder(order);
    setReceiveQuantity(order.quantity);
    setShowReceiveModal(true);
  };

  const handleReceiveComplete = async () => {
    try {
      await updateSupplierOrder(receivingOrder.id, { status: 'received' });
      toast.success('Pedido marcado como recibido completo');
      setShowReceiveModal(false);
      setReceivingOrder(null);
      loadOrders();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar');
    }
  };

  const handleReceivePartial = async () => {
    if (receiveQuantity <= 0 || receiveQuantity > receivingOrder.quantity) {
      toast.error('Cantidad inválida');
      return;
    }

    try {
      if (receiveQuantity === receivingOrder.quantity) {
        // Si recibió todo, solo marcar como recibido
        await updateSupplierOrder(receivingOrder.id, { status: 'received' });
      } else {
        // Recibió parcial
        const remaining = receivingOrder.quantity - receiveQuantity;

        // Actualizar el registro actual con la cantidad recibida y marcar como recibido
        await updateSupplierOrder(receivingOrder.id, {
          quantity: receiveQuantity,
          status: 'received'
        });

        // Crear nuevo registro con la cantidad faltante como pendiente
        await createSupplierOrder({
          product_id: receivingOrder.product_id,
          quantity: remaining,
          notes: `Cantidad faltante de pedido anterior`
        });
      }

      toast.success('Recepción parcial registrada');
      setShowReceiveModal(false);
      setReceivingOrder(null);
      loadOrders();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al registrar recepción');
    }
  };

  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity <= 0) {
      if (window.confirm('¿Eliminar este producto de la lista?')) {
        await deleteOrder(id);
      }
      return;
    }

    try {
      await updateSupplierOrder(id, { quantity: newQuantity });
      loadOrders();
      toast.success('Cantidad actualizada');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar');
    }
  };

  const deleteOrder = async (id) => {
    try {
      await deleteSupplierOrder(id);
      loadOrders();
      toast.success('Producto eliminado');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar');
    }
  };

  const getTotalByStatus = () => {
    const totals = { pending: 0, ordered: 0, received: 0 };
    orders.forEach(order => {
      if (totals[order.status] !== undefined) {
        totals[order.status] += order.quantity;
      }
    });
    return totals;
  };

  const totals = getTotalByStatus();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lista de Pedidos al Proveedor</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          ➕ Agregar producto
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-800">{totals.pending}</p>
            </div>
            <span className="text-3xl">⏳</span>
          </div>
        </div>

        <div className="card bg-blue-50 border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Pedidos</p>
              <p className="text-2xl font-bold text-blue-800">{totals.ordered}</p>
            </div>
            <span className="text-3xl">📦</span>
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Recibidos</p>
              <p className="text-2xl font-bold text-green-800">{totals.received}</p>
            </div>
            <span className="text-3xl">✅</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('ordered')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'ordered' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pedidos
          </button>
          <button
            onClick={() => setFilter('received')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'received' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Recibidos
          </button>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Productos</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No hay productos en esta lista</p>
            <p className="text-sm text-gray-400">
              Los productos sin stock se agregarán aquí automáticamente al crear pedidos
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                {order.image_url && (
                  <img src={order.image_url} alt={order.product_name} className="w-20 h-20 object-cover rounded" />
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{order.product_name}</h3>
                  <p className="text-sm text-gray-600">{order.brand} • {order.category}</p>
                  {order.sku && <p className="text-xs text-gray-500 mt-1">SKU: {order.sku}</p>}
                  {order.notes && <p className="text-xs text-gray-600 mt-1 italic">{order.notes}</p>}
                </div>

                <div className="flex items-center gap-3">
                  {/* Cantidad */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(order.id, order.quantity - 1)}
                      className="w-8 h-8 rounded border hover:bg-gray-100"
                      disabled={order.status === 'received'}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={order.quantity}
                      onChange={(e) => updateQuantity(order.id, parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 border rounded text-center"
                      disabled={order.status === 'received'}
                    />
                    <button
                      onClick={() => updateQuantity(order.id, order.quantity + 1)}
                      className="w-8 h-8 rounded border hover:bg-gray-100"
                      disabled={order.status === 'received'}
                    >
                      +
                    </button>
                  </div>

                  {/* Botones de acción según estado */}
                  {order.status === 'pending' && (
                    <button
                      onClick={() => markAsOrdered(order.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      📤 Pedido realizado
                    </button>
                  )}

                  {order.status === 'ordered' && (
                    <button
                      onClick={() => openReceiveModal(order)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      ✅ Recibido
                    </button>
                  )}

                  {order.status === 'received' && (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                      ✓ Recibido
                    </span>
                  )}

                  {/* Eliminar */}
                  <button
                    onClick={() => {
                      if (window.confirm('¿Eliminar este producto de la lista?')) {
                        deleteOrder(order.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Agregar producto */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Agregar producto a lista</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedProduct(null);
                    setSearchTerm('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar producto
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre..."
                    className="input"
                    autoFocus
                  />
                </div>

                {searchTerm.length >= 2 && products.length > 0 && !selectedProduct && (
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    {products.map(product => (
                      <div
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        {product.image_url && (
                          <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">{product.brand} • {product.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedProduct && (
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <p className="text-sm text-gray-600 mb-2">Producto seleccionado:</p>
                    <div className="flex items-center gap-3">
                      {selectedProduct.image_url && (
                        <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-16 h-16 object-cover rounded" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{selectedProduct.name}</p>
                        <p className="text-sm text-gray-600">{selectedProduct.brand} • {selectedProduct.category}</p>
                      </div>
                      <button
                        onClick={() => setSelectedProduct(null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Cambiar
                      </button>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={addQuantity}
                        onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                        className="input w-32"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleAddProduct}
                    disabled={!selectedProduct}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    Agregar a lista
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedProduct(null);
                      setSearchTerm('');
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Recepción */}
      {showReceiveModal && receivingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Recepción de pedido</h3>

              <div className="mb-4">
                <p className="font-semibold">{receivingOrder.product_name}</p>
                <p className="text-sm text-gray-600">Cantidad pedida: {receivingOrder.quantity}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleReceiveComplete}
                  className="btn-primary w-full"
                >
                  ✅ Pedido completo
                </button>

                <div className="border-t pt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Pedido parcial:</p>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-sm">Cantidad recibida:</label>
                    <input
                      type="number"
                      min="1"
                      max={receivingOrder.quantity}
                      value={receiveQuantity}
                      onChange={(e) => setReceiveQuantity(parseInt(e.target.value) || 1)}
                      className="input w-24"
                    />
                    <span className="text-sm text-gray-600">de {receivingOrder.quantity}</span>
                  </div>
                  <button
                    onClick={handleReceivePartial}
                    className="btn-secondary w-full"
                  >
                    📦 Recibido parcial
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowReceiveModal(false);
                    setReceivingOrder(null);
                  }}
                  className="btn-secondary w-full"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
