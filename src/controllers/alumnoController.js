const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const xss = require('xss');

const db = new sqlite3.Database(path.join(__dirname, '../../database/servicio_social.db'));

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

exports.registrarAlumno = (req, res) => {
    const cleanBody = sanitizeBody(req.body);
    const { boleta, nombre, apellidoPaterno, apellidoMaterno, curp, semestre, NumR } = cleanBody;
    
    // ...existing registrar-alumno logic...
};
