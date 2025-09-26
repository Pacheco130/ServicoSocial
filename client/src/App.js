import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ReporteMensual from './components/ReporteMensual';
import ReporteGlobal from './components/ReporteGlobal';
import CartaAceptacion from './components/CartaAceptacion';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="App-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reporte-mensual" element={<ReporteMensual />} />
            <Route path="/reporte-global" element={<ReporteGlobal />} />
            <Route path="/carta-aceptacion" element={<CartaAceptacion />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
