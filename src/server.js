const express = require('express');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const upload = multer();
const cors = require('cors');
const csurf = require('csurf'); // CSRF protection
const xss = require('xss');     // XSS sanitization
const cookieParser = require('cookie-parser'); 

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); 


// Reemplazar la configuración de la base de datos
const isProduction = process.env.NODE_ENV === 'production';
const defaultDbPath = path.join(__dirname, '../database/servicio_social.db');
const dbPath = process.env.DATABASE_PATH || defaultDbPath;

let db;
try {
    if (dbPath !== ':memory:' && !fs.existsSync(path.dirname(dbPath))) {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }

    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
            console.error('Error al abrir la base de datos:', err.message);
            process.exit(1);
        }
        console.log(`Base de datos conectada en: ${dbPath === ':memory:' ? 'memoria' : dbPath}`);
        
        // Crear tabla si no existe
        db.run(`CREATE TABLE IF NOT EXISTS alumnos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boleta TEXT,
            nombre TEXT,
            apellidoPaterno TEXT,
            apellidoMaterno TEXT,
            curp TEXT,
            semestre INTEGER,
            NumR INTEGER
        )`, (err) => {
            if (err) {
                console.error('Error creando tabla:', err.message);
            }
        });
    });
} catch (error) {
    console.error('Error crítico con la base de datos:', error);
    process.exit(1);
}


// Manejar el cierre de la base de datos cuando se cierra la aplicación
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error al cerrar la base de datos:', err.message);
        } else {
            console.log('Conexión a la base de datos cerrada');
        }
        process.exit(0);
    });
});


app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/favicon.ico'));
});

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rutas estáticas (solo una vez cada una)
app.use(express.static(path.join(__dirname, '../public')));
app.use('/html', express.static(path.join(__dirname, '../public/html')));
app.use('/img', express.static(path.join(__dirname, '../public/img')));
app.use('/docs', express.static(path.join(__dirname, '../docs')));
app.use('/fonts', express.static(path.join(__dirname, '../fonts')));
app.use('/react', express.static(path.join(__dirname, '../public/react')));

// Ruta explícita para menu.html (opcional, pero útil si el catch-all de React está activo)
app.get('/html/menu.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/menu.html'));
});

// Agregar manejo de errores para archivos
app.use((err, req, res, next) => {
    if (err.code === 'ENOENT') {
        console.error('Error de archivo no encontrado:', err.path);
        return res.status(404).send('Archivo no encontrado');
    }
    next(err);
});

// Agregar encabezados de seguridad
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:;"
    );
    next();
});

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


// Función auxiliar para verificar la existencia de archivos
function checkFile(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (err) {
        console.error('Error verificando archivo:', err);
        return false;
    }
}

// Función para eliminar formularios y widgets residuales de un PDF
async function stripPdfForms(pdfDoc) {
    try {
        const form = pdfDoc.getForm();
        if (form && typeof form.flatten === 'function') {
            form.flatten();
        }
    } catch (_) {}
    try {
        const cleanDoc = await PDFDocument.create();
        const indices = Array.from({ length: pdfDoc.getPageCount() }, (_, idx) => idx);
        const copiedPages = await cleanDoc.copyPages(pdfDoc, indices);
        copiedPages.forEach(page => cleanDoc.addPage(page));
        return cleanDoc;
    } catch (error) {
        console.warn('No se pudieron clonar las páginas sin formulario:', error);
        return pdfDoc;
    }
}

// Helper para centrar texto horizontalmente
function drawCenteredText(page, text, font, size, centerX, y, options = {}) {
    const width = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: centerX - width / 2, y, size, font, ...options });
}
function drawCenteredAtAnchor(page, text, font, size, anchorX, y, options = {}) {
    const width = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: anchorX - width / 2, y, size, font, ...options });
}

