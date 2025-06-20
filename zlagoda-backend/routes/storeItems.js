import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import {
  getAllStoreItems,
  getStoreItemByUpc,
  createStoreItem,
  updateStoreItem,
  deleteStoreItem
} from '../models/storeItemModel.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await getAllStoreItems();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:upc', authenticateToken, async (req, res) => {
  try {
    const item = await getStoreItemByUpc(req.params.upc);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateToken, authorizeRoles('manager'), async (req, res) => {
  const { upc, productId, salePrice, quantity, isPromotional } = req.body;
  if (!upc || !productId || salePrice == null || quantity == null) {
    return res.status(400).json({ message: 'upc, productId, salePrice, quantity потрібні' });
  }
  try {
    const existing = await getStoreItemByUpc(upc);
    if (existing) {
      return res.status(400).json({ message: 'UPC вже існує' });
    }
    const newItem = await createStoreItem({ upc, productId, salePrice, quantity, isPromotional: Boolean(isPromotional) });
    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:upc', authenticateToken, authorizeRoles('manager'), async (req, res) => {
  const upc = req.params.upc;
  const { productId, salePrice, quantity, isPromotional } = req.body;
  try {
    const existing = await getStoreItemByUpc(upc);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    const updated = await updateStoreItem(upc, { productId, salePrice, quantity, isPromotional: Boolean(isPromotional) });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:upc', authenticateToken, authorizeRoles('manager'), async (req, res) => {
  try {
    const existing = await getStoreItemByUpc(req.params.upc);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await deleteStoreItem(req.params.upc);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
