const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const pdfController = require('../controllers/pdfController');

router.post('/generate-pdf', upload.none(), pdfController.generatePdf);
router.post('/generate-carta-aceptacion', pdfController.generateCartaAceptacion);
router.post('/generate-reporte-mensual', pdfController.generateReporteMensual);
router.post('/generate-reporte-global', pdfController.generateReporteGlobal);

module.exports = router;
