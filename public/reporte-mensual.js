document.addEventListener('DOMContentLoaded', function () {
    const fase1 = document.getElementById('fase1');
    const fase2 = document.getElementById('fase2');
    const siguienteBtn = document.getElementById('siguienteBtn');
    const reporteForm = document.getElementById('reporteForm');

    fase2.style.display = 'none';

    siguienteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        fase1.style.display = 'none';
        fase2.style.display = 'block';
    });

    // Opcional: puedes validar los campos de la fase 1 antes de avanzar
});
