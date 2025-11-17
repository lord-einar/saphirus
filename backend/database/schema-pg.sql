-- PostgreSQL Schema para Saphirus

-- Usuarios (vendedores)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  auth0_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  notification_email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marcas con logos
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Productos del catálogo completo
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  price REAL,
  image_url TEXT,
  product_url TEXT,
  description TEXT,
  attributes TEXT,
  labels TEXT,
  is_active BOOLEAN DEFAULT true,
  is_new BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventario del vendedor
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  stock INTEGER DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(product_id, user_id)
);

-- Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_lastname TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items del pedido
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  replaced_with_product_id INTEGER,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (replaced_with_product_id) REFERENCES products(id)
);

-- Historial de scraping
CREATE TABLE IF NOT EXISTS scraping_logs (
  id SERIAL PRIMARY KEY,
  products_found INTEGER DEFAULT 0,
  new_products INTEGER DEFAULT 0,
  removed_products INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pedidos al proveedor
CREATE TABLE IF NOT EXISTS supplier_orders (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Puestos de venta
CREATE TABLE IF NOT EXISTS sales_points (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Inventario de productos en cada puesto de venta
CREATE TABLE IF NOT EXISTS sales_point_inventory (
  id SERIAL PRIMARY KEY,
  sales_point_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity_assigned INTEGER NOT NULL DEFAULT 0,
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  price REAL NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sales_point_id) REFERENCES sales_points(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(sales_point_id, product_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_user ON supplier_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_product ON supplier_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON supplier_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_points_user ON sales_points(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_points_status ON sales_points(status);
CREATE INDEX IF NOT EXISTS idx_sales_point_inventory_sales_point ON sales_point_inventory(sales_point_id);
CREATE INDEX IF NOT EXISTS idx_sales_point_inventory_product ON sales_point_inventory(product_id);
