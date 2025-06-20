import pool from './config/db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const username = 'oleg';
  const password = 'password123';
  const name = 'Олег';
  const role = 'cashier';
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  try {
    const res = await pool.query(
      'INSERT INTO users (username, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [username, passwordHash, name, role]
    );
    console.log('Seeded user id:', res.rows[0].id);
  } catch (err) {
    console.error('Error seeding user:', err);
  } finally {
    pool.end();
  }
}
seed();
