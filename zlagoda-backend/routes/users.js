import express from 'express';
  import bcrypt from 'bcrypt';
  import { authenticateToken } from '../middleware/auth.js';
  import { authorizeRoles } from '../middleware/authorize.js';
  import pool from '../config/db.js';

  const router = express.Router();

  router.get('/', authenticateToken, authorizeRoles('manager'), async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, username, name AS "fullName", role AS position, salary, start_date AS "startDate", birth_date AS "birthDate", phone, address
         FROM users ORDER BY name`
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.post('/', authenticateToken, authorizeRoles('manager'), async (req, res) => {
    const { fullName, position, salary, startDate, birthDate, phone, address, username, password } = req.body;
    if (!fullName || !position || salary == null || !startDate || !birthDate || !phone || !address || !username || !password) {
      return res.status(400).json({ message: `Всі поля обов'язкові` });
    }
    try {
      const exists = await pool.query('SELECT id FROM users WHERE username=$1', [username]);
      if (exists.rows.length) return res.status(400).json({ message: 'Username вже зайнятий' });
      const hash = await bcrypt.hash(password, 10);
      const insert = await pool.query(
        `INSERT INTO users (username, password_hash, name, role, salary, start_date, birth_date, phone, address)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [username, hash, fullName, position, salary, startDate, birthDate, phone, address]
      );
      res.status(201).json({ id: insert.rows[0].id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.put('/:id', authenticateToken, authorizeRoles('manager'), async (req, res) => {
    const { id } = req.params;
    const { fullName, position, salary, startDate, birthDate, phone, address, username, password } = req.body;
    try {
      const exist = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
      if (!exist.rows.length) return res.status(404).json({ message: 'Не знайдено' });
      if (username) {
        const u = await pool.query('SELECT id FROM users WHERE username=$1 AND id<>$2', [username, id]);
        if (u.rows.length) return res.status(400).json({ message: 'Username вже зайнятий' });
      }
      let query = `UPDATE users SET username=$1, name=$2, role=$3, salary=$4, start_date=$5, birth_date=$6, phone=$7, address=$8`;
      const params = [username, fullName, position, salary, startDate, birthDate, phone, address];
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        query += `, password_hash=$9 WHERE id=$10`;
        params.push(hash, id);
      } else {
        query += ` WHERE id=$9`;
        params.push(id);
      }
      await pool.query(query, params);
      res.json({ message: 'Оновлено' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.delete('/:id', authenticateToken, authorizeRoles('manager'), async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM users WHERE id=$1', [id]);
      res.status(204).end();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  export default router;