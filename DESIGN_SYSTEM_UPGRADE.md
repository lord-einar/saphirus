# 🎨 Sistema de Diseño Modernizado - Saphirus

## ✅ Lo que ya está implementado

### 1. SweetAlert2 Instalado
```bash
✅ Paquete instalado en frontend
✅ Utilidad creada en /frontend/src/utils/alerts.js
```

### 2. Sistema de Diseño Completo
```bash
✅ Nuevo archivo CSS en /frontend/src/index.css
✅ Paleta de colores moderna (Purple/Violet primary)
✅ Componentes rediseñados (buttons, cards, inputs, badges)
✅ Animaciones y microinteracciones
✅ Sistema responsive mejorado
✅ Utilidades CSS personalizadas
```

---

## 🎯 Características del Nuevo Diseño

### Paleta de Colores
- **Primario:** Purple/Violet (moderna y elegante)
- **Secundario:** Blue (complementario)
- **Acentos:** Green, Orange, Red (para estados)
- **Neutros:** Grays mejorados

### Componentes Principales

#### Botones
```jsx
// Antes
<button className="btn-primary">Crear</button>

// Ahora (mismo código, nuevo estilo automático)
// - Gradiente purple
// - Sombra con glow
// - Animación de escala al click
// - Efecto shimmer al hover
<button className="btn-primary">Crear</button>
<button className="btn-secondary">Cancelar</button>
<button className="btn-danger">Eliminar</button>
<button className="btn-success">Guardar</button>
<button className="btn-ghost">Limpiar</button>
```

#### Cards
```jsx
// Card básico
<div className="card">
  ...
</div>

// Card con hover effect
<div className="card-hover">
  ...
</div>

// Cards con gradiente
<div className="card-gradient-purple">...</div>
<div className="card-gradient-blue">...</div>
<div className="card-gradient-green">...</div>
<div className="card-gradient-orange">...</div>
```

#### Inputs
```jsx
// Input mejorado (automático)
<input className="input" />
<select className="input">...</select>
<textarea className="input">...</textarea>

// Con label semántico
<label className="label">Nombre</label>
<label className="label label-required">Email</label>
```

#### Badges
```jsx
<span className="badge-primary">Activo</span>
<span className="badge-success">Completado</span>
<span className="badge-warning">Pendiente</span>
<span className="badge-danger">Error</span>
<span className="badge-info">Info</span>
```

#### Tablas
```jsx
<table className="table">
  <thead>...</thead>
  <tbody>...</tbody>
</table>
```

---

## 📝 Cómo Usar SweetAlert2

### Importar
```jsx
import alerts from '../utils/alerts';
// o específicamente
import { toast, confirmDelete, successAlert } from '../utils/alerts';
```

### Ejemplos de Uso

#### 1. Reemplazar window.confirm
```jsx
// ❌ ANTES
const handleDelete = (id) => {
  if (window.confirm('¿Eliminar?')) {
    // eliminar
  }
};

// ✅ AHORA
import { confirmDelete } from '../utils/alerts';

const handleDelete = async (id, name) => {
  const confirmed = await confirmDelete(name);
  if (confirmed) {
    // eliminar
  }
};
```

#### 2. Reemplazar toast de react-hot-toast
```jsx
// ❌ ANTES
import toast from 'react-hot-toast';
toast.success('Guardado');
toast.error('Error');

// ✅ AHORA
import { toast } from '../utils/alerts';
toast.success('Guardado');
toast.error('Error');
toast.warning('Atención');
toast.info('Información');
```

#### 3. Alertas Modales
```jsx
import { successAlert, errorAlert, warningAlert } from '../utils/alerts';

// Éxito
await successAlert('Operación completada exitosamente');

// Error
await errorAlert('Ocurrió un error al guardar');

// Advertencia
await warningAlert('Esta acción no se puede deshacer');
```

#### 4. Loading States
```jsx
import { loadingAlert, closeLoading } from '../utils/alerts';

const handleSubmit = async () => {
  loadingAlert('Guardando...');
  try {
    await saveData();
    closeLoading();
    toast.success('Guardado');
  } catch (error) {
    closeLoading();
    toast.error('Error');
  }
};
```

---

## 🔄 Ejemplo Completo: SalesPoints.jsx Actualizado

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSalesPoints, deleteSalesPoint, createSalesPoint, updateSalesPoint } from '../utils/api';
import { toast, confirmDelete, successAlert, errorAlert } from '../utils/alerts';

