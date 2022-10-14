const catchAsync = require('./../utils/catchAsync');
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const Booking = require('../models/bookingModel');
exports.getOverview = catchAsync(async (req, res) => {
  // 1) get tours data from collection.

  const tours = await Tour.find();
  // 2) build a template

  // 3) render template
  res.status(200).render('overview', {
    title: 'All Tours',
    tours: tours,
  });
});
exports.getTour = catchAsync(async (req, res, next) => {
  // 1) get tour data and populate both users and reviews
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'review rating user',
  });
  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }
  // 2) render page
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour: tour,
  });
});

exports.login = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Login into your account',
  });
});

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account page',
  });
};

exports.updateUserData = catchAsync(async (req, res) => {
  console.log(req.body);
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  console.log(updatedUser);
  res.status(200).render('account', {
    title: 'Your account page',
    user: updatedUser,
  });
});

exports.getMyTours = catchAsync(async (req, res) => {
  console.log(req.user);
  const bookings = await Booking.find({ user: req.user._id });
  const tourIds = bookings.map((booking) => booking.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });
  res.status(200).render('overview', {
    title: 'My tours',
    tours: tours,
  });
});
