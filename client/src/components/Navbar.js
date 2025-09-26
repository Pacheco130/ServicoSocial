import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          Servicio Social
        </Typography>
        <Button color="inherit" component={Link} to="/reporte-mensual">
          Reporte Mensual
        </Button>
        <Button color="inherit" component={Link} to="/reporte-global">
          Reporte Global
        </Button>
        <Button color="inherit" component={Link} to="/carta-aceptacion">
          Carta Aceptación
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
