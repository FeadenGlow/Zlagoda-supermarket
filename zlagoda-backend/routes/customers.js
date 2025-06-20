import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import {
  getAllCards,
  findCardByNumber,
  createCard,
  updateCard,
  deleteCard
} from '../models/customerModel.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, sort } = req.query;
    const cards = await getAllCards({ search, sort });
    res.json(cards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:cardNumber', authenticateToken, async (req, res) => {
  try {
    const card = await findCardByNumber(req.params.cardNumber);
    if (!card) return res.status(404).json({ message: 'Not found' });
    res.json(card);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateToken, authorizeRoles('manager'), async (req, res) => {
  const { cardNumber, fullName, phone, address, discount } = req.body;
  if (!cardNumber || !fullName || !phone || !address || discount == null) {
    return res.status(400).json({ message: 'Всі поля обов’язкові' });
  }
  try {
    const existing = await findCardByNumber(cardNumber);
    if (existing) {
      return res.status(400).json({ message: 'Card number already exists' });
    }
    const card = await createCard({ cardNumber, fullName, phone, address, discount });
    res.status(201).json(card);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка створення картки' });
  }
});

router.put('/:cardNumber', authenticateToken, authorizeRoles('manager', 'cashier'), async (req, res) => {
  const { cardNumber } = req.params;
  const { fullName, phone, address, discount } = req.body;
  if (!fullName || !phone || !address || discount == null) {
    return res.status(400).json({ message: 'Всі поля обов’язкові' });
  }
  try {
    const existing = await findCardByNumber(cardNumber);
    if (!existing) {
      return res.status(404).json({ message: 'Not found' });
    }
    const updated = await updateCard(cardNumber, { fullName, phone, address, discount });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка оновлення картки' });
  }
});

router.delete('/:cardNumber', authenticateToken, authorizeRoles('manager'), async (req, res) => {
  try {
    const existing = await findCardByNumber(req.params.cardNumber);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await deleteCard(req.params.cardNumber);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка видалення картки' });
  }
});

export default router;
