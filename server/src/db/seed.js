import { db, initializeDatabase } from './connection.js';

export function seedDatabase() {
  initializeDatabase();

  db.exec('BEGIN TRANSACTION;');
  try {
    db.exec(`
      DELETE FROM purchase_orders;
      DELETE FROM sales;
      DELETE FROM products;
      DELETE FROM suppliers;
    `);

    // 1. Insert Suppliers
    const insertSupplier = db.prepare(`
      INSERT INTO suppliers (supplier_id, name, contact_email, phone, lead_time_days, lead_time_std_dev, reliability_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const suppliers = [
      ['sup_01', 'Apex Silicon Foundry Ltd', 'supply@apexsilicon.com', '+1 408 555 0192', 7, 1.4, 0.98],
      ['sup_02', 'Precision Dynamics Motors', 'orders@precisiondyn.de', '+49 89 2018 440', 12, 2.1, 0.92],
      ['sup_03', 'Kyoto Sensorics Corp', 'dispatch@kyotosensors.jp', '+81 3 3211 8800', 5, 0.8, 0.99],
      ['sup_04', 'Vanguard Industrial Relays', 'sales@vanguardrelay.com', '+44 20 7946 0912', 14, 3.0, 0.89]
    ];

    for (const s of suppliers) {
      insertSupplier.run(...s);
    }

    // 2. Insert Products
    const insertProduct = db.prepare(`
      INSERT INTO products (product_id, sku, name, category, unit_cost, unit_price, current_stock, safety_stock, reorder_point, supplier_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const products = [
      // High-Demand Fast Movers
      ['prod_01', 'SKU-MCU-8400', 'ARM Cortex-M7 Core Processor 480MHz', 'Semiconductors', 14.50, 32.00, 18, 25, 60, 'sup_01'],
      ['prod_02', 'SKU-SENS-9201', 'Tri-Axis MEMS Vibration & Temperature Sensor', 'Sensors & Transducers', 8.20, 19.50, 14, 18, 45, 'sup_03'],
      ['prod_03', 'SKU-MTR-4020', 'Brushless DC Servo Motor 24V 4000RPM', 'Actuators & Motors', 42.00, 89.00, 8, 12, 35, 'sup_02'],
      
      // Balanced Movers (Healthy Stock)
      ['prod_04', 'SKU-RLY-2200', 'Solid State Relay 40A 240VAC DIN Rail', 'Power Electronics', 16.00, 38.00, 75, 20, 40, 'sup_04'],
      ['prod_05', 'SKU-OPT-1044', 'High-Speed Optocoupler Isolation IC', 'Optoelectronics', 1.80, 4.50, 240, 50, 100, 'sup_01'],
      ['prod_06', 'SKU-PWR-5012', 'Step-Down Buck Regulator Module 12V-5V', 'Power Electronics', 5.40, 12.80, 95, 30, 55, 'sup_01'],

      // Warning / Approaching Stockout
      ['prod_07', 'SKU-ENC-6000', 'Optical Incremental Rotary Encoder 1024PPR', 'Sensors & Transducers', 28.00, 64.00, 22, 15, 28, 'sup_03'],
      ['prod_08', 'SKU-DRV-8825', 'Microstepping Bipolar Stepper Driver', 'Actuators & Motors', 6.50, 15.00, 29, 20, 38, 'sup_02'],

      // Dead Stock (Zero sales in >90 days, tying up working capital)
      ['prod_09', 'SKU-OBS-0100', 'Legacy RS-232 to Current Loop Converter', 'Legacy Interfaces', 34.00, 72.00, 160, 10, 15, 'sup_04'],
      ['prod_10', 'SKU-TUB-0012', 'Vitreous Enamelled Wirewound Resistor 50W', 'Passive Components', 7.50, 14.00, 320, 20, 30, 'sup_04']
    ];

    for (const p of products) {
      insertProduct.run(...p);
    }

    // 3. Generate Historical Daily Sales (Past 60 days)
    const insertSale = db.prepare(`
      INSERT INTO sales (sale_id, product_id, customer_id, order_date, sale_date, quantity, unit_price, amount, total_revenue, channel)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const customers = ['101', '102', '103', '104', '105'];
    const now = new Date();

    for (let dayOffset = 59; dayOffset >= 0; dayOffset--) {
      const saleDate = new Date(now.getTime() - dayOffset * 86400000).toISOString().slice(0, 10);
      const dayOfWeek = new Date(saleDate).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const cust1 = customers[dayOffset % customers.length];
      const cust2 = customers[(dayOffset + 1) % customers.length];

      // Fast-moving processor: 6 to 14 units/day
      const qty1 = isWeekend ? Math.floor(2 + Math.random() * 4) : Math.floor(7 + Math.random() * 8);
      const rev1 = qty1 * 32.00;
      insertSale.run(`sl_${saleDate}_p1`, 'prod_01', cust1, saleDate, saleDate, qty1, 32.00, rev1, rev1, 'Direct Store');

      // Sensor: 4 to 10 units/day
      const qty2 = isWeekend ? Math.floor(1 + Math.random() * 3) : Math.floor(5 + Math.random() * 6);
      const rev2 = qty2 * 19.50;
      insertSale.run(`sl_${saleDate}_p2`, 'prod_02', cust2, saleDate, saleDate, qty2, 19.50, rev2, rev2, 'OEM Contract');

      // Motor: 2 to 6 units/day
      const qty3 = isWeekend ? 1 : Math.floor(2 + Math.random() * 4);
      const rev3 = qty3 * 89.00;
      insertSale.run(`sl_${saleDate}_p3`, 'prod_03', cust1, saleDate, saleDate, qty3, 89.00, rev3, rev3, 'Direct Store');

      // Relay: steady 3 to 5 units/day
      const qty4 = Math.floor(2 + Math.random() * 3);
      const rev4 = qty4 * 38.00;
      insertSale.run(`sl_${saleDate}_p4`, 'prod_04', cust2, saleDate, saleDate, qty4, 38.00, rev4, rev4, 'Wholesale');

      // Optocoupler: 8 to 20 units/day
      const qty5 = Math.floor(8 + Math.random() * 12);
      const rev5 = qty5 * 4.50;
      insertSale.run(`sl_${saleDate}_p5`, 'prod_05', cust1, saleDate, saleDate, qty5, 4.50, rev5, rev5, 'OEM Contract');

      // Buck regulator: 4 to 9 units/day
      const qty6 = Math.floor(3 + Math.random() * 6);
      const rev6 = qty6 * 12.80;
      insertSale.run(`sl_${saleDate}_p6`, 'prod_06', cust2, saleDate, saleDate, qty6, 12.80, rev6, rev6, 'Direct Store');

      // Encoder: 2 to 5 units/day
      const qty7 = Math.floor(2 + Math.random() * 3);
      const rev7 = qty7 * 64.00;
      insertSale.run(`sl_${saleDate}_p7`, 'prod_07', cust1, saleDate, saleDate, qty7, 64.00, rev7, rev7, 'Direct Store');

      // Stepper Driver: 3 to 6 units/day
      const qty8 = Math.floor(2 + Math.random() * 4);
      const rev8 = qty8 * 15.00;
      insertSale.run(`sl_${saleDate}_p8`, 'prod_08', cust2, saleDate, saleDate, qty8, 15.00, rev8, rev8, 'Direct Store');
    }

    // 4. Seed Monthly Historical Sales Data Specifically for Slide 10 CTE Query Benchmark
    // Exact Slide 10 values for Customer 101 over past 5 months:
    // [1250.75, 980.50, 1430.00, 1100.25, 1675.80]
    const slide10TargetSales101 = [1250.75, 980.50, 1430.00, 1100.25, 1675.80];
    for (let m = 0; m < slide10TargetSales101.length; m++) {
      const monthOffset = slide10TargetSales101.length - 1 - m;
      const targetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 15).toISOString().slice(0, 10);
      const amount = slide10TargetSales101[m];
      insertSale.run(`sl_slide10_c101_m${m}`, 'prod_01', '101', targetDate, targetDate, Math.round(amount / 32), 32.00, amount, amount, 'Slide 10 Benchmark Order');
    }

    // Also seed multi-month records for Customer 102 & 103 for comparative ranking
    const targetSales102 = [850.00, 1200.00, 1310.50, 1450.00, 1520.00];
    for (let m = 0; m < targetSales102.length; m++) {
      const monthOffset = targetSales102.length - 1 - m;
      const targetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 18).toISOString().slice(0, 10);
      const amount = targetSales102[m];
      insertSale.run(`sl_slide10_c102_m${m}`, 'prod_02', '102', targetDate, targetDate, Math.round(amount / 19.5), 19.50, amount, amount, 'Contract Bulk');
    }

    const targetSales103 = [1400.00, 1150.00, 1550.00, 1280.00, 1720.00];
    for (let m = 0; m < targetSales103.length; m++) {
      const monthOffset = targetSales103.length - 1 - m;
      const targetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 20).toISOString().slice(0, 10);
      const amount = targetSales103[m];
      insertSale.run(`sl_slide10_c103_m${m}`, 'prod_03', '103', targetDate, targetDate, Math.round(amount / 89), 89.00, amount, amount, 'Enterprise OEM');
    }

    // 5. Insert Initial Purchase Orders
    const insertPo = db.prepare(`
      INSERT INTO purchase_orders (po_id, product_id, supplier_id, order_quantity, unit_cost, total_amount, status, order_date, expected_delivery_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const expDate = new Date(now.getTime() + 5 * 86400000).toISOString();
    insertPo.run('po_1001', 'prod_01', 'sup_01', 50, 14.50, 725.00, 'PENDING', now.toISOString(), expDate, 'Emergency replenishment for ARM Cortex-M7 due to stockout risk.');
    insertPo.run('po_1002', 'prod_03', 'sup_02', 30, 42.00, 1260.00, 'DISPATCHED', now.toISOString(), expDate, 'Routine replenishment order for high-torque servo motors.');

    db.exec('COMMIT;');
    console.log('Dynamic Inventory database successfully seeded with 60 days of sales + Slide 10 CTE benchmark history.');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
