const express = require('express');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// In-memory cart storage (simulate session/database)
const carts = new Map(); // BUG: Using Map without persistence



// Mock product prices for cart calculations
const productPrices = {
  '1': 100,
  '2': 200,
  '3': 150,
  '4': 75,
  '5': 300
};

// Get cart
router.get('/', requireAuth, async (req, res) => {
  try {
    // BUG: No authentication check for cart operations
    const userId = req.user.userId; // BUG: Trusting client header(changed)
    
    const cart = carts.get(userId) || { items: [], total: 0 };
    
    // BUG: Recalculating total every time instead of caching
    let calculatedTotal = 0;
    cart.items.forEach(item => {
      // BUG: Potential race condition with price updates
      const currentPrice = productPrices[item.productId] || 0;
      calculatedTotal += currentPrice * item.quantity;
    });

    // BUG: Always updating total even if not changed
    cart.total = calculatedTotal;
    carts.set(userId, cart);

    res.set({
      'X-Cart-Items': cart.items.length.toString(),// BUG: Exposing internal user ID(removed)
    });

    res.json({
      cart,
      metadata: {
        lastUpdated: new Date().toISOString(),
        itemCount: cart.items.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to cart
router.post('/',requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1 } = req.body;
    
    // BUG: No validation of productId or quantity
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const cart = carts.get(userId) || { items: [], total: 0 };
    
    // BUG: No check if product exists in product catalog
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      // BUG: No check for maximum quantity limits
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
        addedAt: new Date().toISOString(),
        // BUG: Storing price in cart (should fetch current price)
        price: productPrices[productId] || 0
      });
    }

    // BUG: Inefficient total recalculation
    cart.total = cart.items.reduce((sum, item) => {
      return sum + (productPrices[item.productId] || 0) * item.quantity;
    }, 0);

    carts.set(userId, cart);

    res.json({
      message: 'Item added to cart',
      cart,
      addedItem: { productId, quantity }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update cart item
router.put('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    // Validate productId format (digits only)
    if (!/^\d+$/.test(productId)) {
      return res.status(400).json({ error: 'Invalid productId format' });
    }

    //  Validate quantity (positive integer)
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 100) {
      return res.status(400).json({ error: 'Quantity must be 0–100 integer' });
    }

    // Check product exists
    if (!productPrices[productId]) {
      return res.status(404).json({ error: 'Product does not exist' });
    }

    const cart = carts.get(userId) || { items: [], total: 0 };

    const itemIndex = cart.items.findIndex(
      item => item.productId === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    //  Quantity = 0 → remove item
    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].updatedAt = new Date().toISOString();
    }

    // Recalculate total (still OK for now — later we optimize)
    cart.total = cart.items.reduce((sum, item) => {
      return sum + (productPrices[item.productId] || 0) * item.quantity;
    }, 0);

    carts.set(userId, cart);

    res.json({
      message: 'Cart item updated',
      cart
    });

  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from cart
router.delete('/',requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.query;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const cart = carts.get(userId) || { items: [], total: 0 };
    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    const removedItem = cart.items.splice(itemIndex, 1)[0];

    // BUG: Inefficient recalculation again
    cart.total = cart.items.reduce((sum, item) => {
      return sum + (productPrices[item.productId] || 0) * item.quantity;
    }, 0);

    carts.set(userId, cart);

    res.json({
      message: 'Item removed from cart',
      cart,
      removedItem
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
