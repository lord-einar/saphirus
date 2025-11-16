import { useState, useEffect } from 'react';
import { getInventory, updateInventoryStock, removeFromInventory, getProducts, addToInventory } from '../utils/api';
import toast from 'react-hot-toast';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState(0);

  useEffect(() => {
    loadInventory();
    loadAllProducts();
  }, []);

  const loadInventory = async () => {
    try {
      const response = await getInventory();
      setInventory(response.data);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const loadAllProducts = async () => {
    try {
      const response = await getProducts({ limit: 1000 });
      setAllProducts(response.data.products);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const handleUpdateStock = async (productId, stock) => {
    try {
      await updateInventoryStock(productId, stock);
      toast.success('Stock actualizado');
      loadInventory();
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      toast.error('Error al actualizar stock');
    }
  };

  const handleRemove = async (productId) => {
    if (!confirm('¿Estás seguro de eliminar este producto del inventario?')) {
      return;
    }

    try {
      await removeFromInventory(productId);
      toast.success('Producto eliminado del inventario');
      loadInventory();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar producto');
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }

    try {
      await addToInventory(selectedProduct.id, newStock);
      toast.success('Producto agregado al inventario');
      setShowAddModal(false);
      setSelectedProduct(null);
      setNewStock(0);
      loadInventory();
    } catch (error) {
      console.error('Error al agregar producto:', error);
      toast.error(error.response?.data?.error || 'Error al agregar producto');
    }
  };

  const availableProducts = allProducts.filter(
    p => !inventory.some(i => i.product_id === p.id)
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventario</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          + Agregar producto
        </button>
      </div>

      {inventory.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No tienes productos en tu inventario</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            Agregar primer producto
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {inventory.map(item => (
            <div key={item.id} className="card flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    Sin imagen
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                {item.brand && (
                  <p className="text-sm text-primary-600">{item.brand}</p>
                )}
                <p className="text-sm text-gray-600">${item.price?.toFixed(2)}</p>
                {!item.is_active && (
                  <span className="text-xs text-red-600">⚠️ Producto desactivado</span>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStock(item.product_id, Math.max(0, item.stock - 1))}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="w-16 text-center font-semibold">
                    {item.stock}
                  </span>
                  <button
                    onClick={() => handleUpdateStock(item.product_id, item.stock + 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => handleRemove(item.product_id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para agregar producto */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Agregar producto al inventario</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar producto
                </label>
                <select
                  className="input"
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const product = availableProducts.find(p => p.id === parseInt(e.target.value));
                    setSelectedProduct(product);
                  }}
                >
                  <option value="">Selecciona un producto</option>
                  {availableProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.brand} - ${product.price?.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock inicial
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                  className="input"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddProduct}
                  className="btn-primary flex-1"
                >
                  Agregar
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedProduct(null);
                    setNewStock(0);
                  }}
                  className="btn-secondary flex-1"
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
