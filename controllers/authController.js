const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  if (req.secure || req.headers('x-forwared-proro') === 'https')
    cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};
exports.signUp = catchAsync(async (req, res) => {
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  // creating token
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if the email and password exists

  // 400 bad request
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) check if user exits and password is correct
  const user = await User.findOne({ email: email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send jwt to the client
  createSendToken(user, 200, res);
});
exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000),
  });
  res.status(200).json({ status: 'success' });
});

// middleware for verifying jwt token when routes are protected
exports.protect = catchAsync(async (req, res, next) => {
  // we need to do all this stuff in postman
  // to send a json web token as a header , there is a standard for doing that
  // we should always use header called Authorization the value is starts with Bearer and token which we recieved
  // 1) check if the jwt and it exists
  let token = '';
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in , Please login to get access', 401)
    );
  }
  // 2) check if the jwt is valid
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3) check if user still exists ( using deleted user token)
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user  belong to this token does no longer exists', 401)
    );
  }

  // 4)check is user changed password after jwt was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User recently changed password , please login again to get new token to get access',
        401
      )
    );
  }

  // grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});
// only for rendered pages , no for errors

exports.isLoggedIn = async (req, res, next) => {
  // 1 getting token and check it is there or exists
  let token = '';
  if (req.cookies.jwt) {
    try {
      token = req.cookies.jwt;

      // 2) verification

      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // 3) check if user still exists

      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // 4) Check if user changed password after jwt is issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // there is a logged in user
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
// middlewares don't accept arguments to this restrictTo method return a middleware
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles are admin or lead guide
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to perform this action", 401)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user from POSTed request
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }
  // 2) generate the random reset token // moved to schema method because it has more code write
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send email with reset token

  // const message = `Forgot your password? Submit a patch request with new password and  passwordconfirm to the ${resetLink}.
  //     If you didnot forgot you password please ignore this email`;
  try {
    const resetLink = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetLink).sendPasswordReset();
    // await sendMail({
    //   email: user.email,
    //   subject: 'your resetToken is valid for 10 minutes',
    //   message,
    // });
    // 3) send it back to user email
    res.status(200).json({
      status: 'success',
      message: 'Token sent successfully',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    next(new AppError(err, 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the token

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  });
  // console.log(user);
  // 2) If token has not expired , and there is a user, set the new password

  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3 Update changedPasswordAt property

  // 4) Log the user
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection

  const user = await User.findById(req.user._id).select('+password');

  // 2) check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Current password is incorrect', 401));
  }
  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4) Log user in , send jwt
  createSendToken(user, 200, res);
});
