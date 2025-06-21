import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { getStoreItemByUpc, updateProductQuantityInStore } from '../models/storeItemModel.js';
import {
  createReceipt,
  deleteReceipt,
  getReceiptById,
  getReceipts,
  getTotalSum,
  getTotalQuantitySold
} from '../models/receiptModel.js';

const router = express.Router();

router.post('/', authenticateToken, authorizeRoles('cashier'), async (req, res) => {
  try {
    const cashierId = req.user.id;
    const { items, cardNumber } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Потрібно вказати товари' });
    }

    for (const item of items) {
      const storeItem = await getStoreItemByUpc(item.upc);
      if (!storeItem) {
        return res.status(400).json({ message: `Товар з UPC ${item.upc} не знайдено` });
      }
      if (storeItem.quantity < item.quantity) {
        return res.status(400).json({ message: `Недостатньо товару з UPC ${item.upc}` });
      }
    }

    for (const item of items) {
      const storeItem = await getStoreItemByUpc(item.upc);
      const newQty = storeItem.quantity - item.quantity;
      await updateProductQuantityInStore(item.upc, newQty);

      if (storeItem.isPromotional) {
        item.price = +(item.price * 0.8).toFixed(2);
      }
    }

    const receipt = await createReceipt({ cashierId, items, cardNumber });
    res.status(201).json(receipt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка створення чека' });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles('manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteReceipt(id);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка видалення чека' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const receipt = await getReceiptById(id);
    if (!receipt) return res.status(404).json({ message: 'Чек не знайдено' });
    if (req.user.role === 'cashier' && receipt.cashierId !== req.user.id) {
      return res.status(403).json({ message: 'Недостатньо прав' });
    }
    res.json(receipt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    let { cashierId, startDate, endDate } = req.query;
    if (req.user.role === 'cashier') {
      cashierId = req.user.id;
    }
    const receipts = await getReceipts({
      cashierId: cashierId ? parseInt(cashierId, 10) : undefined,
      startDate,
      endDate
    });
    res.json(receipts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/analytics/total-sum', authenticateToken, async (req, res) => {
  try {
    let { cashierId, startDate, endDate } = req.query;
    if (req.user.role === 'cashier') cashierId = req.user.id;
    const sum = await getTotalSum({
      cashierId: cashierId ? parseInt(cashierId, 10) : undefined,
      startDate,
      endDate
    });
    res.json({ sum });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/analytics/quantity', authenticateToken, authorizeRoles('manager'), async (req, res) => {
    try {
        const { productUpc, startDate, endDate, cashierId } = req.query;
        if (!productUpc) return res.status(400).json({ message: 'Вкажіть UPC товару' });
        const qty = await getTotalQuantitySold({ productUpc, startDate, endDate, cashierId });
        res.json({ totalQty: qty });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;