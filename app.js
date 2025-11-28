var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressLayouts = require('express-ejs-layouts');
const sequelize = require('./config/database');

var indexRouter = require('./routes/index');

var productsRouter = require('./routes/products');
var externalProductsRouter = require('./routes/externalProducts');
var externalOrdersRouter = require('./routes/externalOrders');
var externalDealersRouter = require('./routes/externalDealers');
var dealerApplicationsRouter = require('./routes/dealerApplications');
var categoriesRouter = require('./routes/categories');
var colorsRouter = require('./routes/colors');
var sizeGuidesRouter = require('./routes/sizeGuides');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Veritabanı bağlantısını test et ve tabloları senkronize et
sequelize.authenticate()
  .then(() => {
    console.log('Veritabanı bağlantısı başarılı.');
    return sequelize.sync({ alter: true }); // Tabloları güncelle
  })
  .then(() => {
    console.log('Tablolar senkronize edildi.');
  })
  .catch(err => {
    console.error('Veritabanı hatası:', err);
  });

app.use('/', indexRouter);
app.use('/api/products', productsRouter);
app.use('/api/v1/products', externalProductsRouter);
app.use('/api/v1/orders', externalOrdersRouter);
app.use('/api/v1/dealers', externalDealersRouter);
app.use('/dealer-applications', dealerApplicationsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/colors', colorsRouter);
app.use('/api/size-guides', sizeGuidesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;