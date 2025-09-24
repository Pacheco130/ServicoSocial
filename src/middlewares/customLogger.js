// Middleware de ejemplo: registra cada petición en consola
module.exports = function customLogger(req, res, next) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
};
