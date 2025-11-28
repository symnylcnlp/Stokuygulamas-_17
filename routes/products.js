const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');

// Tüm ürünleri getir
router.get('/', ProductController.getAllProducts);

// Yeni ürün ekle
router.post('/', ProductController.createProduct);

// Öne çıkan ürünleri getir
router.get('/featured', ProductController.getFeaturedProducts);

// Düşük stoklu ürünleri getir
router.get('/low-stock', ProductController.getLowStockProducts);

// Kategoriye göre ürünleri getir
router.get('/category/:kategori', ProductController.getProductsByCategory);

// ID'ye göre ürün getir
router.get('/:id', ProductController.getProductById);

// ID'ye göre ürün güncelle
router.put('/:id', ProductController.updateProduct);

// ID'ye göre ürün sil
router.delete('/:id', ProductController.deleteProduct);

module.exports = router;