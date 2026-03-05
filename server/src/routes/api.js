import { Router } from 'express';
import { getProducts, getProductById, updateStock } from '../controllers/productController.js';
import { getSalesHistory, getMonthlySalesReport, recordSale, simulateSurge } from '../controllers/salesController.js';
import { 
  getReorderAnalysis, 
  getMovingAverages, 
  getPurchaseOrders, 
  createPurchaseOrder, 
  updatePurchaseOrderStatus 
} from '../controllers/reorderController.js';
import { executeQuery } from '../controllers/sqlStudioController.js';
import { authorizeRoles, ROLES } from '../middleware/rbac.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Dynamic Inventory API', timestamp: new Date().toISOString() });
});

// Products & Stock (Read: All, Mutate: Floor/Admin)
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.patch('/products/:id/stock', authorizeRoles(ROLES.FLOOR, ROLES.ADMIN), updateStock);

// Sales & Time-Series (Read: All, Mutate: Floor/Admin)
router.get('/sales', getSalesHistory);
router.post('/sales', authorizeRoles(ROLES.FLOOR, ROLES.ADMIN), recordSale);
router.post('/sales/simulate-surge', authorizeRoles(ROLES.FLOOR, ROLES.ADMIN), simulateSurge);

// Dynamic Reorder & Monthly CTE Analytics (Read: All roles)
router.get('/analytics/reorder-analysis', getReorderAnalysis);
router.get('/analytics/moving-averages/:productId', getMovingAverages);
router.get('/analytics/monthly-sales-report', getMonthlySalesReport);

// Purchase Orders & Replenishment (Read: All, Mutate: Procurement/Admin)
router.get('/purchase-orders', getPurchaseOrders);
router.post('/purchase-orders', authorizeRoles(ROLES.PROCUREMENT, ROLES.ADMIN), createPurchaseOrder);
router.patch('/purchase-orders/:id/status', authorizeRoles(ROLES.PROCUREMENT, ROLES.ADMIN), updatePurchaseOrderStatus);

// Advanced SQL Studio Runner (Analyst/Admin only)
router.post('/sql/execute', authorizeRoles(ROLES.ANALYST, ROLES.ADMIN), executeQuery);

export default router;
