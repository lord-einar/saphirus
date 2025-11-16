import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getBrands, getCategories, getInventory, createOrder, createSupplierOrder } from '../utils/api';
import toast from 'react-hot-toast';

export default function CreateOrder() {
  const navigate = useNavigate();

  // Filtros de productos
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');

  // Productos e inventario
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState({});
  const [loading, setLoading] = useState(false);

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
    loadBrands();
    loadInventory();
  }, []);

  useEffect(() => {
    loadCategories(selectedBrand);
  }, [selectedBrand]);

  useEffect(() => {
    loadProducts();
  }, [selectedBrand, selectedCategory, search]);

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
      const response = await getCategories(brand ? { brand } : {});
      setCategories(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBrand) params.brand = selectedBrand;
      if (selectedCategory) params.category = selectedCategory;
      if (search) params.search = search;

      const response = await getProducts(params);
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleBrandChange = (e) => {
    setSelectedBrand(e.target.value);
    setSelectedCategory('');
  };

  const addToOrder = (product) => {
    const existing = orderItems.find(item => item.product_id === product.id);

    if (existing) {
      setOrderItems(orderItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        product_id: product.id,
        product: product,
        quantity: 1,
        price: product.price
      }]);
    }

    toast.success(`${product.name} agregado al pedido`);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Crear Pedido</h1>
        <button
          onClick={() => navigate('/dashboard/pedidos')}
          className="btn-secondary"
        >
          ← Volver a pedidos
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Panel izquierdo - Búsqueda de productos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filtros */}
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Buscar productos</h3>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca
                </label>
                <select
                  value={selectedBrand}
                  onChange={handleBrandChange}
                  className="input"
                >
                  <option value="">Todas las marcas</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input"
                  disabled={!selectedBrand}
                >
                  <option value="">Todas las categorías</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nombre del producto..."
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Lista de productos */}
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">
              Productos disponibles ({products.length})
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : products.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No se encontraron productos
              </p>
            ) : (
              <div className="max-h-[600px] overflow-y-auto space-y-2">
                {products.map(product => {
                  const myStock = getStock(product.id);
                  const inOrder = orderItems.find(item => item.product_id === product.id);

                  // Verificar si tiene stock en la tienda oficial (label "Sin Stock")
                  const labels = product.labels ? JSON.parse(product.labels) : [];
                  const hasStockInStore = !labels.includes('Sin Stock');

                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {product.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {product.brand} • {product.category}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold text-primary-600">
                            ${product.price?.toFixed(2)}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            myStock > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {myStock > 0 ? `Mi stock: ${myStock}` : 'Sin stock propio'}
                          </span>
                          {!hasStockInStore && (
                            <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                              Sin stock en tienda
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {!hasStockInStore ? (
                          // Sin stock en la tienda oficial
                          <span className="text-sm text-red-600 font-medium">
                            Sin stock en la tienda
                          </span>
                        ) : myStock > 0 ? (
                          // Tengo stock propio
                          <button
                            onClick={() => addToOrder(product)}
                            className="btn-primary text-sm"
                            disabled={inOrder}
                          >
                            {inOrder ? '✓ Agregado' : '+ Agregar'}
                          </button>
                        ) : (
                          // No tengo stock pero sí hay en tienda
                          <button
                            onClick={() => addToSupplierOrder(product)}
                            className="btn-secondary text-sm whitespace-nowrap"
                          >
                            📋 Pedir
                          </button>
                        )}
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
                <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                  {orderItems.map(item => {
                    const stock = getStock(item.product_id);
                    const needsOrder = item.quantity > stock;

                    return (
                      <div key={item.product_id} className="flex items-start gap-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.product.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value))}
                              className="w-16 px-2 py-1 border rounded text-center"
                            />
                            <span className="text-gray-600">
                              × ${item.price}
                            </span>
                            {needsOrder && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                ⚠️ Stock insuf.
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 font-semibold mt-1">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        <button
                          onClick={() => removeFromOrder(item.product_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-3">
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
                  className="btn-primary w-full mt-4"
                >
                  {submitting ? 'Creando pedido...' : 'Crear pedido'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
