import React from 'react';
import { Grid, Paper, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Bienvenido al Sistema de Servicio Social
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper style={{ padding: 20, textAlign: 'center' }}>
            <Typography variant="h6">Reporte Mensual</Typography>
            <Button 
              component={Link} 
              to="/reporte-mensual"
              variant="contained" 
              color="primary"
              style={{ marginTop: 10 }}
            >
              Generar Reporte
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper style={{ padding: 20, textAlign: 'center' }}>
            <Typography variant="h6">Reporte Global</Typography>
            <Button 
              component={Link} 
              to="/reporte-global"
              variant="contained" 
              color="primary"
              style={{ marginTop: 10 }}
            >
              Generar Reporte
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper style={{ padding: 20, textAlign: 'center' }}>
            <Typography variant="h6">Carta de Aceptación</Typography>
            <Button 
              component={Link} 
              to="/carta-aceptacion"
              variant="contained" 
              color="primary"
              style={{ marginTop: 10 }}
            >
              Generar Carta
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;
