const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();
router.use(authController.protect);
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

authController.restrictTo('admin', 'lead-guide'),
  router
    .route('/')
    .post(bookingController.createBooking)
    .get(bookingController.getAllBooings);

router
  .route('/:id')
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking)
  .get(bookingController.getBooking);
module.exports = router;
