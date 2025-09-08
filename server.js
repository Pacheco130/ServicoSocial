const express = require('express');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const upload = multer();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conexión a la base de datos SQLite en modo serializado
const db = new sqlite3.Database('./servicio_social.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Error abriendo la base de datos:', err.message);
    }
});
db.serialize(); // Fuerza consultas en serie

// Crear tabla de alumnos si no existe (actualizada)
db.run(`CREATE TABLE IF NOT EXISTS alumnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    boleta TEXT,
    nombre TEXT,
    apellidoPaterno TEXT,
    apellidoMaterno TEXT,
    curp TEXT,
    semestre INTEGER,
    NumR INTEGER
)`);

// Mueve la ruta raíz antes del middleware estático para que se sirva menu.html al entrar a localhost
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'menu.html'));
});
 
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'img'))); // Agrega esta línea para servir las imágenes desde la carpeta "img"
// Agrega una ruta estática para servir archivos desde la raíz (con precaución)
app.use(express.static(__dirname));

const periodos = [
    { inicio: "16 de octubre de 2025", fin: "15 de noviembre de 2025" },
    { inicio: "16 de noviembre de 2025", fin: "15 de diciembre de 2025" },
    { inicio: "16 de diciembre de 2025", fin: "15 de enero de 2026" },
    { inicio: "16 de enero de 2026", fin: "15 de febrero de 2026" },
    { inicio: "16 de febrero de 2026", fin: "15 de marzo de 2026" },
    { inicio: "16 de marzo de 2026", fin: "15 de abril de 2026" },
    { inicio: "16 de abril de 2026", fin: "14 de mayo de 2026" }
];

app.post('/generate-pdf', async (req, res) => {
    try {
        const { 
            reporteNo, 
            registro, 
            boleta, 
            unidadAcademica, 
            carrera,
            nombre,                // Nombre del Prestador
            responsableNombre,     // Nombre del Responsable
            responsableCargo       // Cargo del Responsable
        } = req.body;
        // Asigna las fechas según el número de reporte
        const periodo = periodos[parseInt(reporteNo) - 1];
        const templatePath = path.join(__dirname, 'control-asis.pdf');
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);
        const firstPage = pdfDoc.getPages()[0];
        const { width, height } = firstPage.getSize();
        const fontSize = 10;
        const font = await pdfDoc.embedFont('Helvetica');
        const textWidth = font.widthOfTextAtSize(reporteNo, fontSize);
        const centerX = (width - textWidth) / 2;
        const newX = centerX - 10;
        firstPage.drawText(`${reporteNo}`, { x: newX, y: height - 100, size: fontSize, font: font });
        firstPage.drawText(`${periodo.inicio}`, { x: 88, y: height - 117, size: 10 });
        firstPage.drawText(`${periodo.fin}`, { x: 230, y: height - 117, size: 10 });
        firstPage.drawText(`${registro}`, { x: 500, y: height - 117, size: 10 });
        firstPage.drawText(`${nombre}`, { x: 135, y: height - 134, size: 10 });
        firstPage.drawText(`${boleta}`, { x: 466, y: height - 134, size: 10 });
        firstPage.drawText(`${unidadAcademica}`, { x: 122, y: height - 151, size: 10 });
        firstPage.drawText(`${carrera}`, { x: 344, y: height - 151, size: 10 });
        firstPage.drawText(`${responsableNombre}`, { x: 85, y: height - 730, size: 10, font: font, color: rgb(0,0,0) });
        firstPage.drawText(`${responsableCargo}`, { x: 100, y: height - 740, size: 10, font: font, color: rgb(0,0,0) });

        // Bloquear la edición aplanando el formulario (fusiona los campos interactivos si existen)
        try {
            const form = pdfDoc.getForm();
            form.flatten();
        } catch (error) {
            console.warn('No se pudieron aplanar los campos de formulario:', error);
        }
        
        const pdfBytes = await pdfDoc.save();
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="reporte.pdf"'
        });
        res.send(pdfBytes);
    } catch (error) {
        console.error('Error generando PDF:', error);
        res.status(500).send('Error generando PDF');
    }
});

