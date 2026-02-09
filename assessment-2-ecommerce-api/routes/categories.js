const express = require('express');
const router = express.Router();

// using same in-memory products (like products.js style)
// in real app this would come from DB
const categoriesData = [
  { name: 'Electronics', description: 'Devices and gadgets' },
  { name: 'Clothing', description: 'Wearable items' },
  { name: 'Books', description: 'Study and reading books' },
  { name: 'Home', description: 'Home usage items' },
  { name: 'Sports', description: 'Sports materials' },
  { name: 'Beauty', description: 'Beauty and care products' }
];


// get all categories
router.get('/', (req, res) => {
  try {
    if (!categoriesData || categoriesData.length === 0) {
      return res.status(404).json({ error: 'No categories found' });
    }

    res.json({
      total: categoriesData.length,
      categories: categoriesData
    });

  } catch (err) {
    console.log('Error in categories list:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


// get one category by name
router.get('/:name', (req, res) => {
  try {
    const categoryName = req.params.name;

    if (!categoryName || categoryName.trim() === '') {
      return res.status(400).json({ error: 'Category name required' });
    }

    const found = categoriesData.find(c =>
      c.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (!found) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(found);

  } catch (err) {
    console.log('Error finding category:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


module.exports = router;
