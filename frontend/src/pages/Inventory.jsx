import { useState, useEffect } from 'react';
import { getInventory, updateInventoryStock, removeFromInventory, addToInventory } from '../utils/api';
import toast from 'react-hot-toast';
import ProductPicker from '../components/ProductPicker';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState(0);

  useEffect(() => {
    loadInventory();
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

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };

  const handleAddProduct = async () => {
    if (!selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }

    if (newStock < 0) {
      toast.error('El stock debe ser mayor o igual a 0');
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

  // IDs de productos ya en inventario para excluir del picker
  const excludedProductIds = inventory.map(item => item.product_id);

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
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Agregar producto al inventario</h2>

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
                    <p className="text-sm text-gray-600">{selectedProduct.brand}</p>
                    <p className="text-sm font-semibold text-primary-600">
                      ${selectedProduct.price?.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock inicial *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={newStock}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setNewStock(value === '' ? 0 : parseInt(value));
                    }}
                    className="input"
                    placeholder="0"
                  />
                </div>

                <div className="flex gap-3">
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
                  <button
                    onClick={handleAddProduct}
                    className="btn-primary flex-1"
                  >
                    Agregar al Inventario
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
                    setNewStock(0);
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
