const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const xss = require('xss');

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

exports.generatePdf = async (req, res) => {
    try {
        // ...existing generatePdf logic from /generate-pdf route...
    } catch (error) {
        console.error('Error generando PDF:', error);
        res.status(500).send('Error generando PDF');
    }
};

exports.generateCartaAceptacion = async (req, res) => {
    try {
        // ...existing generateCartaAceptacion logic from /generate-carta-aceptacion route...
    } catch (error) {
        console.error('Error generando carta de aceptación:', error);
        res.status(500).send('Error generando carta de aceptación');
    }
};

exports.generateReporteMensual = async (req, res) => {
    try {
        // ...existing generateReporteMensual logic from /generate-reporte-mensual route...
    } catch (error) {
        console.error('Error generando reporte mensual:', error);
        res.status(500).send('Error generando reporte mensual');
    }
};

exports.generateReporteGlobal = async (req, res) => {
    try {
        // ...existing generateReporteGlobal logic from /generate-reporte-global route...
    } catch (error) {
        console.error('Error generando reporte global:', error);
        res.status(500).send('Error generando reporte global');
    }
};
