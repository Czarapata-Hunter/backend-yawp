const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorizeDelete');
const { Review } = require('../models/Review');

module.exports = Router()
  .get('/:id', async (req, res, next) => {
    try {
      const getReview = await Review.getById(req.params.id);
      if (!getReview) {
        next();
      }
      res.json(getReview);
    } catch (e) {
      next(e);
    }
  })
  .delete('/:id', authenticate, authorize, async (req, res, next) => {
    try {
      const deleteRev = await Review.deleteById(req.params.id);
      res.json(deleteRev);
    } catch (e) {
      next(e);
    }
  });
