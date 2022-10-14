const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a user'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Booking must belong to a tour'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    price: {
      type: Number,
      required: [true, 'Booking must have price'],
    },
    paid: {
      type: Boolean,
      default: false,
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

bookingSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user' }).populate({
    path: 'tour',
    select: 'name price',
  });
  next();
});
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