export default function SalesPoints() {
  const navigate = useNavigate();
  const [salesPoints, setSalesPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contact_name: '',
    contact_phone: '',
    notes: ''
  });

  useEffect(() => {
    loadSalesPoints();
  }, []);

  const loadSalesPoints = async () => {
    try {
      setLoading(true);
      const response = await getSalesPoints();
      setSalesPoints(response.data);
    } catch (error) {
      console.error('Error al cargar puestos de venta:', error);
      errorAlert('Error al cargar puestos de venta'); // ✅ NUEVO
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre es requerido'); // ✅ NUEVO
      return;
    }

    try {
      if (editingPoint) {
        await updateSalesPoint(editingPoint.id, formData);
        toast.success('Puesto de venta actualizado'); // ✅ NUEVO
      } else {
        await createSalesPoint(formData);
        toast.success('Puesto de venta creado'); // ✅ NUEVO
      }
      setShowModal(false);
      loadSalesPoints();
    } catch (error) {
      console.error('Error al guardar puesto:', error);
      errorAlert('Error al guardar puesto de venta'); // ✅ NUEVO
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await confirmDelete(name); // ✅ NUEVO - Reemplaza window.confirm

    if (!confirmed) return;

    try {
      await deleteSalesPoint(id);
      toast.success('Puesto eliminado'); // ✅ NUEVO
      loadSalesPoints();
    } catch (error) {
      console.error('Error al eliminar puesto:', error);
      errorAlert('Error al eliminar puesto'); // ✅ NUEVO
    }
  };

  const handleToggleStatus = async (point) => {
    const newStatus = point.status === 'active' ? 'inactive' : 'active';
    try {
      await updateSalesPoint(point.id, { status: newStatus });
      toast.success(`Puesto ${newStatus === 'active' ? 'activado' : 'desactivado'}`); // ✅ NUEVO
      loadSalesPoints();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      errorAlert('Error al cambiar estado'); // ✅ NUEVO
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner"></div> {/* ✅ NUEVO - spinner mejorado */}
          <p className="text-gray-600 mt-4">Cargando puestos de venta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8"> {/* ✅ NUEVO - container mejorado */}
      <div className="flex justify-between items-center mb-8">
        <h1>Puestos de Venta</h1> {/* ✅ h1 ahora tiene gradiente automático */}
        <button onClick={handleCreateNew} className="btn-primary">
          + Nuevo Puesto
        </button>
      </div>

      {salesPoints.length === 0 ? (
        <div className="card text-center py-16"> {/* ✅ card mejorado */}
          <div className="text-gray-400 text-6xl mb-4">🏪</div>
          <p className="text-gray-600 mb-6 text-lg">No tienes puestos de venta todavía</p>
          <button onClick={handleCreateNew} className="btn-primary">
            Crear primer puesto
          </button>
        </div>
      ) : (
        <div className="responsive-grid"> {/* ✅ NUEVO - grid responsive automático */}
          {salesPoints.map(point => (
            <div key={point.id} className="card-hover"> {/* ✅ card con hover effect */}
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">{point.name}</h3>
                  {/* ✅ NUEVO - badges mejorados */}
                  {point.status === 'active' ? (
                    <span className="badge-success">Activo</span>
                  ) : (
                    <span className="badge-gray">Inactivo</span>
                  )}
                </div>
              </div>

              {/* ... resto del código ... */}

              {/* Acciones */}
              <div className="flex gap-2 mt-6"> {/* ✅ mejor spacing */}
                <button
                  onClick={() => navigate(`/dashboard/puestos-venta/${point.id}`)}
                  className="btn-primary flex-1"
                >
                  Ver Detalles
                </button>
                <button
                  onClick={() => handleEdit(point)}
                  className="btn-secondary px-4"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleToggleStatus(point)}
                  className="btn-secondary px-4"
                  title={point.status === 'active' ? 'Desactivar' : 'Activar'}
                >
                  {point.status === 'active' ? '🔒' : '🔓'}
                </button>
                <button
                  onClick={() => handleDelete(point.id, point.name)}
                  className="btn-danger px-4"
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Ahora con clases mejoradas */}
      {showModal && (
        <div className="modal-overlay"> {/* ✅ NUEVO */}
          <div className="modal-content max-w-lg"> {/* ✅ NUEVO */}
            <div className="modal-header"> {/* ✅ NUEVO */}
              <h2>
                {editingPoint ? 'Editar Puesto de Venta' : 'Nuevo Puesto de Venta'}
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4"> {/* ✅ NUEVO */}
                <div className="input-group"> {/* ✅ NUEVO */}
                  <label className="label label-required">Nombre del puesto</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                    placeholder="Ej: Kiosco Central"
                  />
                </div>

                <div className="input-group">
                  <label className="label">Ubicación</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input"
                    placeholder="Ej: Av. Principal 123"
                  />
                </div>

                {/* ... más campos ... */}
              </div>

              <div className="modal-footer"> {/* ✅ NUEVO */}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingPoint ? 'Guardar Cambios' : 'Crear Puesto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📋 Lista de Archivos a Actualizar

### Prioridad Alta
- [ ] `Navbar.jsx` - Actualizar con nav-link classes
- [ ] `Dashboard.jsx` - Usar stat-card classes
- [ ] `Products.jsx` - Usar card-hover para productos
- [ ] `ProductCard.jsx` - Mejorar diseño con nuevas clases
- [ ] `SalesPoints.jsx` - Implementar alertas (ejemplo arriba)
- [ ] `SalesPointDetail.jsx` - Implementar alertas
- [ ] `Orders.jsx` - Usar table classes y alertas
- [ ] `Inventory.jsx` - Implementar alertas

### Prioridad Media
- [ ] `CreateOrder.jsx` - Implementar alertas
- [ ] `SupplierOrders.jsx` - Implementar alertas
- [ ] `ProductFilter.jsx` - Mejorar UI
- [ ] `OrderDetail.jsx` - Mejorar UI y alertas

### Prioridad Baja
- [ ] `Home.jsx` - Mejorar landing
- [ ] `CartPage.jsx` - Mejorar UI
- [ ] `Checkout.jsx` - Mejorar UI
- [ ] `Settings.jsx` - Mejorar UI

---

## 🎨 Utilidades CSS Disponibles

### Grids Responsive
```jsx
<div className="responsive-grid">...</div>        // 1/2/3 columnas
<div className="responsive-grid-4">...</div>      // 1/2/4 columnas
```

### Animaciones
```jsx
<div className="fade-in">...</div>
<div className="slide-up">...</div>
<div className="zoom-in-95">...</div>
```

### Texto
```jsx
<h1 className="gradient-text">Título con gradiente</h1>
<p className="truncate-2">Texto truncado a 2 líneas</p>
<p className="truncate-3">Texto truncado a 3 líneas</p>
```

### Efectos
```jsx
<div className="glass">...</div>           // Efecto glassmorphism
<div className="shimmer">...</div>         // Efecto shimmer loading
<div className="skeleton">...</div>        // Skeleton loading
```

---

## 🚀 Cómo Aplicar los Cambios

### Paso 1: Probar el Nuevo Diseño
```bash
cd frontend
npm run dev
```

**Verás inmediatamente:**
- Botones con gradientes y animaciones
- Cards mejorados con sombras suaves
- Inputs con mejor UX (focus rings, hover states)
- Fondo con gradiente sutil
- Títulos con gradiente automático

### Paso 2: Actualizar Componentes Gradualmente

Para cada componente:

1. **Reemplazar toast de react-hot-toast:**
```jsx
// Buscar
import toast from 'react-hot-toast';
toast.success(...)
toast.error(...)

// Reemplazar con
import { toast } from '../utils/alerts';
toast.success(...)
toast.error(...)
```

2. **Reemplazar window.confirm:**
```jsx
// Buscar
if (window.confirm('...')) { }

// Reemplazar con
import { confirmDelete } from '../utils/alerts';
if (await confirmDelete('nombre')) { }
```

3. **Mejorar clases CSS:**
```jsx
// Buscar
<div className="card">

// Reemplazar con
<div className="card-hover">  // si quieres efecto hover
```

### Paso 3: Testing
- Probar en mobile (responsive está garantizado)
- Probar todas las interacciones (alertas, modales, forms)
- Verificar accesibilidad (todo tiene focus states)

---

## 🎯 Beneficios del Nuevo Sistema

### UX/UI Mejorado
✅ Diseño moderno y profesional
✅ Paleta cohesiva y elegante
✅ Microinteracciones que guían al usuario
✅ Feedback visual claro (loading, success, error)
✅ Tipografía optimizada para legibilidad

### Performance
✅ CSS optimizado con Tailwind
✅ Animaciones con GPU (transform, opacity)
✅ Lazy loading de componentes pesados

### Mantenibilidad
✅ Sistema de diseño consistente
✅ Componentes reutilizables
✅ Código DRY (Don't Repeat Yourself)
✅ Fácil agregar dark mode en futuro

### Responsive
✅ Mobile-first approach
✅ Breakpoints consistentes
✅ Touch-friendly (44px mínimo de tap targets)
✅ Grids automáticos responsive

---

## 💡 Tips de Implementación

1. **No reemplaces todo de golpe** - Hazlo componente por componente
2. **Empieza por los más visibles** - Navbar, Dashboard, Products
3. **Prueba en mobile** - El 60% del tráfico es mobile
4. **Usa las utilidades** - No reinventes la rueda
5. **Mantén consistencia** - Usa siempre las mismas clases para lo mismo

---

## 📚 Recursos

- **Tailwind Docs:** https://tailwindcss.com/docs
- **SweetAlert2 Docs:** https://sweetalert2.github.io/
- **Paleta de colores:** Purple (primary), Blue (secondary)
- **Fuente:** Inter (se carga automáticamente)

---

¡El sistema está listo! Solo necesitas aplicar estos cambios gradualmente a cada componente. 🚀
