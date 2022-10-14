const multer = require('multer');
const sharp = require('sharp'); // image processing library
const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const factory = require('./factoryHandler');

// directly storing into the disk
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const extension = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user._id}-${Date.now()}.${extension}`);
//   },
// });

// if we want to resize the photo , then wee need to store in memory

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image ! please upload a image', 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg', { quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});
const filterObj = (obj, ...allowedFileds) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFileds.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};
exports.createUser = factory.createOne(User);
exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'this route is not updating user details . Please use updatePassword route ',
        400
      )
    );
  }
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

  const user = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, {
    active: false,
  });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
