import pool from '../config/db.js';
import { findCardByNumber } from './customerModel.js';

export async function getReceiptById(id) {
  const res = await pool.query(
    `SELECT r.id, r.cashier_id AS "cashierId", r.date, r.total, r.vat, r.card_number, u.name AS "cashierName"
     FROM receipts r
     JOIN users u ON r.cashier_id = u.id
     WHERE r.id = $1`,
    [id]
  );
  if (res.rows.length === 0) return null;
  const receipt = res.rows[0];
  const itemsRes = await pool.query(
    `SELECT ri.product_upc AS upc, p.name AS "productName", ri.quantity, ri.price_at_sale AS price
     FROM receipt_items ri
     JOIN store_items si ON ri.product_upc = si.upc
     JOIN products p ON si.product_id = p.id
     WHERE ri.receipt_id = $1`,
    [id]
  );
  receipt.items = itemsRes.rows;
  return receipt;
}

export async function getReceipts({ cashierId, startDate, endDate }) {
  let query = `SELECT r.id, r.cashier_id AS "cashierId", u.name AS "cashierName", r.date, r.total, r.vat, r.card_number
               FROM receipts r JOIN users u ON r.cashier_id = u.id`;
  const conditions = [];
  const params = [];
  let idx = 1;
  if (cashierId) {
    conditions.push(`r.cashier_id = $${idx++}`);
    params.push(cashierId);
  }
  if (startDate) {
    conditions.push(`r.date >= $${idx++}`);
    params.push(startDate);
  }
  if (endDate) {
    conditions.push(`r.date <= $${idx++}`);
    params.push(endDate);
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY r.date DESC';
  const res = await pool.query(query, params);
  return res.rows;
}

export async function createReceipt({ cashierId, items, cardNumber }) {
  let total = 0;
  items.forEach(it => {
    total += parseFloat(it.price) * parseInt(it.quantity, 10);
  });
  let vat = total * 0.2;
  let discount = 0;

  if (cardNumber) {
    const card = await findCardByNumber(cardNumber);
    if (card && card.discount) {
      discount = parseFloat(card.discount) || 0;
      vat = vat - (vat * discount / 100);
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query(
      `INSERT INTO receipts (cashier_id, date, total, vat, card_number) VALUES ($1, NOW(), $2, $3, $4) RETURNING id, date, total, vat, card_number`,
      [cashierId, total, vat, cardNumber || null]
    );
    const receipt = res.rows[0];
    for (const it of items) {
      await client.query(
        `INSERT INTO receipt_items (receipt_id, product_upc, quantity, price_at_sale)
         VALUES ($1, $2, $3, $4)`,
        [receipt.id, it.upc, it.quantity, it.price]
      );
    }
    await client.query('COMMIT');
    return receipt;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteReceipt(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM receipt_items WHERE receipt_id = $1', [id]);
    await client.query('DELETE FROM receipts WHERE id = $1', [id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getTotalSum({ cashierId, startDate, endDate }) {
  let query = 'SELECT SUM(total) AS sum FROM receipts';
  const conditions = [];
  const params = [];
  let idx = 1;
  if (cashierId) {
    conditions.push(`cashier_id = $${idx++}`);
    params.push(cashierId);
  }
  if (startDate) {
    conditions.push(`date >= $${idx++}`);
    params.push(startDate);
  }
  if (endDate) {
    conditions.push(`date <= $${idx++}`);
    params.push(endDate);
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  const res = await pool.query(query, params);
  return res.rows[0].sum || 0;
}

export async function getTotalQuantitySold({ productUpc, cashierId, startDate, endDate }) {
    let query = `SELECT SUM(ri.quantity) AS total_qty
                             FROM receipt_items ri
                             JOIN receipts r ON ri.receipt_id = r.id`;
    const conditions = [];
    const params = [];
    let idx = 1;
    if (productUpc) {
        conditions.push(`ri.product_upc = $${idx++}`);
        params.push(productUpc);
    }
    if (cashierId) {
        conditions.push(`r.cashier_id = $${idx++}`);
        params.push(cashierId);
    }
    if (startDate) {
        conditions.push(`r.date >= $${idx++}`);
        params.push(startDate);
    }
    if (endDate) {
        conditions.push(`r.date <= $${idx++}`);
        params.push(endDate);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    const res = await pool.query(query, params);
    return res.rows[0].total_qty || 0;
}