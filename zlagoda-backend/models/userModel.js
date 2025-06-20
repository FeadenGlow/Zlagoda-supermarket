import pool from '../config/db.js';

export async function findUserByUsername(username) {
    const res = await pool.query(
      `SELECT id, username, password_hash, name, role, salary, start_date AS "startDate", birth_date AS "birthDate", phone, address
       FROM users WHERE username = $1`, [username]
    );
    return res.rows[0];
  }
export async function findUserById(id) {
  const res = await pool.query(
    `SELECT id, username, name, role, salary, start_date AS "startDate", birth_date AS "birthDate", phone, address
      FROM users WHERE id = $1`, [id]
  );
  return res.rows[0];
}
