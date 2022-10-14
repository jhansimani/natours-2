const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json({
      status: 'sucess',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(
      { _id: req.params.id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!doc) {
      next(new AppError('No document found with that id', 404));
    }
    res.status(200).json({
      status: 'sucess',
      data: {
        data: doc,
      },
    });
  });
exports.createOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.create(req.body);
    return res.status(201).json({
      status: 'sucess',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) {
      query = query.populate(populateOptions);
    }
    const doc = await query;
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   if (!tour) {
//     next(new AppError('No tour found with that id', 404));
//   }
//   console.log(tour);
//   res.status(200).json({
//     status: 'sucess',
//     data: {
//       tour,
//     },
//   });
// });
exports.getAll = (Model) =>
  catchAsync(async (req, res) => {
    // to allow reviews

    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }
    // execute query

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // const docs = await features.query.explain(); // to know about indexing
    // send response
    const docs = await features.query;
    res.status(200).json({
      status: 'sucess',
      results: docs.length,
      data: {
        data: docs,
      },
    });
  });
