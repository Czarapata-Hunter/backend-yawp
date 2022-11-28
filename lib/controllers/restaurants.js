const { Router } = require('express');
const { Restaurant } = require('../models/Restaurant');

module.exports = Router().get('/', async (req, res, next) => {
  try {
    const data = await Restaurant.getAll();
    res.json(data);
  } catch (e) {
    next(e);
  }
});
