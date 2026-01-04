require('./src/server');
const pool = require('./db/pool'); // reutiliza la importación existente si ya está declarada

app.get('/api/alumnos/boletas', async (req, res) => {
	try {
		const [rows] = await pool.query(
			'SELECT Boleta FROM alumnos WHERE Boleta IS NOT NULL ORDER BY Boleta'
		);
		return res.json({ data: rows });
	} catch (error) {
		console.error('Error al obtener boletas de alumnos:', error);
		return res.status(500).json({ error: 'No fue posible obtener las boletas.' });
	}
});