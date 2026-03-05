import { db } from '../db/connection.js';

export class ProductRepository {
  findAll() {
    const stmt = db.prepare(`
      SELECT p.*, s.name AS supplier_name, s.lead_time_days, s.reliability_score
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.supplier_id
      ORDER BY p.name ASC
    `);
    return stmt.all();
  }

  findById(id) {
    const stmt = db.prepare(`
      SELECT p.*, s.name AS supplier_name, s.lead_time_days, s.reliability_score
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.supplier_id
      WHERE p.product_id = ?
    `);
    return stmt.get(id);
  }

  updateStock(id, newStock) {
    const stmt = db.prepare('UPDATE products SET current_stock = ? WHERE product_id = ?');
    stmt.run(newStock, id);
    return this.findById(id);
  }

  updateThresholds(id, safetyStock, reorderPoint) {
    const stmt = db.prepare('UPDATE products SET safety_stock = ?, reorder_point = ? WHERE product_id = ?');
    stmt.run(safetyStock, reorderPoint, id);
    return this.findById(id);
  }
}

export const productRepository = new ProductRepository();
