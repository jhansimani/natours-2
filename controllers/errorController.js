const AppError = require('./../utils/appError');

const sendErrorDev = (err, req, res) => {
  // api
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  } else {
    // rendered website
    return res.status(err.statusCode).render('error', {
      title: 'Some went wrong',
      msg: err.message,
    });
  }
};
const handleTokenExpiredError = (err) => {
  return new AppError('Your token has expired , Please login again', 401);
};
const handleJSONWebTokenError = (err) => {
  return new AppError('Invalid token, please login again !!', 401);
};
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateErrorDB = (err) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value:${value} `;
  return new AppError(message, 400);
};
const handleInValidInputDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid Input. ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const sendErrorProd = (err, req, res) => {
  // api
  if (req.originalUrl.startsWith('/api')) {
    // operational error, trusted error, send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      // non operational error , don't leak information
    }
    console.log('Error 💥💥💥', err);
    return res.status(500).render({
      status: 'error',
      message: 'Something went wrong',
    });
  }
  console.log('Error 💥💥💥', err);
  // rendered website error
  if (err.isOperational) {
    res.status(err.statusCode).render('error', {
      title: 'something went wrong',
      msg: err.message,
    });

    // non operational error , don't leak information
  } else {
    res.status(500).render('error', {
      title: 'something went wrong',
      msg: 'please try again',
    });
  }
};

module.exports = (err, req, res, next) => {
  // err.stack tells where this error occurred
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV.trim() === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV.trim() === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (err.name == 'CastError') {
      error = handleCastErrorDB(error);
    } else if (err.code === 11000) {
      error = handleDuplicateErrorDB(error);
    } else if (err.name === 'ValidationError') {
      error = handleInValidInputDB(error);
      // when token payload is changed
    } else if (err.name === 'JsonWebTokenError') {
      error = handleJSONWebTokenError(error);
    } else if (err.name === 'TokenExpiredError') {
      error = handleTokenExpiredError(error);
    }
    sendErrorProd(error, req, res);
  }
};
