import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import productsRoutes from './routes/products.js';
import storeItemsRoutes from './routes/storeItems.js';
import usersRoutes from './routes/users.js';
import clientCardsRoutes from './routes/customers.js';
import receiptsRoutes from './routes/receipts.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/store-items', storeItemsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/customers', clientCardsRoutes);
app.use('/api/receipts', receiptsRoutes);

app.get('/api/ping', (req, res) => res.json({ message: 'pong' }));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
