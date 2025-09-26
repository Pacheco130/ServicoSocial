import React, { useState } from 'react';
import { TextField, Button, Grid, Paper, Typography } from '@mui/material';

const ReporteMensual = () => {
  const [formData, setFormData] = useState({
    nreporte: '',
    nombreA: '',
    boleta: '',
    semestre: '',
    telefono: '',
    prestatario: '',
    carrera: '',
    nregistro: '',
    correo: '',
    encargadoDirecto: '',
    cargo: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/generate-reporte-mensual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte-mensual.pdf';
      a.click();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Paper style={{ padding: 20, margin: 20 }}>
      <Typography variant="h5" gutterBottom>
        Generar Reporte Mensual
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Número de Reporte"
              name="nreporte"
              value={formData.nreporte}
              onChange={(e) => setFormData({...formData, nreporte: e.target.value})}
            />
          </Grid>
          {/* Agregar campos similares para el resto de datos */}
        </Grid>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          style={{ marginTop: 20 }}
        >
          Generar PDF
        </Button>
      </form>
    </Paper>
  );
};

export default ReporteMensual;

