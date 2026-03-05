import { db } from '../db/connection.js';

export class ReorderRepository {
  /**
   * Executes Advanced SQL Window Functions query to get 7-day moving averages
   * Exactly implementing Slide 9 of the presentation.
   */
  getMovingAverages(productId) {
    const query = `
      SELECT 
        Product_ID, 
        Sale_Date, 
        Quantity, 
        AVG(Quantity) OVER (
          PARTITION BY Product_ID 
          ORDER BY Sale_Date 
          ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) AS Moving_Avg_7_Days,
        AVG(Quantity) OVER (
          PARTITION BY Product_ID 
          ORDER BY Sale_Date 
          ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
        ) AS Moving_Avg_30_Days
      FROM sales
      WHERE Product_ID = ?
      ORDER BY Sale_Date ASC;
    `;
    return db.prepare(query).all(productId);
  }

  /**
   * Computes comprehensive Dynamic Reorder Intelligence using CTEs and Aggregates
   */
  getDynamicReorderAnalysis() {
    const query = `
      WITH ProductSalesStats AS (
        SELECT 
          p.product_id,
          p.sku,
          p.name,
          p.category,
          p.unit_cost,
          p.unit_price,
          p.current_stock,
          s.lead_time_days,
          s.lead_time_std_dev,
          s.reliability_score,
          s.name AS supplier_name,
          s.supplier_id,
          COUNT(sl.sale_id) AS total_sales_records,
          COALESCE(AVG(sl.quantity), 0.0) AS avg_daily_demand,
          COALESCE(MAX(sl.sale_date), 'None') AS last_sale_date
        FROM products p
        JOIN suppliers s ON p.supplier_id = s.supplier_id
        LEFT JOIN sales sl ON p.product_id = sl.product_id
        GROUP BY p.product_id
      ),
      DemandVarianceCTE AS (
        SELECT 
          pss.product_id,
          pss.sku,
          pss.name,
          pss.category,
          pss.unit_cost,
          pss.unit_price,
          pss.current_stock,
          pss.lead_time_days,
          pss.lead_time_std_dev,
          pss.reliability_score,
          pss.supplier_name,
          pss.supplier_id,
          pss.total_sales_records,
          pss.avg_daily_demand,
          pss.last_sale_date,
          COALESCE(
            SQRT(AVG((sl.quantity - pss.avg_daily_demand) * (sl.quantity - pss.avg_daily_demand))),
            0.0
          ) AS demand_std_dev
        FROM ProductSalesStats pss
        LEFT JOIN sales sl ON pss.product_id = sl.product_id
        GROUP BY pss.product_id
      )
      SELECT * FROM DemandVarianceCTE;
    `;

    const rows = db.prepare(query).all();

    // Now calculate dynamic mathematical metrics:
    // Z = 1.65 (95% Service Level)
    const Z = 1.65;

    return rows.map(r => {
      const L = r.lead_time_days;
      const sigma_L = r.lead_time_std_dev || 1.0;
      const d_bar = r.avg_daily_demand;
      const sigma_d = r.demand_std_dev;

      // Expected Demand during Lead Time (ED = d_bar * L)
      const expectedLeadTimeDemand = d_bar * L;

      // Dynamic Safety Stock: SS = Z * sqrt(L * sigma_d^2 + d_bar^2 * sigma_L^2)
      const varianceSum = (L * Math.pow(sigma_d, 2)) + (Math.pow(d_bar, 2) * Math.pow(sigma_L, 2));
      const dynamicSafetyStock = Math.round(Z * Math.sqrt(Math.max(0, varianceSum)));

      // Dynamic Reorder Point: ROP = ED + SS
      const dynamicReorderPoint = Math.round(expectedLeadTimeDemand + dynamicSafetyStock);

      // Deficit / Required Order Quantity
      const reorderQty = Math.max(0, dynamicReorderPoint - r.current_stock);

      // Automated Status Classification
      let status = 'HOLD';
      let statusColor = '#10B981'; // Green

      if (r.total_sales_records === 0 || r.last_sale_date === 'None') {
        status = 'DEAD STOCK';
        statusColor = '#8B5CF6'; // Purple
      } else if (r.current_stock <= dynamicReorderPoint) {
        status = 'REORDER';
        statusColor = '#EF4444'; // Red
      } else if (r.current_stock <= dynamicReorderPoint * 1.30) {
        status = 'MONITOR';
        statusColor = '#F59E0B'; // Amber
      }

      return {
        product_id: r.product_id,
        sku: r.sku,
        name: r.name,
        category: r.category,
        unit_cost: r.unit_cost,
        unit_price: r.unit_price,
        current_stock: r.current_stock,
        supplier_id: r.supplier_id,
        supplier_name: r.supplier_name,
        lead_time_days: L,
        avg_daily_demand: Math.round(d_bar * 10) / 10,
        demand_std_dev: Math.round(sigma_d * 10) / 10,
        dynamic_safety_stock: dynamicSafetyStock,
        dynamic_reorder_point: dynamicReorderPoint,
        reorder_quantity: reorderQty,
        status,
        status_color: statusColor,
        last_sale_date: r.last_sale_date
      };
    });
  }
}

export const reorderRepository = new ReorderRepository();
