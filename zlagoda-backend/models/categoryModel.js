import pool from '../config/db.js';

export async function getAllCategories() {
  const res = await pool.query(
    `SELECT id, name FROM categories ORDER BY name`
  );
  return res.rows;
}

export async function getCategoryById(id) {
  const res = await pool.query(
    `SELECT id, name FROM categories WHERE id = $1`,
    [id]
  );
  return res.rows[0];
}

export async function createCategory({ name }) {
  const res = await pool.query(
    `INSERT INTO categories (name) VALUES ($1) RETURNING id, name`,
    [name]
  );
  return res.rows[0];
}

export async function updateCategory(id, { name }) {
  const res = await pool.query(
    `UPDATE categories SET name = $1 WHERE id = $2 RETURNING id, name`,
    [name, id]
  );
  return res.rows[0];
}

export async function deleteCategory(id) {
  await pool.query(
    `DELETE FROM categories WHERE id = $1`,
    [id]
  );
}
