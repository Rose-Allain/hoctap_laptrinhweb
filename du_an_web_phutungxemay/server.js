require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const pool = require('./config/db');
const { sessionMiddleware } = require('./config/session');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const cartRoutes = require('./routes/cartRoutes');

const app = express();
const port = Number(process.env.PORT) || 3000;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : false;

if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);

app.get(['/admin', '/admin/'], (_req, res) => {
  res.render('admin/index');
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Không tìm thấy API.' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Máy chủ đang chạy tại http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
