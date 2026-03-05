import { reorderRepository } from '../repositories/reorderRepository.js';
import { purchaseOrderRepository } from '../repositories/poRepository.js';

export const getReorderAnalysis = (req, res, next) => {
  try {
    const analysis = reorderRepository.getDynamicReorderAnalysis();
    res.json({ status: 'success', results: analysis.length, data: analysis });
  } catch (err) {
    next(err);
  }
};

export const getMovingAverages = (req, res, next) => {
  try {
    const { productId } = req.params;
    const movingAverages = reorderRepository.getMovingAverages(productId);
    res.json({ status: 'success', data: movingAverages });
  } catch (err) {
    next(err);
  }
};

export const getPurchaseOrders = (req, res, next) => {
  try {
    const orders = purchaseOrderRepository.findAll();
    res.json({ status: 'success', results: orders.length, data: orders });
  } catch (err) {
    next(err);
  }
};

export const createPurchaseOrder = (req, res, next) => {
  try {
    const po = purchaseOrderRepository.create(req.body);
    res.status(201).json({ status: 'success', data: po });
  } catch (err) {
    next(err);
  }
};

export const updatePurchaseOrderStatus = (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = purchaseOrderRepository.updateStatus(req.params.id, status);
    res.json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
};
