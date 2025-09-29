const { PDFDocument: PDFLib, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const xss = require('xss');
const PDFKit = require('pdfkit');
const sharp = require('sharp');
const axios = require('axios'); // Agregar axios para la solicitud a reCAPTCHA

const periodos = [
    { inicio: "16 de octubre de 2025", fin: "15 de noviembre de 2025" },
    { inicio: "16 de noviembre de 2025", fin: "15 de diciembre de 2025" },
    { inicio: "16 de diciembre de 2025", fin: "15 de enero de 2026" },
    { inicio: "16 de enero de 2026", fin: "15 de febrero de 2026" },
    { inicio: "16 de febrero de 2026", fin: "15 de marzo de 2026" },
    { inicio: "16 de marzo de 2026", fin: "15 de abril de 2026" },
    { inicio: "16 de abril de 2026", fin: "14 de mayo de 2026" }
];

function sanitizeBody(body) {
    const sanitized = {};
    for (const key in body) {
        if (typeof body[key] === 'string') {
            sanitized[key] = xss(body[key]);
        } else {
            sanitized[key] = body[key];
        }
    }
    return sanitized;
}

// Función auxiliar para optimizar imágenes
const optimizeImage = (imagePath) => {
    return new Promise((resolve, reject) => {
        sharp(imagePath)
            .resize(800) // Limitar el ancho máximo
            .jpeg({ quality: 60, progressive: true }) // Usar JPEG progresivo con calidad reducida
            .flatten({ background: { r: 255, g: 255, b: 255 } }) // Convertir a RGB
            .toBuffer()
            .then(resolve)
            .catch(reject);
    });
};

// Función para verificar reCAPTCHA
async function verifyRecaptcha(token) {
    const secret = process.env.RECAPTCHA_SECRET; // Debe estar en variables de entorno
    const url = `https://www.google.com/recaptcha/api/siteverify`;
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    try {
        const response = await axios.post(url, params);
        return response.data.success;
    } catch (err) {
        console.error('Error verificando reCAPTCHA:', err);
        return false;
    }
}

exports.generatePdf = async (req, res) => {
    try {
        // Verificar reCAPTCHA antes de continuar
        const recaptchaToken = req.body.recaptchaToken;
        if (!recaptchaToken || !(await verifyRecaptcha(recaptchaToken))) {
            return res.status(403).send('Verificación reCAPTCHA fallida');
        }
        // ...existing generatePdf logic from /generate-pdf route...
    } catch (error) {
        console.error('Error generando PDF:', error);
        res.status(500).send('Error generando PDF');
    }
};

exports.generateCartaAceptacion = async (req, res) => {
    try {
        // Verificar reCAPTCHA antes de continuar
        const recaptchaToken = req.body.recaptchaToken;
        if (!recaptchaToken || !(await verifyRecaptcha(recaptchaToken))) {
            return res.status(403).send('Verificación reCAPTCHA fallida');
        }
        // ...existing generateCartaAceptacion logic from /generate-carta-aceptacion route...
    } catch (error) {
        console.error('Error generando carta de aceptación:', error);
        res.status(500).send('Error generando carta de aceptación');
    }
};

exports.generateReporteMensual = async (req, res) => {
    try {
        // Verificar reCAPTCHA antes de continuar
        const recaptchaToken = req.body.recaptchaToken;
        if (!recaptchaToken || !(await verifyRecaptcha(recaptchaToken))) {
            return res.status(403).send('Verificación reCAPTCHA fallida');
        }
        const pdfOptions = {
            compress: true,
            info: {
                compress: true
            },
            autoFirstPage: true,
            size: 'A4',
            font: 'Helvetica', // Usar fuentes estándar
            layout: 'portrait',
            bufferPages: true
        }
        
        const doc = new PDFKit(pdfOptions);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // Configuración agresiva de compresión
        doc.image.quality = 0.6; // Reducir aún más la calidad
        doc.image.compressionLevel = 9;

        // Si hay imágenes, optimizarlas antes de agregarlas
        if (req.body.imagePath) {
            const optimizedImageBuffer = await optimizeImage(req.body.imagePath);
            doc.image(optimizedImageBuffer, {
                fit: [500, 500], // Limitar tamaño máximo
                align: 'center',
                valign: 'center'
            });
        }

        // Resto de la lógica pero usando tamaños de fuente más pequeños
        doc.fontSize(10); // Reducir tamaño de fuente predeterminado
        
        // ...resto del código existente...

        // Optimizar el documento final
        doc.compress(true);
        doc.end();
        
    } catch (error) {
        console.error('Error generando reporte mensual:', error);
        res.status(500).send('Error generando el PDF');
    }
};

exports.generateReporteGlobal = async (req, res) => {
    try {
        // Verificar reCAPTCHA antes de continuar
        const recaptchaToken = req.body.recaptchaToken;
        if (!recaptchaToken || !(await verifyRecaptcha(recaptchaToken))) {
            return res.status(403).send('Verificación reCAPTCHA fallida');
        }
        // ...existing generateReporteGlobal logic from /generate-reporte-global route...
    } catch (error) {
        console.error('Error generando reporte global:', error);
        res.status(500).send('Error generando reporte global');
    }
};
