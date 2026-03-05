import { productRepository } from '../repositories/productRepository.js';

export const getProducts = (req, res, next) => {
  try {
    const products = productRepository.findAll();
    res.json({ status: 'success', results: products.length, data: products });
  } catch (err) {
    next(err);
  }
};

export const getProductById = (req, res, next) => {
  try {
    const product = productRepository.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'fail', message: 'Product not found' });
    }
    res.json({ status: 'success', data: product });
  } catch (err) {
    next(err);
  }
};

export const updateStock = (req, res, next) => {
  try {
    const { current_stock } = req.body;
    const updated = productRepository.updateStock(req.params.id, parseInt(current_stock));
    res.json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
};
