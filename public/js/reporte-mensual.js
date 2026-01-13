document.addEventListener('DOMContentLoaded', function () {
    const nombreA = document.getElementById('nombreA');
    const telefono = document.getElementById('telefono');
    const correo = document.getElementById('correo');
    const encargadoDirecto = document.getElementById('encargadoDirecto');
    const cargo = document.getElementById('cargo');

    // Solo letras, espacios y acentos para el nombre
    if (nombreA) {
        nombreA.addEventListener('input', function () {
            const valor = nombreA.value;
            const nuevoValor = valor.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
            if (valor !== nuevoValor) {
                nombreA.value = nuevoValor;
            }
        });
    }

    // Solo números y máximo 10 dígitos para el teléfono
    if (telefono) {
        telefono.addEventListener('input', function () {
            let valor = telefono.value.replace(/[^0-9]/g, '');
            if (valor.length > 10) valor = valor.slice(0, 10);
            telefono.value = valor;
        });
    }

    // Validación básica de formato de correo (no bloquea el envío si el navegador lo acepta)
    if (correo) {
        correo.addEventListener('input', function () {
            const valor = correo.value;
            const regex = /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/;
            if (valor && !regex.test(valor)) {
                correo.setCustomValidity('Ingresa un correo electrónico válido');
            } else {
                correo.setCustomValidity('');
            }
        });
    }

    // Solo letras, espacios y acentos para encargado directo y cargo
    if (encargadoDirecto) {
        encargadoDirecto.addEventListener('input', function () {
            const valor = encargadoDirecto.value;
            const nuevoValor = valor.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
            if (valor !== nuevoValor) {
                encargadoDirecto.value = nuevoValor;
            }
        });
    }

    if (cargo) {
        cargo.addEventListener('input', function () {
            const valor = cargo.value;
            const nuevoValor = valor.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
            if (valor !== nuevoValor) {
                cargo.value = nuevoValor;
            }
        });
    }
});
