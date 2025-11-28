const express = require('express');
const router = express.Router();
const ExternalDealerController = require('../controllers/ExternalDealerController');

// Başvuru listesi (status=pending / approved / rejected)
router.get('/', (req, res) => {
  res.render('dealers/applications', { title: 'Bayi Başvuruları' });
});

module.exports = router;


