const { requireAuth, requireAdmin } = require('../middleware/auth');
const express = require('express');
const _ = require('lodash');
const router = express.Router();

// Large product dataset to demonstrate performance issues
let products = [];

const productListCache = new Map();
const searchIndex = new Map();

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

  function buildSearchIndex() {
  products.forEach(p => {
    const text = (p.name + ' ' + p.description).toLowerCase();
    const words = text.split(/\W+/);

    words.forEach(word => {
      if (!searchIndex.has(word)) {
        searchIndex.set(word, []);
      }
      searchIndex.get(word).push(p);
    });
  });
}

buildSearchIndex();

 // BUG: Hardcoded secret

function isValidProductId(id) {
  return /^\d+$/.test(id);
}

function validateProductBody(body) {
  if (!body || typeof body !== 'object') {
    return 'Invalid body';
  }

  if (!body.name || typeof body.name !== 'string') {
    return 'Name is required';
  }

  if (typeof body.price !== 'number' || body.price < 0) {
    return 'Price must be positive number';
  }

  if (body.stock && typeof body.stock !== 'number') {
    return 'Stock must be number';
  }

  return null;
}


// Get all products
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;// BUG: Default limit too high
    if (limit > 30) limit = 30; 
    if (limit < 1) limit = 1;
    const search = req.query.search;
    const category = req.query.category;
    const allowedSort = ['name','price','rating'];
    const sortBy = allowedSort.includes(req.query.sortBy)
      ? req.query.sortBy
      : 'name';
const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';
    // Added cache so no recomputing again and again 
    const cacheKey = JSON.stringify(req.query);
    const cached = productListCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return res.json(cached.data);
    }

    let filteredProducts = products; // BUG: Not efficient, copying entire array

    // BUG: Inefficient search - linear search through all products(coreected by search index)
    if (search) {
      const term = search.toLowerCase();
      filteredProducts = searchIndex.get(term) || [];
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
      // 'X-Performance-Warning': 'This endpoint is slow, needs optimization', // HINT
      // 'X-Secret-Query': 'try ?admin=true'
    });

    const responseObject = {
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
    };

    productListCache.set(cacheKey, {
      data: responseObject,
      expiry: Date.now() + 30 * 1000
    });

    res.json(responseObject);
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
    // validation for productid
      if (!isValidProductId(productId)) {
      return res.status(400).json({ error: 'Invalid product id format' });
    }
    
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // BUG: SQL injection-like vulnerability simulation(added function at top )
 

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
    const error = validateProductBody(req.body);
    if (error) return res.status(400).json({ error });
    
    const{name,
      description,
      price,
      category,
      brand,
      stock,
      tags,
      
    } =req.body;
    const newId = (Math.max(...products.map(p => parseInt(p.id))) + 1).toString();
    
  const newProduct = {
      id: newId,
      name: name.trim(),
      description: description || '',
      price,
      category: category || 'General',
      brand: brand || 'Unknown',
      stock: typeof stock === 'number' ? stock : 0,
      rating: 0,
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString(),
      // BUG: Adding internal fields without validation
       costPrice: Math.floor(price * 0.7),
      supplier: 'Internal',
      internalNotes: '',
      adminOnly: false
    };

    products.push(newProduct);

    productListCache.clear();
    searchIndex.clear();
    buildSearchIndex();

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
    if (!isValidProductId(productId)) {
      return res.status(400).json({ error: 'Invalid product id format' });
    }
    
    // BUG: No authentication check
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });

    }
    const updateData = req.body;
    const allowedFields = ['name', 'description', 'price', 'category', 'brand', 'stock', 'tags'];

    for (const key of Object.keys(updateData)) {
      if (!allowedFields.includes(key)) {
        return res.status(400).json({ error: `Field not allowed: ${key}` });
      }
    }

    // BUG: No validation of update data
    // BUG: Allowing arbitrary field updates
// Value validations (only if field present)

    if (updateData.name !== undefined &&
        typeof updateData.name !== 'string') {
      return res.status(400).json({ error: 'Invalid name' });
    }

    if (updateData.price !== undefined &&
        (typeof updateData.price !== 'number' || updateData.price < 0)) {
      return res.status(400).json({ error: 'Invalid price' });
    }

    if (updateData.stock !== undefined &&
        (typeof updateData.stock !== 'number' || updateData.stock < 0)) {
      return res.status(400).json({ error: 'Invalid stock' });
    }

    if (updateData.tags !== undefined &&
        !Array.isArray(updateData.tags)) {
      return res.status(400).json({ error: 'Tags must be array' });
    }

    // Apply safe updates only
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        products[productIndex][field] = updateData[field];
      }
    });

    productListCache.clear();
    searchIndex.clear();
    buildSearchIndex();


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
    
    if (!isValidProductId(productId)) {
      return res.status(400).json({ error: 'Invalid product id format' });
    }
    
    // BUG: No authentication check
    // BUG: No admin role check for deletion
    
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    products.splice(productIndex, 1);

    productListCache.clear();
    searchIndex.clear();
    buildSearchIndex();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
    });
  }
});

module.exports = router;
module.exports.getProducts = () => products;
