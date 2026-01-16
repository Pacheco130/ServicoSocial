// Helper para mostrar notificación emergente
function mostrarToastGlobal(mensaje) {
    let toast = document.getElementById('toast-global');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-global';
        toast.className = 'toast';
        toast.innerHTML = '<img src="/img/CECyt19.png" alt="CECyt 19" class="toast-logo"><div class="toast-message"></div><button type="button" class="toast-close">Cerrar</button>';
        document.body.appendChild(toast);

        const btnCerrar = toast.querySelector('.toast-close');
        btnCerrar.addEventListener('click', function () {
            toast.classList.remove('visible');
        });
    }

    const mensajeEl = toast.querySelector('.toast-message');
    mensajeEl.textContent = mensaje;

    toast.classList.add('visible');

    // Ocultar automáticamente después de unos segundos (tiempo extendido)
    setTimeout(function () {
        toast.classList.remove('visible');
    }, 16000);
}

document.getElementById('reporteGlobalForm').addEventListener('submit', function(e) {
    // Validación ejemplo: boleta debe ser numérica y de 10 dígitos
    const boleta = document.getElementById('boleta').value;
    if (!/^\d{10}$/.test(boleta)) {
        alert('La boleta debe tener exactamente 10 dígitos numéricos.');
        e.preventDefault();
        return false;
    }
    // Teléfono debe ser numérico y de exactamente 10 dígitos
    const telefono = document.getElementById('telefono').value;
    if (!/^\d{10}$/.test(telefono)) {
        alert('El teléfono debe tener exactamente 10 dígitos numéricos.');
        e.preventDefault();
        return false;
    }
    // Correo debe ser válido (HTML5 ya valida, pero puedes reforzar)
    const correo = document.getElementById('correo').value;
    if (!correo.includes('@')) {
        alert('Ingrese un correo válido.');
        e.preventDefault();
        return false;
    }

    // Si todo es válido y se va a generar el PDF, mostramos aviso informativo
    mostrarToastGlobal('Debes de Agregar 2 cuartillas de Reporte Adicionales al Documento PDF.');
    // El submit continúa para que el servidor genere el PDF
});