app.post('/generate-carta-aceptacion', async (req, res) => {
    try {
        const { nombre, boleta, carrera, grupo, supervisor } = req.body;
        const templatePath = path.join(__dirname, 'carta-aceptacion.pdf');
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);
        const firstPage = pdfDoc.getPages()[0];
        const { height } = firstPage.getSize();

        // Imprime dos veces nombre y supervisor en posiciones diferentes
        firstPage.drawText(`${nombre}`, { x: 188, y: height - 204, size: 12 });
        firstPage.drawText(`${boleta}`, { x: 178, y: height - 225, size: 12 });
        firstPage.drawText(`${carrera}`, { x: 188, y: height - 245, size: 12 });
        firstPage.drawText(`${grupo}`, { x: 178, y: height - 267, size: 12 });
        firstPage.drawText(`${supervisor}`, { x: 90, y: height - 394, size: 12 });
        firstPage.drawText(`${nombre}`, { x: 80, y: height - 750, size: 12 });      // segunda vez nombre
        firstPage.drawText(`${supervisor}`, { x: 370, y: height - 750, size: 12 }); // segunda vez supervisor

        // Bloquear la edición aplanando el formulario (fusiona los campos interactivos si existen)
        try {
            const form = pdfDoc.getForm();
            form.flatten();
        } catch (error) {
            // Si no hay formulario, simplemente ignora el error
        }

        const pdfBytes = await pdfDoc.save();
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="carta-aceptacion.pdf"'
        });
        res.send(pdfBytes);
    } catch (error) {
        console.error('Error generando carta de aceptación:', error);
        res.status(500).send('Error generando carta de aceptación');
    }
});

