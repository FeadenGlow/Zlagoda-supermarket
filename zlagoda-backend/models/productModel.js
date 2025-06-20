import pool from '../config/db.js';

export async function getAllProducts() {
  const res = await pool.query(`
    SELECT p.id, p.name, p.manufacturer, p.characteristics,
           p.category_id AS "categoryId", c.name AS "categoryName"
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.name
  `);
  return res.rows;
}

export async function getProductById(id) {
  const res = await pool.query(`
    SELECT p.id, p.name, p.manufacturer, p.characteristics,
           p.category_id AS "categoryId", c.name AS "categoryName"
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = $1
  `, [id]);
  return res.rows[0];
}

export async function createProduct({ name, manufacturer, characteristics, categoryId }) {
  const res = await pool.query(
    `INSERT INTO products (name, manufacturer, characteristics, category_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, manufacturer, characteristics, category_id AS "categoryId"`,
    [name, manufacturer, characteristics, categoryId || null]
  );
  return res.rows[0];
}

export async function updateProduct(id, { name, manufacturer, characteristics, categoryId }) {
  const res = await pool.query(
    `UPDATE products
     SET name = $1, manufacturer = $2, characteristics = $3, category_id = $4
     WHERE id = $5
     RETURNING id, name, manufacturer, characteristics, category_id AS "categoryId"`,
    [name, manufacturer, characteristics, categoryId || null, id]
  );
  return res.rows[0];
}

export async function deleteProduct(id) {
  await pool.query(`DELETE FROM products WHERE id = $1`, [id]);
}
