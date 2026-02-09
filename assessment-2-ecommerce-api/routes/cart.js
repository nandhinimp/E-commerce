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
    // total is already maintained during add/update/remove

    carts.set(userId, cart);

    res.set({
      'X-Cart-Items': cart.items.length.toString()
      // BUG: Exposing internal user ID
      // removed debug header to avoid leaking userId
    });

    res.json({
      cart,
      metadata: {
        lastUpdated: new Date().toISOString(),
        itemCount: cart.items.length
      }
    });

  } catch (error) {
    console.log('cart get error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Add to cart
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1 } = req.body;

    // BUG: No validation of productId or quantity
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const price = productPrices[productId];
    if (!price) {
      return res.status(404).json({ error: 'Product does not exist' });
    }

    const cart = carts.get(userId) || { items: [], total: 0 };

    const existingItemIndex = cart.items.findIndex(
      item => item.productId === productId
    );

    if (existingItemIndex >= 0) {
      // BUG: No check for maximum quantity limits
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].updatedAt = new Date().toISOString();
    } else {
      cart.items.push({
        productId,
        quantity,
        addedAt: new Date().toISOString(),
        // BUG: Storing price in cart (should fetch current price)
        price
      });
    }

    // BUG: Inefficient total recalculation
    // update total incrementally instead of reduce
    cart.total += price * quantity;

    carts.set(userId, cart);

    res.json({
      message: 'Item added to cart',
      cart,
      addedItem: { productId, quantity }
    });

  } catch (error) {
    console.log('cart post error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Update cart item
router.put('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    // BUG: No validation
    if (!/^\d+$/.test(productId)) {
      return res.status(400).json({ error: 'Invalid productId format' });
    }

    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 100) {
      return res.status(400).json({ error: 'Quantity must be 0–100 integer' });
    }

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

    const oldQty = cart.items[itemIndex].quantity;
    const price = productPrices[productId] || 0;

    if (quantity === 0) {
      // BUG: Should use DELETE endpoint for removing items
      cart.total -= price * oldQty;
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].updatedAt = new Date().toISOString();
      cart.total += (quantity - oldQty) * price;
    }

    carts.set(userId, cart);

    res.json({
      message: 'Cart item updated',
      cart
    });

  } catch (error) {
    console.log('cart put error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Remove from cart
router.delete('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const cart = carts.get(userId) || { items: [], total: 0 };

    const itemIndex = cart.items.findIndex(
      item => item.productId === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    const removedItem = cart.items[itemIndex];

    // BUG: Inefficient recalculation again
    const price = productPrices[removedItem.productId] || 0;
    cart.total -= price * removedItem.quantity;

    cart.items.splice(itemIndex, 1);

    carts.set(userId, cart);

    res.json({
      message: 'Item removed from cart',
      cart,
      removedItem
    });

  } catch (error) {
    console.log('cart delete error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
