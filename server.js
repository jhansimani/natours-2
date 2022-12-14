const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log('Unhandled Rejection occured: Shutting down');
  console.log(err.name, err.message);

  process.exit(1);
});
dotenv.config({
  path: './config.env',
});
const app = require('./app');
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Database connection succeeded');
  });
const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.log('Listening on port :4000');
});

// handle unhandled exceptions

process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection occured: Shutting down');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM recived,shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
