const express = require('express');
const router = express.Router();
const ColorController = require('../controllers/ColorController');
const uploadColorImage = require('../middlewares/uploadColor');

router.get('/', ColorController.getAll);
router.get('/:id', ColorController.getById);
router.post('/', uploadColorImage.single('image'), ColorController.create);
router.put('/:id', uploadColorImage.single('image'), ColorController.update);
router.delete('/:id', ColorController.remove);

module.exports = router;


