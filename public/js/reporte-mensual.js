document.addEventListener('DOMContentLoaded', function () {
    const fase1 = document.getElementById('fase1');
    const fase2 = document.getElementById('fase2');
    const siguienteBtn = document.getElementById('siguienteBtn');
    const reporteForm = document.getElementById('reporteForm');
    const nombreA = document.getElementById('nombreA');
    const telefono = document.getElementById('telefono');
    const fecha = document.getElementById('fecha');
    const nreporte = document.getElementById('nreporte');
    const correo = document.getElementById('correo');
    const encargadoDirecto = document.getElementById('encargadoDirecto');
    const cargo = document.getElementById('cargo');

    fase2.style.display = 'none';
    fecha.disabled = true;

    siguienteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        let mensaje = '';
        if (!nombreA.value.trim()) {
            mensaje = 'Debes ingresar el nombre del alumno.';
            nombreA.focus();
        } else if (!telefono.value.trim() || telefono.value.length !== 10) {
            mensaje = 'El teléfono debe tener 10 dígitos.';
            telefono.focus();
        } else if (fecha.disabled || !fecha.value.trim()) {
            mensaje = 'Debes seleccionar la fecha.';
            fecha.focus();
        } else if (!correo.value.trim()) {
            mensaje = 'Debes ingresar un correo electrónico.';
            correo.focus();
        } else if (correo.validity.customError) {
            mensaje = correo.validationMessage;
            correo.focus();
        }
        if (mensaje) {
            alert(mensaje);
            location.reload();
            return;
        }
        fase1.style.display = 'none';
        fase2.style.display = 'block';
    });

    nreporte.addEventListener('change', function () {
        const idx = nreporte.selectedIndex - 1;
        const fechasPorReporte = [
            ["2025-11-18","2025-11-19","2025-11-20","2025-11-21","2025-11-24"], // Reporte 1
            ["2025-12-16","2025-12-17","2025-12-18","2025-12-19","2026-01-05"], // Reporte 2
            ["2026-01-16","2026-01-19","2026-01-20","2026-01-21","2026-01-22"], // Reporte 3
            ["2026-02-16","2026-02-17","2026-02-18","2026-02-19","2026-02-20"], // Reporte 4
            ["2026-03-17","2026-03-18","2026-03-19","2026-03-20","2026-03-23"], // Reporte 5
            ["2026-04-16","2026-04-17","2026-04-20","2026-04-21","2026-04-22"], // Reporte 6
            ["2026-05-18","2026-05-19","2026-05-20","2026-05-21","2026-05-22"]  // Reporte 7
        ];

        if (idx >= 0 && fechasPorReporte[idx]) {
            fecha.disabled = false;
            // fecha.value = fechasPorReporte[idx]; // Descomentar si se desea autocompletar la fecha
        } else {
            fecha.disabled = true;
            fecha.value = ''; // Limpiar el campo fecha si no hay reporte seleccionado
        }
    });

    // Validación para el campo Nombre del Alumno
    nombreA.addEventListener('input', function (e) {
        // Solo letras, espacios y acentos
        const valor = nombreA.value;
        const nuevoValor = valor.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
        if (valor !== nuevoValor) {
            nombreA.value = nuevoValor;
        }
    });

    telefono.addEventListener('input', function (e) {
        // Solo números y máximo 10 dígitos
        let valor = telefono.value.replace(/[^0-9]/g, '');
        if (valor.length > 10) valor = valor.slice(0, 10);
        telefono.value = valor;
    });

    correo.addEventListener('input', function () {
        // Validación básica de correo electrónico
        const valor = correo.value;
        const regex = /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/;
        if (valor && !regex.test(valor)) {
            correo.setCustomValidity('Ingresa un correo electrónico válido');
        } else {
            correo.setCustomValidity('');
        }
    });

    encargadoDirecto.addEventListener('input', function (e) {
        // Solo letras, espacios y acentos
        const valor = encargadoDirecto.value;
        const nuevoValor = valor.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
        if (valor !== nuevoValor) {
            encargadoDirecto.value = nuevoValor;
        }
    });

    cargo.addEventListener('input', function (e) {
        // Solo letras, espacios y acentos
        const valor = cargo.value;
        const nuevoValor = valor.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
        if (valor !== nuevoValor) {
            cargo.value = nuevoValor;
        }
    });

    reporteForm.addEventListener('submit', function (e) {
        let mensaje = '';
        if (!nombreA.value.trim()) {
            mensaje = 'Debes ingresar el nombre del alumno.';
            nombreA.focus();
        } else if (!telefono.value.trim() || telefono.value.length !== 10) {
            mensaje = 'El teléfono debe tener 10 dígitos.';
            telefono.focus();
        } else if (fecha.disabled || !fecha.value.trim()) {
            mensaje = 'Debes seleccionar la fecha.';
            fecha.focus();
        } else if (!correo.value.trim()) {
            mensaje = 'Debes ingresar un correo electrónico.';
            correo.focus();
        } else if (correo.validity.customError) {
            mensaje = correo.validationMessage;
            correo.focus();
        }
        if (mensaje) {
            e.preventDefault();
            alert(mensaje);
        }
    });

});
