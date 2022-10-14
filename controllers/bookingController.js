const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const factory = require('./factoryHandler');
const catchAsync = require('./../utils/catchAsync');
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // get currently booked session
  const tour = await Tour.findById(req.params.tourId);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          // The currency parameter determines which
          // payment methods are used in the Checkout Session.
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&price=${tour.price}&user=${req.user._id}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
  });
  // send session

  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { user, tour, price } = req.query;
  if (!user || !tour || !price) {
    return next();
  }
  await Booking.create({ user, tour, price });
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.getAllBooings = factory.getAll(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
exports.getBooking = factory.getOne(Booking);