// Modificar la función de generación de PDF para incluir verificación
app.post('/generate-pdf', upload.none(), async (req, res) => {
    try {
        const cleanBody = sanitizeBody(req.body);
        const { 
            reporteNo, 
            registro, 
            boleta, 
            unidadAcademica, 
            carrera,
            nombre,                
            responsableNombre,     
            responsableCargo,
            periodoInicio,
            periodoFin
        } = cleanBody;

        let numReporte = parseInt(reporteNo);
        console.log('Número de reporte recibido:', reporteNo, 'Interpretado como:', numReporte);
        if (isNaN(numReporte) || numReporte < 1 || numReporte > 7) {
            return res.status(400).send('Número de reporte inválido');
        }
        if (!periodoInicio || !periodoFin) {
            return res.status(400).send('Las fechas de inicio y fin son obligatorias');
        }
        const inicioDate = new Date(periodoInicio);
        const finDate = new Date(periodoFin);
        if (isNaN(inicioDate) || isNaN(finDate) || finDate < inicioDate) {
            return res.status(400).send('Rango de fechas inválido');
        }
        const mesesLargos = [
            'enero','febrero','marzo','abril','mayo','junio',
            'julio','agosto','septiembre','octubre','noviembre','diciembre'
        ];
        const formatDate = (dateStr) => {
            const d = new Date(dateStr);
            if (isNaN(d)) return dateStr;
            const dia = String(d.getUTCDate()).padStart(2, '0');
            const mes = mesesLargos[d.getUTCMonth()];
            const anio = d.getUTCFullYear();
            return `${dia} de ${mes} de ${anio}`;
        };
        const periodoInicioFmt = formatDate(periodoInicio);
        const periodoFinFmt = formatDate(periodoFin);
        const templatePath = path.join(__dirname, '../docs/control-asis.pdf');
        if (!checkFile(templatePath)) {
            throw new Error('Plantilla PDF no encontrada');
        }
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);
        const firstPage = pdfDoc.getPages()[0];
        const { width, height } = firstPage.getSize();
        const fontSize = 10;
        const font = await pdfDoc.embedFont('Helvetica');
        const textWidth = font.widthOfTextAtSize(reporteNo, fontSize);
        const centerX = (width - textWidth) / 2;
        const newX = centerX - 10;
        firstPage.drawText(`${reporteNo}`, { x: 267, y: height - 100, size: fontSize, font: font });
        firstPage.drawText(`${periodoInicioFmt}`, { x: 107, y: height - 117, size: 10 });
        firstPage.drawText(`${periodoFinFmt}`, { x: 247, y: height - 117, size: 10 });
        firstPage.drawText(`${registro}`, { x: 500, y: height - 115, size: 10 });
        firstPage.drawText(`${nombre}`, { x: 135, y: height - 134, size: 10 });
        firstPage.drawText(`${boleta}`, { x: 466, y: height - 134, size: 10 });
        firstPage.drawText(`${unidadAcademica}`, { x: 122, y: height - 151, size: 10 });
        firstPage.drawText(`${carrera}`, { x: 405, y: height - 151, size: 10 });
        const signatureAnchorX = 220;
        drawCenteredAtAnchor(firstPage, `${responsableNombre}`, font, 10, signatureAnchorX, height - 725, { color: rgb(0,0,0) });
        drawCenteredAtAnchor(firstPage, `${responsableCargo}`, font, 10, signatureAnchorX, height - 740, { color: rgb(0,0,0) });
        // Se eliminó la generación automática de fechas consecutivas y del total de horas; la tabla queda para captura manual.
        const finalDoc = await stripPdfForms(pdfDoc);
        const pdfBytes = await finalDoc.save();
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="reporte.pdf"'
        });
        res.send(pdfBytes);
    } catch (error) {
        console.error('Error generando PDF:', error);
        res.status(500).send('Error generando PDF: ' + error.message);
    }
});

