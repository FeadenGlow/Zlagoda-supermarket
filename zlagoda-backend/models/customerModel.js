import pool from '../config/db.js';

const TABLE = 'customers';

export async function getAllCards({ search, sort }) {
  let query = `SELECT card_number AS "cardNumber", full_name AS "fullName", phone, address, discount FROM ${TABLE}`;
  const params = [];
  if (search) {
    query += ` WHERE LOWER(full_name) LIKE $1`;
    params.push(`%${search.toLowerCase()}%`);
  }
  if (sort === 'nameAsc') {
    query += ` ORDER BY full_name ASC`;
  } else if (sort === 'nameDesc') {
    query += ` ORDER BY full_name DESC`;
  }
  const res = await pool.query(query, params);
  return res.rows;
}

export async function findCardByNumber(cardNumber) {
  const res = await pool.query(
    `SELECT card_number AS "cardNumber", full_name AS "fullName", phone, address, discount
     FROM ${TABLE} WHERE card_number = $1`,
    [cardNumber]
  );
  return res.rows[0];
}

export async function createCard({ cardNumber, fullName, phone, address, discount }) {
  const res = await pool.query(
    `INSERT INTO ${TABLE} (card_number, full_name, phone, address, discount)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING card_number AS "cardNumber", full_name AS "fullName", phone, address, discount`,
    [cardNumber, fullName, phone, address, discount]
  );
  return res.rows[0];
}

export async function updateCard(cardNumber, { fullName, phone, address, discount }) {
  const res = await pool.query(
    `UPDATE ${TABLE}
     SET full_name = $1, phone = $2, address = $3, discount = $4
     WHERE card_number = $5
     RETURNING card_number AS "cardNumber", full_name AS "fullName", phone, address, discount`,
    [fullName, phone, address, discount, cardNumber]
  );
  return res.rows[0];
}

export async function deleteCard(cardNumber) {
  await pool.query(
    `DELETE FROM ${TABLE} WHERE card_number = $1`,
    [cardNumber]
  );
}
