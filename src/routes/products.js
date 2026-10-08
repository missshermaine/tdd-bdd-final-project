const express = require('express');
const { Product } = require('../models/product');
const { validateProduct, checkContentType } = require('../middleware/validation');

const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({ status: 200, message: 'OK' });
});

/**
 * CREATE A NEW PRODUCT
 */
router.post('/', checkContentType('application/json'), validateProduct, async (req, res) => {
  try {

    
    const product = await Product.create(req.body);

    
    const location = `/api/products/${product.id}`;
    res.status(201)
       .location(location)
       .json(product.serialize());
       
  } catch (error) {

    res.status(400).json({ 
      error: 'Bad Request', 
      message: error.message 
    });
  }
});

/**
 * LIST ALL PRODUCTS, optionally filtered by name, category, or availability
 */
router.get('/', async (req, res) => {
  try {
    const { name, category, availability } = req.query;
    let products;

    if (name) {
      products = await Product.findByName(name);
    } else if (category) {
      products = await Product.findByCategory(category);
    } else if (availability !== undefined) {
      const available = availability.toLowerCase() === 'true';
      products = await Product.findByAvailability(available);
    } else {
      products = await Product.findAll();
    }

    res.status(200).json(products.map(product => product.serialize()));
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', message: error.message });
  }
});

/**
 * READ A PRODUCT
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product with id ${req.params.id} was not found`
      });
    }

    return res.status(200).json(product.serialize());
  } catch (error) {
    return res.status(400).json({ error: 'Bad Request', message: error.message });
  }
});

/**
 * UPDATE A PRODUCT
 */
router.put('/:id', checkContentType('application/json'), validateProduct, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product with id ${req.params.id} was not found`
      });
    }

    await product.update(req.body);
    return res.status(200).json(product.serialize());
  } catch (error) {
    return res.status(400).json({ error: 'Bad Request', message: error.message });
  }
});

/**
 * DELETE A PRODUCT
 */
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (product) {
      await product.destroy();
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ error: 'Bad Request', message: error.message });
  }
});


module.exports = router;
