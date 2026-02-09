// SECRET ENDPOINT - Discovered through Base64 decoding the header hint
// Header hint: "cHJvZHVjdF9zZWNyZXRfZW5kcG9pbnQ=" decodes to "product_secret_endpoint"

const express = require('express');
const crypto = require('crypto');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Mock admin products with higher profit margins
const secretProducts = [
  {
    id: 'secret-1',
    name: 'Premium Exclusive Item',
    actualCost: 50,
    sellingPrice: 200,
    profitMargin: '75%',
    secretCategory: 'high-margin'
  },
  {
    id: 'secret-2', 
    name: 'Limited Edition Product',
    actualCost: 80,
    sellingPrice: 300,
    profitMargin: '73%',
    secretCategory: 'limited'
  }
];

// ROT13 encoded final puzzle message
const FINAL_PUZZLE = 'Pbatenghyngvbaf! Lbh sbhaq gur frperg cebqhpg qngn. Svany pyhrf: PURPX_NQZVA_CNARY_2024';

// Secret product data endpoint
router.get('/',requireAuth,requireAdmin, async (req, res) => {
  try {


    // Generate a hash based on current time for additional puzzle
    const timeHash = crypto.createHash('md5').update(new Date().toISOString().slice(0, 10)).digest('hex').slice(0, 8);

    res.set({
      'X-Access-Method': 'jwt-admin',
      'X-Profit-Hash': timeHash,
      'X-Decode-Message': 'Use ROT13 to decode the final puzzle',
      'Cache-Control': 'no-cache'
    });

    res.json({
      message: 'Secret product profit data accessed',
      accessMethod: 'jwt-admin',
      secretProducts,
      totalProfit: secretProducts.reduce((sum, p) => sum + (p.sellingPrice - p.actualCost), 0),
      analytics: {
        averageProfitMargin: '74%',
        topPerformingCategory: 'high-margin',
        accessTimestamp: new Date().toISOString()
      },
      finalPuzzle: FINAL_PUZZLE,
      puzzleHint: 'Decode this message using ROT13 cipher'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
