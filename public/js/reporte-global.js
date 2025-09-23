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
    // Puedes agregar más reglas según lo necesites
});
