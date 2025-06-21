import pool from '../config/db.js';

export async function getAllStoreItems() {
  const res = await pool.query(`
    SELECT si.upc,
           si.product_id AS "productId",
           p.name AS "productName",
           p.manufacturer,
           p.characteristics,
           p.category_id AS "categoryId",
           c.name AS "categoryName",
           si.sale_price AS "salePrice",
           si.quantity,
           si.is_promotional AS "isPromotional"
    FROM store_items si
    JOIN products p ON si.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.name
  `);
  return res.rows;
}

export async function getStoreItemByUpc(upc) {
  const res = await pool.query(`
    SELECT si.upc,
           si.product_id AS "productId",
           p.name AS "productName",
           p.manufacturer,
           p.characteristics,
           p.category_id AS "categoryId",
           c.name AS "categoryName",
           si.sale_price AS "salePrice",
           si.quantity,
           si.is_promotional AS "isPromotional"
    FROM store_items si
    JOIN products p ON si.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE si.upc = $1
  `, [upc]);
  return res.rows[0];
}

export async function createStoreItem({ upc, productId, salePrice, quantity, isPromotional }) {
  const res = await pool.query(
    `INSERT INTO store_items (upc, product_id, sale_price, quantity, is_promotional)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING upc`,
    [upc, productId, salePrice, quantity, isPromotional]
  );
  return res.rows[0];
}

export async function updateStoreItem(upc, { productId, salePrice, quantity, isPromotional }) {
  const res = await pool.query(
    `UPDATE store_items
     SET product_id = $1, sale_price = $2, quantity = $3, is_promotional = $4
     WHERE upc = $5
     RETURNING upc`,
    [productId, salePrice, quantity, isPromotional, upc]
  );
  return res.rows[0];
}

export async function updateProductQuantityInStore(upc, quantity) {
  const res = await pool.query(
    `UPDATE store_items
     SET quantity = $1
     WHERE upc = $2
     RETURNING upc, quantity`,
    [quantity, upc]
  );
  return res.rows[0];
}

export async function deleteStoreItem(upc) {
  await pool.query(`DELETE FROM store_items WHERE upc = $1`, [upc]);
}
