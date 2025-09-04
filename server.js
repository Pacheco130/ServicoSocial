const express = require('express');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


// Mueve la ruta raíz antes del middleware estático para que se sirva menu.html al entrar a localhost
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'menu.html'));
});
 
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'img'))); // Agrega esta línea para servir las imágenes desde la carpeta "img"
// Agrega una ruta estática para servir archivos desde la raíz (con precaución)
app.use(express.static(__dirname));

app.post('/generate-pdf', async (req, res) => {
    try {
        const { 
            reporteNo, 
            periodoInicio, 
            periodoFin, 
            registro, 
            boleta, 
            unidadAcademica, 
            carrera,
            nombre,                // Nombre del Prestador
            responsableNombre,     // Nombre del Responsable
            responsableCargo       // Cargo del Responsable
        } = req.body;
        
        // Agregar función para reformatar fechas de YYYY-MM-DD a DD/MM/YYYY
        function formatDate(dateString) {
            const parts = dateString.split('-');
            return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateString;
        }
        const formattedPeriodoInicio = formatDate(periodoInicio);
        const formattedPeriodoFin = formatDate(periodoFin);
        
        const templatePath = path.join(__dirname, 'control-asis.pdf');
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);
        const firstPage = pdfDoc.getPages()[0];
        const { width, height } = firstPage.getSize();
        
        // Para centrar "reporteNo" y desplazarlo un poco a la izquierda
        const fontSize = 10;
        const font = await pdfDoc.embedFont('Helvetica');
        const textWidth = font.widthOfTextAtSize(reporteNo, fontSize);
        const centerX = (width - textWidth) / 2;
        const newX = centerX - 10;
        firstPage.drawText(`${reporteNo}`, { x: newX, y: height - 100, size: fontSize, font: font });
        
        // Dibujar "Periodo" usando las fechas formateadas
        firstPage.drawText(`${formattedPeriodoInicio}`, { x: 100, y: height - 118, size: 10 });
        firstPage.drawText(`${formattedPeriodoFin}`, { x: 250, y: height - 118, size: 10 });
        firstPage.drawText(`${registro}`, { x: 515, y: height - 118, size: 10 });
        firstPage.drawText(`${nombre}`, { x: 140, y: height - 135, size: 10 });
        firstPage.drawText(`${boleta}`, { x: 480, y: height - 135, size: 10 });
        firstPage.drawText(`${unidadAcademica}`, { x: 150, y: height - 150, size: 10 });
        firstPage.drawText(`${carrera}`, { x: 350, y: height - 150, size: 10 });
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
        firstPage.drawText(`${supervisor}`, { x: 100, y: height - 200, size: 12 });
        firstPage.drawText(`${nombre}`, { x: 100, y: height - 220, size: 12 });      // segunda vez nombre
        firstPage.drawText(`${supervisor}`, { x: 100, y: height - 240, size: 12 }); // segunda vez supervisor

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});