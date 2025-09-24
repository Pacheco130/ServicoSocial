const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

module.exports = function customLogger(req, res, next) {
    const start = Date.now();
    
    // Interceptar el método end para capturar cuando termina la respuesta
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const responseTime = Date.now() - start;
        const status = res.statusCode;
        let color = colors.green;
        let message = '';

        // Si es una generación de PDF, solo mostrar mensaje de éxito
        if (req.url.includes('generate-')) {
            message = `${colors.magenta}[PDF Generado]${colors.reset}`;
            color = colors.green;
        } 
        // Solo mostrar errores para otras rutas que no sean de generación
        else if (status === 404) {
            color = colors.yellow;
            message = `${colors.cyan}[PROCESO: Solicitud incorrecta]${colors.reset}`;
        } else if (status >= 400 && status < 500) {
            color = colors.yellow;
            message = `${colors.cyan}[PROCESO: Error en datos de entrada]${colors.reset}`;
        } else if (status >= 500) {
            color = colors.red;
            message = `${colors.cyan}[PROCESO: Error interno]${colors.reset}`;
        }
        
        console.log(
            `${color}[${new Date().toISOString()}] ${req.method} ${req.url} ` +
            `| Status: ${status} | ${responseTime}ms ${message}${colors.reset}`
        );
        
        originalEnd.call(this, chunk, encoding);
    };
    
    next();
};
;
