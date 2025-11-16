import { useState, useEffect } from 'react';
import { getBrands, getCategories } from '../utils/api';

export default function ProductFilter({ onFilterChange }) {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBrands();
  }, []);

  // Cargar categorías cuando cambie la marca
  useEffect(() => {
    loadCategories(selectedBrand);
  }, [selectedBrand]);

  const loadBrands = async () => {
    try {
      const brandsRes = await getBrands();
      setBrands(brandsRes.data);
    } catch (error) {
      console.error('Error al cargar marcas:', error);
    }
  };

  const loadCategories = async (brand = '') => {
    try {
      const categoriesRes = await getCategories(brand ? { brand } : {});
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const handleBrandChange = (e) => {
    const value = e.target.value;
    setSelectedBrand(value);
    setSelectedCategory(''); // Resetear categoría al cambiar marca
    onFilterChange({ brand: value, category: '', search });
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
    onFilterChange({ brand: selectedBrand, category: value, search });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    onFilterChange({ brand: selectedBrand, category: selectedCategory, search: value });
  };

  const handleClearFilters = () => {
    setSelectedBrand('');
    setSelectedCategory('');
    setSearch('');
    onFilterChange({ brand: '', category: '', search: '' });
  };

  return (
    <div className="card mb-6">
      <h3 className="font-semibold text-lg mb-4">Filtros</h3>

      <div className="space-y-4">
        {/* Búsqueda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar
          </label>
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar productos..."
            className="input"
          />
        </div>

        {/* Marca */}
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

          {/* Mostrar logos de marcas */}
          {brands.length > 0 && typeof brands[0] === 'object' && (
            <div className="mt-3 flex flex-wrap gap-2">
              {brands.filter(b => b.logo).map(brand => (
                <button
                  key={brand.name}
                  onClick={() => {
                    setSelectedBrand(brand.name);
                    setSelectedCategory('');
                    onFilterChange({ brand: brand.name, category: '', search });
                  }}
                  className={`p-2 border-2 rounded-lg hover:border-primary-500 transition-colors ${
                    selectedBrand === brand.name ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}
                  title={brand.name}
                >
                  <img
                    src={`${import.meta.env.VITE_API_URL}${brand.logo}`}
                    alt={brand.name}
                    className="h-8 w-auto object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="input"
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Botón limpiar filtros */}
        {(selectedBrand || selectedCategory || search) && (
          <button
            onClick={handleClearFilters}
            className="btn-secondary w-full"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