app.post('/generate-carta-aceptacion', async (req, res) => {
    try {
        const cleanBody = sanitizeBody(req.body);
        const { nombre, boleta, carrera, grupo, supervisor } = cleanBody;
        const templatePath = path.join(__dirname, '../docs/carta-aceptacion.pdf');
        if (!checkFile(templatePath)) {
            throw new Error('Plantilla de carta de aceptación no encontrada');
        }
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);
        const firstPage = pdfDoc.getPages()[0];
        const { height } = firstPage.getSize();

        
        firstPage.drawText(`${nombre}`, { x: 188, y: height - 204, size: 12 });
        firstPage.drawText(`${boleta}`, { x: 178, y: height - 225, size: 12 });
        firstPage.drawText(`${carrera}`, { x: 188, y: height - 245, size: 12 });
        firstPage.drawText(`${grupo}`, { x: 178, y: height - 267, size: 12 });
        firstPage.drawText(`${supervisor}`, { x: 90, y: height - 394, size: 12 });
        firstPage.drawText(`${nombre}`, { x: 80, y: height - 750, size: 12 });      // segunda vez nombre
        firstPage.drawText(`${supervisor}`, { x: 370, y: height - 750, size: 12 }); // segunda vez supervisor
        const finalDoc = await stripPdfForms(pdfDoc);
        const pdfBytes = await finalDoc.save();
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
    
    const cleanBody = sanitizeBody(req.body);
    
   
    const pdfPath = path.join(__dirname, '../docs/reporte-mensual1.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    
    const fontkit = require('fontkit');
    pdfDoc.registerFontkit(fontkit);

   
    const montserratFontBytes = fs.readFileSync(path.join(__dirname, '../fonts/Montserrat-VariableFont_wght.ttf'));
    const montserratFont = await pdfDoc.embedFont(montserratFontBytes);

    // Montserrat Bold para textos en negritas
    const montserratBoldBytes = fs.readFileSync(path.join(__dirname, '../fonts/Montserrat-Bold.ttf'));
    const montserratBold = await pdfDoc.embedFont(montserratBoldBytes);

    // Montserrat Light para la fecha
    const montserratLightBytes = fs.readFileSync(path.join(__dirname, '../fonts/Montserrat-Light.otf'));
    const montserratLight = await pdfDoc.embedFont(montserratLightBytes);

    // Montserrat Regular para la fecha
    const montserratRegularBytes = fs.readFileSync(path.join(__dirname, '../fonts/Montserrat-Regular.ttf'));
    const montserratRegular = await pdfDoc.embedFont(montserratRegularBytes);

    // Times New Roman para el nombre y periodo
    const timesFontBytes = fs.readFileSync(path.join(__dirname, '../fonts/Times-New-Roman.ttf'));
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
        x: 388,
        y: 667,
        size: 14,
        font: montserratFont,
        color: rgb(0, 0, 0)
    });
    // Fecha en formato completo, Montserrat Light, tamaño 11
    page.drawText(`${fechaCompleta(req.body.fecha)}`, {
        x: 346,
        y: 696,
        size: 11,
        font: montserratFont,
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
    // N. Registro in Montserrat Bold, tamaño 11
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
        const actividad = cleanBody[`actividad${i}`] || '';
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
        font: montserratFont,
        color: rgb(0, 0, 0)
    });
    page.drawText(`${req.body.cargo}`, { 
        x: 430, 
        y: 180,
        size: 10,
        font: montserratFont,
        color: rgb(0, 0, 0)
     });
    page.drawText(`${req.body.nombreA}`, {
        x: 90,
        y: 190,
        size: 10,
        font: montserratFont,
        color: rgb(0, 0, 0)
    });
    const finalDoc = await stripPdfForms(pdfDoc);
    const pdfOutput = await finalDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-mensual.pdf');
    res.send(pdfOutput);
});

