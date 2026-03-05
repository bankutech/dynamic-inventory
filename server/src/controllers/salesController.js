import { salesRepository } from '../repositories/salesRepository.js';
import { simulationService } from '../services/simulationService.js';

export const getSalesHistory = (req, res, next) => {
  try {
    const { productId, limit } = req.query;
    const history = salesRepository.findRecentSales(productId, limit ? parseInt(limit) : 60);
    res.json({ status: 'success', results: history.length, data: history });
  } catch (err) {
    next(err);
  }
};

export const getMonthlySalesReport = (req, res, next) => {
  try {
    const { customerId } = req.query;
    const report = salesRepository.getMonthlySalesReport(customerId || null);

    // Compute summary telemetry
    const totalVolume = report.reduce((sum, r) => sum + (r.total_sales || 0), 0);
    const customersTracked = [...new Set(report.map(r => r.customer_id))];

    res.json({
      status: 'success',
      rowCount: report.length,
      customers: customersTracked,
      totalVolume: Math.round(totalVolume * 100) / 100,
      data: report
    });
  } catch (err) {
    next(err);
  }
};

export const recordSale = (req, res, next) => {
  try {
    const { product_id, quantity, channel, customer_id } = req.body;
    const result = salesRepository.recordSale(product_id, parseInt(quantity), channel, customer_id);
    res.status(201).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

export const simulateSurge = (req, res, next) => {
  try {
    const { productId, volume } = req.body;
    const result = simulationService.simulateDemandSurge(productId, parseInt(volume) || 25);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};
