const express = require('express');
const ExternalOrderController = require('../controllers/ExternalOrderController');

const router = express.Router();

router.get('/', ExternalOrderController.list);
router.post('/', ExternalOrderController.create);
router.get('/:idOrCode', ExternalOrderController.show);
router.put('/:idOrCode', ExternalOrderController.update);
router.delete('/:idOrCode', ExternalOrderController.destroy);

module.exports = router;


