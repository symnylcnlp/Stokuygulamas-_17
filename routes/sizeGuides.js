const express = require('express');
const router = express.Router();
const SizeGuideController = require('../controllers/SizeGuideController');

router.get('/', SizeGuideController.getAll);
router.get('/:id', SizeGuideController.getById);
router.post('/', SizeGuideController.create);
router.put('/:id', SizeGuideController.update);
router.delete('/:id', SizeGuideController.remove);

module.exports = router;

