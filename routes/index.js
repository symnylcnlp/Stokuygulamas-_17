var express = require('express');
var router = express.Router();

/* GET dashboard page */
router.get('/', function(req, res, next) {
  res.redirect('/dashboard');
});

router.get('/dashboard', function(req, res, next) {
  res.render('dashboard', { title: 'Dashboard' });
});

/* GET products page */
router.get('/products', function(req, res, next) {
  res.render('products/index', { title: 'Ürün Yönetimi' });
});

router.get('/dealers', function(req, res, next) {
  res.render('dealers/index', { title: 'Bayi Yönetimi' });
});

router.get('/orders', function(req, res, next) {
  res.render('orders/index', { title: 'Sipariş Yönetimi' });
});

router.get('/categories', function(req, res, next) {
  res.render('categories/index', { title: 'Kategori Yönetimi' });
});

router.get('/size-guides', function(req, res, next) {
  res.render('size-guides/index', { title: 'Beden Tabloları' });
});

router.get('/colors', function(req, res, next) {
  res.render('colors/index', { title: 'Renk Yönetimi' });
});

module.exports = router;