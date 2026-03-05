import { db } from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';

export class SalesRepository {
  findRecentSales(productId = null, limit = 60) {
    if (productId) {
      const stmt = db.prepare(`
        SELECT * FROM sales 
        WHERE product_id = ? 
        ORDER BY sale_date DESC 
        LIMIT ?
      `);
      return stmt.all(productId, limit).reverse();
    }
    const stmt = db.prepare(`
      SELECT s.*, p.name AS product_name, p.sku
      FROM sales s
      JOIN products p ON s.product_id = p.product_id
      ORDER BY s.sale_date DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  getMonthlySalesReport(customerId = null) {
    const query = `
      WITH monthly_sales AS (
          SELECT 
              s.customer_id,
              DATE_TRUNC('month', s.order_date) AS order_month,
              SUM(s.amount) AS total_sales
          FROM sales s
          WHERE s.order_date >= DATEADD('month', -12, GETDATE())
          GROUP BY s.customer_id, DATE_TRUNC('month', s.order_date)
      ),
      ranked_sales AS (
          SELECT
              customer_id,
              order_month,
              total_sales,
              LAG(total_sales) OVER (PARTITION BY customer_id ORDER BY order_month) AS prev_month_sales,
              SUM(total_sales) OVER (PARTITION BY customer_id 
                                     ORDER BY order_month 
                                     ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS rolling_3mo_sales,
              RANK() OVER (PARTITION BY customer_id ORDER BY total_sales DESC) AS sales_rank
          FROM monthly_sales
      )
      SELECT
          customer_id,
          order_month,
          ROUND(total_sales, 2) AS total_sales,
          ROUND(prev_month_sales, 2) AS prev_month_sales,
          ROUND(rolling_3mo_sales, 2) AS rolling_3mo_sales,
          sales_rank
      FROM ranked_sales
      ${customerId ? 'WHERE customer_id = ?' : ''}
      ORDER BY customer_id, order_month;
    `;
    const stmt = db.prepare(query);
    return customerId ? stmt.all(customerId) : stmt.all();
  }

  recordSale(productId, quantity, channel = 'Direct Store', customerId = '101', allowBackorder = false) {
    const productStmt = db.prepare('SELECT unit_price, current_stock FROM products WHERE product_id = ?');
    const product = productStmt.get(productId);
    if (!product) throw new Error('Product not found');

    const saleId = `sl_${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    const totalRev = quantity * product.unit_price;

    db.exec('BEGIN TRANSACTION;');
    try {
      let remainingStock = 0;
      if (allowBackorder) {
        const updateStockStmt = db.prepare(`
          UPDATE products 
          SET current_stock = MAX(0, current_stock - ?)
          WHERE product_id = ?
        `);
        updateStockStmt.run(quantity, productId);
        const updated = db.prepare('SELECT current_stock FROM products WHERE product_id = ?').get(productId);
        remainingStock = updated.current_stock;
      } else {
        const updateStockStmt = db.prepare(`
          UPDATE products 
          SET current_stock = current_stock - ?
          WHERE product_id = ? AND current_stock >= ?
        `);
        const updateRes = updateStockStmt.run(quantity, productId, quantity);
        if (updateRes.changes === 0) {
          throw new AppError(`Insufficient stock for product ${productId}. Requested: ${quantity}, Available: ${product.current_stock}`, 400);
        }
        remainingStock = product.current_stock - quantity;
      }

      const insertStmt = db.prepare(`
        INSERT INTO sales (sale_id, product_id, customer_id, order_date, sale_date, quantity, unit_price, amount, total_revenue, channel)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertStmt.run(saleId, productId, customerId, today, today, quantity, product.unit_price, totalRev, totalRev, channel);

      db.exec('COMMIT;');
      return { 
        sale_id: saleId, 
        product_id: productId, 
        quantity, 
        totalRev,
        remaining_stock: remainingStock 
      };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }
}

export const salesRepository = new SalesRepository();
