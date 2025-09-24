const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const alumnoController = require('../controllers/alumnoController');

router.post('/registrar-alumno', upload.none(), alumnoController.registrarAlumno);

module.exports = router;
