const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();


// Import routes
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const secretProductRoutes = require('./routes/product_secret_endpoint');
const rateLimit = require('express-rate-limit');
const categoriesRoutes = require('./routes/categories');


const app = express();
// Rate limiter for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP
  message: { error: 'Too many requests, try again later' }
});
const PORT = process.env.PORT || 3002;

// Middleware
// only trusted frontend calls api are allowed 
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Custom headers for puzzle hints


// Routes

app.use('/api', apiLimiter);

app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/product_secret_endpoint', secretProductRoutes);
app.use('/api/categories', categoriesRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🛒 Assessment 2: E-commerce Product API running on http://localhost:${PORT}`);
  console.log(`📋 View instructions: http://localhost:${PORT}`);
  console.log(`⚡ Performance challenges await!`);
});
