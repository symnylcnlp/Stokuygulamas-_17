const express = require('express');
const ExternalProductController = require('../controllers/ExternalProductController');

const router = express.Router();

router.get('/', ExternalProductController.list);
router.post('/', ExternalProductController.create);
router.get('/:idOrCode', ExternalProductController.show);
router.put('/:idOrCode', ExternalProductController.update);
router.delete('/:idOrCode', ExternalProductController.destroy);

module.exports = router;


