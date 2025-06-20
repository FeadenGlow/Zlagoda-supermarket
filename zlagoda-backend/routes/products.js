import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../models/productModel.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const prods = await getAllProducts();
    res.json(prods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const prod = await getProductById(req.params.id);
    if (!prod) return res.status(404).json({ message: 'Not found' });
    res.json(prod);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateToken, authorizeRoles('manager'), async (req, res) => {
  const { name, manufacturer, characteristics, categoryId } = req.body;
  if (!name) return res.status(400).json({ message: 'name потрібен' });
  try {
    const newP = await createProduct({ name, manufacturer, characteristics, categoryId });
    res.status(201).json(newP);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authenticateToken, authorizeRoles('manager'), async (req, res) => {
  const { name, manufacturer, characteristics, categoryId } = req.body;
  try {
    const existing = await getProductById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    const updated = await updateProduct(req.params.id, { name, manufacturer, characteristics, categoryId });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles('manager'), async (req, res) => {
  try {
    const existing = await getProductById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await deleteProduct(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
