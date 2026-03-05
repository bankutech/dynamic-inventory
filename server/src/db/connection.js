import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultDbPath = path.resolve(__dirname, '../../data/inventory.db');
const DB_PATH = process.env.DB_PATH ? path.resolve(process.cwd(), process.env.DB_PATH) : defaultDbPath;

export const db = new DatabaseSync(DB_PATH);

// Register custom SQL functions for Advanced SQL compatibility (Slide 10 CTE support)
export function registerCustomSqlFunctions(database) {
  // DATE_TRUNC('month', dateStr) -> YYYY-MM-01
  database.function('DATE_TRUNC', (part, dateStr) => {
    if (!dateStr) return null;
    const str = String(dateStr);
    return str.slice(0, 7) + '-01';
  });

  // GETDATE() -> current ISO timestamp
  database.function('GETDATE', () => new Date().toISOString());

  // DATEADD('month'|'day'|'year', number, dateStr)
  database.function('DATEADD', (part, num, dateStr) => {
    const d = new Date(dateStr || Date.now());
    const p = String(part).toLowerCase();
    const n = Number(num);
    if (p === 'month' || p === 'm') {
      d.setMonth(d.getMonth() + n);
    } else if (p === 'day' || p === 'd') {
      d.setDate(d.getDate() + n);
    } else if (p === 'year' || p === 'y') {
      d.setFullYear(d.getFullYear() + n);
    }
    return d.toISOString().slice(0, 10);
  });
}

registerCustomSqlFunctions(db);

export function initializeDatabase() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS suppliers (
      supplier_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      phone TEXT NOT NULL,
      lead_time_days INTEGER NOT NULL,
      lead_time_std_dev REAL DEFAULT 1.2,
      reliability_score REAL DEFAULT 0.95,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      product_id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit_cost REAL NOT NULL,
      unit_price REAL NOT NULL,
      current_stock INTEGER NOT NULL,
      safety_stock INTEGER DEFAULT 15,
      reorder_point INTEGER DEFAULT 30,
      supplier_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sales (
      sale_id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      customer_id TEXT DEFAULT '101',
      order_date DATE NOT NULL,
      sale_date DATE NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      amount REAL NOT NULL,
      total_revenue REAL NOT NULL,
      channel TEXT DEFAULT 'Direct Store',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
    );
  `);

  // Ensure column compatibility if table was previously created with older schema
  try {
    const tableInfo = db.prepare("PRAGMA table_info('sales');").all();
    const cols = tableInfo.map(c => c.name);
    if (!cols.includes('customer_id')) {
      db.exec("ALTER TABLE sales ADD COLUMN customer_id TEXT DEFAULT '101';");
    }
    if (!cols.includes('order_date')) {
      db.exec("ALTER TABLE sales ADD COLUMN order_date DATE;");
      db.exec("UPDATE sales SET order_date = sale_date WHERE order_date IS NULL;");
    }
    if (!cols.includes('amount')) {
      db.exec("ALTER TABLE sales ADD COLUMN amount REAL;");
      db.exec("UPDATE sales SET amount = total_revenue WHERE amount IS NULL;");
    }
  } catch (err) {
    // Migration check safe ignore
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      po_id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      order_quantity INTEGER NOT NULL,
      unit_cost REAL NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'PENDING',
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      expected_delivery_date DATETIME NOT NULL,
      received_date DATETIME,
      notes TEXT,
      FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sales_prod_date ON sales(product_id, sale_date);
    CREATE INDEX IF NOT EXISTS idx_sales_cust_date ON sales(customer_id, order_date);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);

    -- Advanced SQL View with Window Functions (Slide 9)
    DROP VIEW IF EXISTS v_sales_moving_averages;
    CREATE VIEW v_sales_moving_averages AS
    SELECT 
      product_id,
      sale_date,
      quantity,
      AVG(quantity) OVER (
        PARTITION BY product_id 
        ORDER BY sale_date 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
      ) AS mavg_7_days,
      AVG(quantity) OVER (
        PARTITION BY product_id 
        ORDER BY sale_date 
        ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
      ) AS mavg_30_days,
      SUM(quantity) OVER (
        PARTITION BY product_id 
        ORDER BY sale_date 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
      ) AS rolling_7_day_sum
    FROM sales;

    -- Inventory Trigger to replenish stock upon PO receipt
    CREATE TRIGGER IF NOT EXISTS trg_po_received_update_stock
    AFTER UPDATE OF status ON purchase_orders
    FOR EACH ROW
    WHEN NEW.status = 'RECEIVED' AND OLD.status != 'RECEIVED'
    BEGIN
      UPDATE products 
      SET current_stock = current_stock + NEW.order_quantity
      WHERE product_id = NEW.product_id;
    END;
  `);
}

initializeDatabase();
