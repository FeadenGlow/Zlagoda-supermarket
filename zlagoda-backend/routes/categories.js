import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { getProductsByCategoryId } from '../models/productModel.js';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../models/categoryModel.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const cats = await getAllCategories();
    res.json(cats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const cat = await getCategoryById(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Not found' });
    res.json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateToken, authorizeRoles('manager'), async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'name потрібен' });
  try {
    const newCat = await createCategory({ name });
    res.status(201).json(newCat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authenticateToken, authorizeRoles('manager'), async (req, res) => {
  const { name } = req.body;
  try {
    const existing = await getCategoryById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    const updated = await updateCategory(req.params.id, { name });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles('manager'), async (req, res) => {
  try {
    const existing = await getCategoryById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });

    // Check if there are products with this category
    const products = await getProductsByCategoryId(req.params.id);
    if (products && products.length > 0) {
      return res.status(400).json({ message: 'Неможливо видалити категорію, оскільки існують продукти з цією категорією' });
    }

    await deleteCategory(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
