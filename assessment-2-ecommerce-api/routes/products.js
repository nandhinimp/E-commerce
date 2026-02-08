const { requireAuth, requireAdmin } = require('../middleware/auth');
const express = require('express');
const _ = require('lodash');
const jwt = require('jsonwebtoken');


const router = express.Router();

// Large product dataset to demonstrate performance issues
let products = [];

// Generate sample products (run once at startup)
function generateProducts() {
  const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty'];
  const brands = ['BrandA', 'BrandB', 'BrandC', 'BrandD', 'BrandE'];
  
  for (let i = 1; i <= 1000; i++) { // 
    products.push({
      id: i.toString(),
      name: `Product ${i}`,
      description: `This is product number ${i} with amazing features`,
      price: Math.floor(Math.random() * 1000) + 10,
      category: categories[Math.floor(Math.random() * categories.length)],
      brand: brands[Math.floor(Math.random() * brands.length)],
      stock: Math.floor(Math.random() * 100),
      rating: (Math.random() * 5).toFixed(1),
      tags: [`tag${i}`, `feature${i % 10}`],
      createdAt: new Date().toISOString(),
      // BUG: Sensitive internal data exposed
      costPrice: Math.floor(Math.random() * 500) + 5,
      supplier: `Supplier ${i % 20}`,
      internalNotes: `Internal notes for product ${i}`,
      adminOnly: Math.random() > 0.9
    });
  }
}
  generateProducts(); // Generate once at startup during server start to avoid performance issues on every request and deleted middleware so that products are not regenerated on every request

 // BUG: Hardcoded secret


// Get all products
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;// BUG: Default limit too high
    if (limit > 30) limit = 30; 
    if (limit < 1) limit = 1;
    const search = req.query.search;
    const category = req.query.category;
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder || 'asc';

    let filteredProducts = [...products]; // BUG: Not efficient, copying entire array

    // BUG: Inefficient search - linear search through all products
    if (search) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }

    // BUG: Inefficient sorting
    filteredProducts = _.orderBy(filteredProducts, [sortBy], [sortOrder]);

    // BUG: No pagination validation
    const startIndex = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + limit);

    res.set({
      'X-Total-Count': filteredProducts.length.toString(),
      'X-Performance-Warning': 'This endpoint is slow, needs optimization', // HINT
      // 'X-Secret-Query': 'try ?admin=true'
    });

    res.json({
      products: paginatedProducts.map(product => ({ 
        // middleware on every request and admin true is removed 
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        brand: product.brand,
        stock: product.stock,
        rating: product.rating,
        tags: product.tags
      })),

      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredProducts.length / limit),
        totalItems: filteredProducts.length,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    // BUG: Exposing internal error details
    res.status(500).json({ 
      error: 'Internal server error',
    });
  }
});

// Get product by ID
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // BUG: No input validation - could cause issues with malicious input
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // BUG: SQL injection-like vulnerability simulation
    if (productId.includes('<script>') || productId.includes('DROP')) {
      // BUG: Still processing the request instead of rejecting it
      console.log('Potential attack detected:', productId);
    }

    // BUG: Exposing internal data based on query parameter
    const responseData = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      brand: product.brand,
      stock: product.stock,
      rating: product.rating,
      tags: product.tags,
      createdAt: product.createdAt
  };


    res.json(responseData);
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',

    });
  }
});

// Create product
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    // BUG: No authentication check
    // BUG: No input validation
    const productData = req.body;
    
    const newId = (Math.max(...products.map(p => parseInt(p.id))) + 1).toString();
    
    const newProduct = {
      id: newId,
      name: productData.name,
      description: productData.description,
      price: productData.price, // BUG: No validation for positive numbers
      category: productData.category,
      brand: productData.brand,
      stock: productData.stock || 0,
      rating: 0,
      tags: productData.tags || [],
      createdAt: new Date().toISOString(),
      // BUG: Adding internal fields without validation
      costPrice: productData.costPrice || productData.price * 0.7,
      supplier: productData.supplier || 'Unknown',
      internalNotes: productData.internalNotes || '',
      adminOnly: productData.adminOnly || false
    };

    products.push(newProduct);

    res.status(201).json({
      message: 'Product created successfully',
      product:{
        id: newProduct.id,  
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        category: newProduct.category,
        brand: newProduct.brand,
        stock: newProduct.stock,
        rating: newProduct.rating,
        tags: newProduct.tags,
        createdAt: newProduct.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
    });
  }
});


// Update product
router.put('/:productId', requireAuth, requireAdmin,  async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;
    
    // BUG: No authentication check
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // BUG: No validation of update data
    // BUG: Allowing arbitrary field updates
    products[productIndex] = { ...products[productIndex], ...updateData };

    const updated = products[productIndex];

    res.json({
      message: 'Product updated successfully',
      product: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        price: updated.price,
        category: updated.category,
        brand: updated.brand,
        stock: updated.stock,
        rating: updated.rating,
        tags: updated.tags,
        createdAt: updated.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
    });
  }
});

// Delete product
router.delete('/:productId',requireAuth,requireAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // BUG: No authentication check
    // BUG: No admin role check for deletion
    
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    products.splice(productIndex, 1);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