app.post('/generate-reporte-mensual', async (req, res) => {
    // Leer la plantilla PDF desde la raíz del proyecto
    const pdfPath = path.join(__dirname, 'reporte-mensual.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Registrar fontkit para fuentes personalizadas
    const fontkit = require('fontkit');
    pdfDoc.registerFontkit(fontkit);

    // Montserrat Variable para textos normales
    const montserratFontBytes = fs.readFileSync(path.join(__dirname, 'Montserrat-VariableFont_wght.ttf'));
    const montserratFont = await pdfDoc.embedFont(montserratFontBytes);

    // Montserrat Bold para textos en negritas
    const montserratBoldBytes = fs.readFileSync(path.join(__dirname, 'Montserrat-Bold.ttf'));
    const montserratBold = await pdfDoc.embedFont(montserratBoldBytes);

    // Montserrat Light para la fecha
    const montserratLightBytes = fs.readFileSync(path.join(__dirname, 'Montserrat-Light.otf'));
    const montserratLight = await pdfDoc.embedFont(montserratLightBytes);

    // Montserrat Regular para la fecha
    const montserratRegularBytes = fs.readFileSync(path.join(__dirname, 'Montserrat-Regular.ttf'));
    const montserratRegular = await pdfDoc.embedFont(montserratRegularBytes);

    // Times New Roman para el nombre y periodo
    const timesFontBytes = fs.readFileSync(path.join(__dirname, 'Times-New-Roman.ttf'));
    const timesFont = await pdfDoc.embedFont(timesFontBytes);

    // Función para convertir fecha a formato completo en español
    function fechaCompleta(fechaISO) {
        const meses = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        const [anio, mes, dia] = fechaISO.split('-');
        if (!anio || !mes || !dia) return fechaISO;
        return `${parseInt(dia)} de ${meses[parseInt(mes)-1]} de ${anio}`;
    }

    const page = pdfDoc.getPages()[0];
    const nreporte = parseInt(req.body.nreporte);
    const periodo = periodos[nreporte - 1];
    // N. Reporte con Montserrat Bold, tamaño 14
    page.drawText(`${req.body.nreporte}`, {
        x: 385,
        y: 670,
        size: 14,
        font: montserratBold,
        color: rgb(0, 0, 0)
    });
    // Fecha en formato completo, Montserrat Light, tamaño 11
    page.drawText(`${fechaCompleta(req.body.fecha)}`, {
        x: 346,
        y: 696,
        size: 11,
        font: montserratLight,
        color: rgb(0, 0, 0)
    });
    // Periodo con fechas fijas según el número de reporte
    page.drawText(`Periodo de: ${periodo.inicio} Al: ${periodo.fin}`, {
        x: 210,
        y: 639,
        size: 12,
        font: timesFont,
        color: rgb(0, 0, 0)
    });
    page.drawText(`${req.body.nombreA}`, {
        x: 100,
        y: 591.5,
        size: 10,
        font: timesFont,
        color: rgb(0, 0, 0)
    });
    page.drawText(`${req.body.boleta}`, { 
        x: 92, 
        y: 573, 
        size: 10, 
        font: timesFont, 
        color: rgb(0, 0, 0)
    });
    page.drawText(`${req.body.semestre}`, { 
        x: 103, 
        y: 554,
        size: 10, 
        font: timesFont, 
        color: rgb(0, 0, 0) 
    });
    page.drawText(`${req.body.telefono}`, { 
        x: 143, 
        y: 535.5,
        size: 10, 
        font: timesFont, 
        color: rgb(0, 0, 0)
    });

    page.drawText(`${req.body.prestatario}`, { 
        x: 110, 
        y: 517.2,
        size: 10,
        font: timesFont,
        color: rgb(0, 0, 0)
    });

    page.drawText(`${req.body.carrera}`, { 
        x: 365, 
        y: 573, 
        size: 10, 
        font: timesFont, 
        color: rgb(0, 0, 0)
    });
    // N. Registro en Montserrat Bold, tamaño 11
    page.drawText(`${req.body.nregistro}`, {
        x: 343,
        y: 554,
        size: 10,
        font: timesFont,
        color: rgb(0, 0, 0)
    });
    page.drawText(`${req.body.correo}`, { 
        x: 355.8,
        y: 535,
        size: 10,
        font: timesFont,
        color: rgb(0, 0, 0)
        });
    // Imprimir las 7 actividades en el PDF
    function splitText(text, maxLength) {
        const result = [];
        let current = text;
        while (current.length > maxLength) {
            result.push(current.slice(0, maxLength));
            current = current.slice(maxLength);
        }
        if (current.length > 0) result.push(current);
        return result;
    }
    const actividadesY = [468, 455, 442, 429, 416, 403, 390]; // Y para cada actividad
    let yBase = 468;
    for (let i = 1; i <= 7; i++) {
        const actividad = req.body[`actividad${i}`] || '';
        const lineas = splitText(actividad, 92);
        let y = yBase;
        for (const linea of lineas) {
            page.drawText(linea, {
                x: 54,
                y: y,
                size: 11,
                font: timesFont,
                color: rgb(0, 0, 0)
            });
            y -= 12; // Salto de línea para la siguiente línea de texto
        }
        yBase = y - 8; // Espacio extra entre actividades
    }
     // Encargado Directo y Cargo en Montserrat Light, tamaño 10
    page.drawText(`${req.body.encargadoDirecto}`, {
        x: 400,
        y: 190,
        size: 10,
        font: montserratLight,
        color: rgb(0, 0, 0)
    });
    page.drawText(`${req.body.cargo}`, { 
        x: 430, 
        y: 180,
        size: 10,
        font: montserratLight,
        color: rgb(0, 0, 0)
     });

      page.drawText(`${req.body.nombreA}`, {
        x: 90,
        y: 190,
        size: 10,
        font: montserratLight,
        color: rgb(0, 0, 0)
    });

    // Bloquear la edición aplanando el formulario (quitar interactividad)
    try {
        const form = pdfDoc.getForm();
        form.flatten();
    } catch (error) {
        // Si no hay formulario, ignora el error
    }

    const pdfOutput = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-mensual.pdf');
    res.send(pdfOutput);
});

app.post('/registrar-alumno', upload.none(), (req, res) => {
    console.log('Datos recibidos:', req.body); // Depuración
    const { boleta, nombre, apellidoPaterno, apellidoMaterno, curp, semestre, NumR } = req.body;
    // Validación básica
    if (!boleta || !nombre || !apellidoPaterno || !apellidoMaterno || !curp || !semestre || !NumR) {
        return res.status(400).send('Todos los campos son obligatorios');
    }
    const semestreNum = parseInt(semestre);
    const numRNum = parseInt(NumR);
    if (isNaN(semestreNum) || isNaN(numRNum)) {
        return res.status(400).send('Semestre y Número de registro deben ser numéricos');
    }
    db.get(
        `SELECT * FROM alumnos WHERE Boleta = ? AND Nombre = ? AND apellidoPaterno = ? AND apellidoMaterno = ? AND curp = ? AND Semestre = ? AND NumR = ?`,
        [boleta, nombre, apellidoPaterno, apellidoMaterno, curp, semestreNum, numRNum],
        (err, row) => {
            if (err) {
                return res.status(500).send('Error al consultar alumno');
            }
            if (row) {
                return res.send('Este alumno ya está registrado');
            }
            db.run(
                `INSERT INTO alumnos (Boleta, Nombre, apellidoPaterno, apellidoMaterno, curp, Semestre, NumR) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [boleta, nombre, apellidoPaterno, apellidoMaterno, curp, semestreNum, numRNum],
                function (err) {
                    if (err) {
                        console.error('Error SQLite:', err.message);
                        return res.status(500).send('Error al registrar alumno: ' + err.message);
                    }
                    res.send('Alumno registrado correctamente');
                }
            );
        }
    );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});