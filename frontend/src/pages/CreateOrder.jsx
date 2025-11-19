import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInventory, createOrder, createSupplierOrder } from '../utils/api';
import toast from 'react-hot-toast';
import ProductPicker from '../components/ProductPicker';

export default function CreateOrder() {
  const navigate = useNavigate();

  // Modal para seleccionar producto
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Inventario
  const [inventory, setInventory] = useState({});

  // Carrito del pedido
  const [orderItems, setOrderItems] = useState([]);

  // Datos del cliente
  const [customerName, setCustomerName] = useState('');
  const [customerLastname, setCustomerLastname] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Estado de envío
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const response = await getInventory();
      const inventoryMap = {};
      response.data.forEach(item => {
        inventoryMap[item.product_id] = item.stock;
      });
      setInventory(inventoryMap);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
    }
  };

  const getStock = (productId) => {
    return inventory[productId] || 0;
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };

  const addToOrder = () => {
    if (!selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }

    const existing = orderItems.find(item => item.product_id === selectedProduct.id);

    if (existing) {
      toast.error('Este producto ya está en el pedido');
      return;
    }

    setOrderItems([...orderItems, {
      product_id: selectedProduct.id,
      product: selectedProduct,
      quantity: 1,
      price: selectedProduct.price
    }]);

    toast.success(`${selectedProduct.name} agregado al pedido`);
    setShowAddModal(false);
    setSelectedProduct(null);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromOrder(productId);
      return;
    }

    setOrderItems(orderItems.map(item =>
      item.product_id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromOrder = (productId) => {
    setOrderItems(orderItems.filter(item => item.product_id !== productId));
  };

  const addToSupplierOrder = async (product, quantity = 1) => {
    try {
      await createSupplierOrder({
        product_id: product.id,
        quantity,
        notes: `Solicitado para pedido de ${customerName} ${customerLastname}`
      });
      toast.success(`${product.name} agregado a lista de pedidos al proveedor`);
    } catch (error) {
      console.error('Error al agregar a pedidos al proveedor:', error);
      toast.error('Error al agregar a lista de proveedor');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      toast.error('Agrega al menos un producto al pedido');
      return;
    }

    if (!customerName.trim() || !customerLastname.trim() || !customerPhone.trim()) {
      toast.error('Completa los datos del cliente');
      return;
    }

    // Verificar stock
    const itemsWithoutStock = orderItems.filter(item => {
      const stock = getStock(item.product_id);
      return stock < item.quantity;
    });

    if (itemsWithoutStock.length > 0) {
      const proceed = window.confirm(
        `Hay ${itemsWithoutStock.length} producto(s) sin stock suficiente. ¿Deseas continuar y agregarlos a la lista de pedidos al proveedor?`
      );

      if (proceed) {
        // Agregar items sin stock a pedidos al proveedor
        for (const item of itemsWithoutStock) {
          const needed = item.quantity - getStock(item.product_id);
          await addToSupplierOrder(item.product, needed);
        }
      } else {
        return;
      }
    }

    setSubmitting(true);
    try {
      const orderData = {
        customer_name: customerName,
        customer_lastname: customerLastname,
        customer_phone: customerPhone,
        customer_notes: customerNotes,
        items: orderItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      await createOrder(orderData);
      toast.success('Pedido creado exitosamente');
      navigate('/dashboard/pedidos');
    } catch (error) {
      console.error('Error al crear pedido:', error);
      toast.error('Error al crear pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const getTotalAmount = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // IDs de productos ya en el pedido para excluir del picker
  const excludedProductIds = orderItems.map(item => item.product_id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Crear Pedido</h1>
        <button
          onClick={() => navigate('/dashboard/pedidos')}
          className="btn-secondary"
        >
          Volver a pedidos
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Panel izquierdo - Seleccionar productos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Productos del pedido</h3>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary"
              >
                + Agregar producto
              </button>
            </div>

            {orderItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-2">No hay productos en el pedido</p>
                <p className="text-sm">Haz clic en "Agregar producto" para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderItems.map(item => {
                  const stock = getStock(item.product_id);
                  const needsOrder = item.quantity > stock;
                  const labels = item.product.labels ? JSON.parse(item.product.labels) : [];
                  const hasStockInStore = !labels.includes('Sin Stock');

                  return (
                    <div key={item.product_id} className="flex items-center gap-4 p-4 border rounded-lg">
                      {item.product.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {item.product.brand} • {item.product.category}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold text-primary-600">
                            ${item.price?.toFixed(2)}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            stock > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            Stock: {stock}
                          </span>
                          {needsOrder && (
                            <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800">
                              Stock insuficiente
                            </span>
                          )}
                          {!hasStockInStore && (
                            <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                              Sin stock en tienda
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="w-8 h-8 rounded border hover:bg-gray-100"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 border rounded text-center"
                          />
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="w-8 h-8 rounded border hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-lg font-semibold text-gray-900 min-w-[80px] text-right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>

                        <button
                          onClick={() => removeFromOrder(item.product_id)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          X
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho - Datos del pedido */}
        <div className="space-y-4">
          {/* Datos del cliente */}
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Datos del cliente</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input"
                  placeholder="Nombre"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={customerLastname}
                  onChange={(e) => setCustomerLastname(e.target.value)}
                  className="input"
                  placeholder="Apellido"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="input"
                  placeholder="Teléfono"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="input"
                  rows="3"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
          </div>

          {/* Resumen del pedido */}
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">
              Resumen del pedido ({orderItems.length})
            </h3>

            {orderItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">
                No hay productos en el pedido
              </p>
            ) : (
              <>
                <div className="border-t border-b py-3 mb-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary-600">
                      ${getTotalAmount().toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || orderItems.length === 0}
                  className="btn-primary w-full"
                >
                  {submitting ? 'Creando pedido...' : 'Crear pedido'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal para agregar producto */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Agregar producto al pedido</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                X
              </button>
            </div>

            {/* Product Picker */}
            <ProductPicker
              onSelect={handleSelectProduct}
              excludeIds={excludedProductIds}
            />

            {/* Producto seleccionado */}
            {selectedProduct && (
              <div className="border-t mt-6 pt-6">
                <h3 className="font-semibold mb-3">Producto seleccionado:</h3>
                <div className="bg-gray-50 p-4 rounded-lg mb-4 flex items-center gap-4">
                  {selectedProduct.image_url && (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                    <p className="text-sm text-gray-600">{selectedProduct.brand} • {selectedProduct.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-semibold text-primary-600">
                        ${selectedProduct.price?.toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        getStock(selectedProduct.id) > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        Stock: {getStock(selectedProduct.id)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedProduct(null);
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addToOrder}
                    className="btn-primary flex-1"
                  >
                    Agregar al pedido
                  </button>
                </div>
              </div>
            )}

            {!selectedProduct && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedProduct(null);
                  }}
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
