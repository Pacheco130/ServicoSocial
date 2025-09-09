document.addEventListener("DOMContentLoaded", function() {
    const boletaInput = document.getElementById("boleta");
    if (boletaInput) {
        boletaInput.addEventListener("input", function() {
            // Eliminar cualquier carácter que no sea numérico
            this.value = this.value.replace(/\D/g, "");
            // Limitar la entrada a 10 dígitos
            if (this.value.length > 10) {
                this.value = this.value.slice(0, 10);
            }
        });
    }
    
    // Restringir caracteres para "Nombre del Prestador"
    const nombreInput = document.getElementById("nombre");
    if (nombreInput) {
        nombreInput.addEventListener("input", function() {
            // Permitir solo letras, acentos y espacios
            this.value = this.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, "");
        });
    }
    
    // Restringir caracteres para "Nombre del Responsable"
    const responsableNombreInput = document.getElementById("responsableNombre");
    if (responsableNombreInput) {
        responsableNombreInput.addEventListener("input", function() {
            // Permitir solo letras, acentos y espacios
            this.value = this.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, "");
        });
    }
});
