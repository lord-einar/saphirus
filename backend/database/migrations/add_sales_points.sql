-- Puestos de venta
CREATE TABLE IF NOT EXISTS sales_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Inventario de productos en cada puesto de venta
CREATE TABLE IF NOT EXISTS sales_point_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sales_point_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity_assigned INTEGER NOT NULL DEFAULT 0,
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  price REAL NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sales_point_id) REFERENCES sales_points(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(sales_point_id, product_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_sales_points_user ON sales_points(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_points_status ON sales_points(status);
CREATE INDEX IF NOT EXISTS idx_sales_point_inventory_sales_point ON sales_point_inventory(sales_point_id);
CREATE INDEX IF NOT EXISTS idx_sales_point_inventory_product ON sales_point_inventory(product_id);
