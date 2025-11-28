const express = require('express');
const ExternalDealerController = require('../controllers/ExternalDealerController');
const uploadDealerDocuments = require('../middlewares/uploadDealerDocuments');

const router = express.Router();

router.get('/', ExternalDealerController.list);
router.post('/', ExternalDealerController.create);
router.get('/:idOrCode', ExternalDealerController.show);
router.put('/:idOrCode', ExternalDealerController.update);
router.delete('/:idOrCode', ExternalDealerController.destroy);

// Belgeler için ayrı upload uçları (PDF)
router.post(
  '/:idOrCode/documents/tax-certificate',
  uploadDealerDocuments.single('file'),
  ExternalDealerController.uploadTaxCertificate
);

router.post(
  '/:idOrCode/documents/trade-registry',
  uploadDealerDocuments.single('file'),
  ExternalDealerController.uploadTradeRegistryGazette
);

router.post(
  '/:idOrCode/documents/signature-circular',
  uploadDealerDocuments.single('file'),
  ExternalDealerController.uploadSignatureCircular
);

module.exports = router;


