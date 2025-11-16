import { createContext, useContext, useState, useEffect } from 'react';
import { getBrands } from '../utils/api';

const BrandContext = createContext();

export const useBrands = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrands must be used within a BrandProvider');
  }
  return context;
};

export const BrandProvider = ({ children }) => {
  const [brands, setBrands] = useState([]);
  const [brandsMap, setBrandsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const response = await getBrands();
      const brandsData = response.data;
      setBrands(brandsData);

      // Crear un mapa para acceso rápido por nombre
      const map = {};
      brandsData.forEach(brand => {
        if (typeof brand === 'object') {
          map[brand.name] = brand.logo;
        }
      });
      setBrandsMap(map);
    } catch (error) {
      console.error('Error al cargar marcas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBrandLogo = (brandName) => {
    return brandsMap[brandName] || null;
  };

  return (
    <BrandContext.Provider value={{ brands, brandsMap, getBrandLogo, loading }}>
      {children}
    </BrandContext.Provider>
  );
};

export default BrandContext;
