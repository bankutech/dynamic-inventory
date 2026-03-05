import { db } from '../db/connection.js';

export class PurchaseOrderRepository {
  findAll() {
    const stmt = db.prepare(`
      SELECT po.*, p.name AS product_name, p.sku, s.name AS supplier_name
      FROM purchase_orders po
      JOIN products p ON po.product_id = p.product_id
      JOIN suppliers s ON po.supplier_id = s.supplier_id
      ORDER BY po.order_date DESC
    `);
    return stmt.all();
  }

  create(data) {
    const product = db.prepare('SELECT unit_cost, supplier_id FROM products WHERE product_id = ?').get(data.product_id);
    if (!product) throw new Error('Product not found');

    const poId = `po_${Date.now()}`;
    const unitCost = data.unit_cost || product.unit_cost;
    const totalAmount = data.order_quantity * unitCost;
    const expDelivery = new Date(Date.now() + 7 * 86400000).toISOString();

    const stmt = db.prepare(`
      INSERT INTO purchase_orders (po_id, product_id, supplier_id, order_quantity, unit_cost, total_amount, status, expected_delivery_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      poId,
      data.product_id,
      product.supplier_id,
      data.order_quantity,
      unitCost,
      totalAmount,
      'PENDING',
      expDelivery,
      data.notes || 'Automated replenishment generated from dynamic SQL reorder deficit analysis.'
    );

    return db.prepare('SELECT * FROM purchase_orders WHERE po_id = ?').get(poId);
  }

  updateStatus(poId, status) {
    // Note: If status becomes RECEIVED, the SQLite Trigger `trg_po_received_update_stock` will automatically replenish current_stock on the product!
    const stmt = db.prepare(`
      UPDATE purchase_orders 
      SET status = ?, received_date = CASE WHEN ? = 'RECEIVED' THEN CURRENT_TIMESTAMP ELSE received_date END
      WHERE po_id = ?
    `);
    stmt.run(status, status, poId);

    return db.prepare('SELECT * FROM purchase_orders WHERE po_id = ?').get(poId);
  }
}

export const purchaseOrderRepository = new PurchaseOrderRepository();