app.post('/registrar-alumno', upload.none(), (req, res) => {
    const cleanBody = sanitizeBody(req.body);
    const { boleta, nombre, apellidoPaterno, apellidoMaterno, curp, semestre, NumR } = cleanBody;

    if (!boleta || !nombre || !apellidoPaterno || !apellidoMaterno || !curp || !semestre || !NumR) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    db.run(
        `INSERT INTO alumnos (Boleta, Nombre, apellidoPaterno, apellidoMaterno, curp, Semestre, NumR) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [boleta, nombre, apellidoPaterno, apellidoMaterno, curp, semestre, NumR],
        function(err) {
            if (err) {
                console.error('Error al registrar alumno:', err);
                return res.status(500).send('Error al registrar alumno: ' + err.message);
            }
            res.send('Alumno registrado correctamente');
        }
    );
});

// Agrega la ruta para generar el reporte global en PDF
app.post('/generate-reporte-global', async (req, res) => {
    try {
        const cleanBody = sanitizeBody(req.body);
        const pdfPath = path.join(__dirname, '../docs/reporte-global.pdf');
        const pdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        const fontkit = require('fontkit');
        pdfDoc.registerFontkit(fontkit);

        const timesFontBytes = fs.readFileSync(path.join(__dirname, '../fonts/Times-New-Roman.ttf'));
        const timesFont = await pdfDoc.embedFont(timesFontBytes);

        // fuente Noto Sans para las fechas
        const notoSansBytes = fs.readFileSync(path.join(__dirname, '../fonts/NotoSans-Regular.ttf'));
        const notoSansFont = await pdfDoc.embedFont(notoSansBytes);

        const montserratLightBytes = fs.readFileSync(path.join(__dirname, '../fonts/Montserrat-Light.otf'));
        const montserratLight = await pdfDoc.embedFont(montserratLightBytes);

        // Función auxiliar para mostrar fechas completas en español
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

        // texto CECyT N° 19 “Leona Vicario” en Noto Sans 12
        page.drawText('CECyT N° 19 “Leona Vicario”', {
            x: 227,
            y: 744,
            size: 12,
            font: notoSansFont
        });

        // Divide el nombre completo en partes para obtener apellidos y nombre
        let nombreCompleto = cleanBody.nombreCompleto || '';
        let partes = nombreCompleto.trim().split(' ');
        let apellidoP = partes.length > 1 ? partes[partes.length - 2] : '';
        let apellidoM = partes.length > 2 ? partes[partes.length - 1] : '';
        let nombres = partes.slice(0, partes.length - 2).join(' ');
        if (!nombres) nombres = partes[0] || '';

        // Imprime en el PDF: Apellido Paterno, Apellido Materno, Nombre(s)
        page.drawText(`${apellidoP} ${apellidoM} ${nombres}`, { x: 113, y: 594, size: 11});
        page.drawText(`${cleanBody.boleta}`, { x: 101, y: 573, size: 11});
        page.drawText(`${cleanBody.semestre}`, { x: 117, y: 552, size: 11 });
        page.drawText(`${cleanBody.carrera}`, { x: 377, y: 573, size: 11});
        page.drawText(`${cleanBody.nregistro}`, { x: 347, y: 552, size: 11 });
        page.drawText(`${cleanBody.telefono}`, { x: 168, y: 531, size: 11 });
        page.drawText(`${cleanBody.correo}`, { x: 377, y: 531, size: 11});
        const globalSignatureAnchorX = 315;
        drawCenteredAtAnchor(page, `${cleanBody.responsable}`, montserratLight, 10, globalSignatureAnchorX, 70, { color: rgb(0.56, 0.56, 0.56) });
        drawCenteredAtAnchor(page, `${cleanBody.cargoResponsable}`, montserratLight, 10, globalSignatureAnchorX, 60, { color: rgb(0.56, 0.56, 0.56) });
        page.drawText(`${cleanBody.prestatario}`, { x: 125, y: 510.5, size: 11});
        page.drawText(`${cleanBody.programa}`, { x: 185, y: 489.5, size: 11 });

        // imprimir resumen de actividades (máx. 1000 caracteres)
        const resumenActividades = (cleanBody.resumenActividades || '').slice(0, 1000); // CAMBIO: antes 600

        function dividirTexto(texto, maxLen) {
            const palabras = texto.trim().split(/\s+/);
            const lineas = [];
            let lineaActual = '';

            palabras.forEach(palabra => {
                if (!lineaActual) {
                    lineaActual = palabra;
                } else if ((lineaActual + ' ' + palabra).length <= maxLen) {
                    lineaActual += ' ' + palabra;
                } else {
                    lineas.push(lineaActual);
                    lineaActual = palabra;
                }
            });

            if (lineaActual) lineas.push(lineaActual);
            return lineas;
        }

        // NUEVO: función para justificar una línea a un ancho máximo aproximado
        function justificarLinea(texto, font, size, maxWidth) {
            const palabras = texto.trim().split(/\s+/);
            if (palabras.length <= 1) return texto; // no se justifica una sola palabra

            let linea = palabras.join(' ');
            let width = font.widthOfTextAtSize(linea, size);

            // Si ya está cerca del ancho, no tocar
            if (width >= maxWidth * 0.98) return linea;

            let espacios = palabras.length - 1;
            let iteraciones = 0;

            // Añadir espacios extra entre palabras mientras haya margen y no nos pasemos mucho
            while (width < maxWidth && espacios > 0 && iteraciones < 20) {
                for (let i = 0; i < palabras.length - 1; i++) {
                    palabras[i] += ' ';
                    linea = palabras.join(' ');
                    width = font.widthOfTextAtSize(linea, size);
                    if (width >= maxWidth * 0.98) break;
                }
                iteraciones++;
                if (width >= maxWidth * 0.98) break;
            }

            return linea;
        }

        const lineasResumen = dividirTexto(resumenActividades, 80);
        let yResumen = 450;
        const saltoLinea = 18;
        const anchoMaximoTexto = 440;

        lineasResumen.forEach((linea, index) => {
            const esUltima = index === lineasResumen.length - 1;
            let textoDibujar = linea;

            if (!esUltima) {
                textoDibujar = justificarLinea(linea, timesFont, 12, anchoMaximoTexto);
            }

            page.drawText(textoDibujar, {
                x: 60,
                y: yResumen,
                size: 12,
            });
            yResumen -= saltoLinea;
        });

        // imprimir fechas de inicio y fin del programa con Noto Sans
        const fechaInicioTexto = fechaCompleta(cleanBody.fechaInicio);
        const fechaFinTexto = fechaCompleta(cleanBody.fechaFin);
        const xFechas = 250;
        const yFechas = 648;
        const sizeFechas = 13;

        page.drawText(`${fechaInicioTexto}`, {
            x: xFechas,
            y: yFechas,
            size: sizeFechas,
            font: notoSansFont
        });

        const anchoInicio = notoSansFont.widthOfTextAtSize(fechaInicioTexto, sizeFechas);

        page.drawText(` al ${fechaFinTexto}`, {
            x: xFechas + anchoInicio,
            y: yFechas,
            size: sizeFechas,
            font: notoSansFont
        });

        page.drawText(`${nombres} ${apellidoP} ${apellidoM}`, { x: 90, y: 70, size: 10, font: montserratLight, color: rgb(0.56, 0.56, 0.56) });
        page.drawText(`Fecha de elaboración: ${cleanBody.fechaElaboracion}`, { x: 800, y: 500, size: 11, font: timesFont });
        page.drawText(`Periodo: ${cleanBody.periodo}`, { x: 800, y: 480, size: 11, font: timesFont });

        const finalDoc = await stripPdfForms(pdfDoc);
        const pdfOutput = await finalDoc.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-global.pdf');
        res.send(pdfOutput);
    } catch (error) {
        console.error('Error generando reporte global:', error);
        res.status(500).send('Error generando reporte global');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


const customLogger = require('./middlewares/customLogger');
app.use(customLogger);


app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).send('Token CSRF inválido o faltante.');
    }
    next(err);
});

const pdfRoutes = require('./routes/pdfRoutes');
const alumnoRoutes = require('./routes/alumnoRoutes');

// Usar las rutas
app.use('/api', pdfRoutes);
app.use('/api', alumnoRoutes);

// Modificar la configuración de rutas estáticas (reemplazar las existentes)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    app.get(/^\/(?!api).*/, (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('Server running in development mode');
    });
}

app.get('/api/alumno/:boleta', (req, res) => {
    const sql = 'SELECT * FROM alumnos WHERE Boleta = ?';
    db.get(sql, [req.params.boleta], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.json({ data: null });
            return;
        }
        const data = {
            Id: row.Id ?? row.id ?? null,
            Boleta: row.Boleta ?? row.boleta ?? '',
            Nombre: row.Nombre ?? row.nombre ?? '',
            apellidoPaterno: row.apellidoPaterno ?? row.ApellidoPaterno ?? '',
            apellidoMaterno: row.apellidoMaterno ?? row.ApellidoMaterno ?? '',
            curp: row.curp ?? row.Curp ?? '',
            Semestre: row.Semestre ?? row.semestre ?? null,
            NumR: row.NumR ?? row.numR ?? row.numr ?? null
        };
        res.json({ data });
    });
});

app.get('/api/alumnos/boletas', (req, res) => {
    const sql = 'SELECT Boleta FROM alumnos ORDER BY Boleta ASC';
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});