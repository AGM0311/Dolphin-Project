import React from 'react';
import { Menu } from '../components/inicio';
import './Plantilla.css'; // Archivo CSS para los estilos

export function Plantilla({ children }) {
  return (
    <div className="plantilla-container">
      <div className="sidebar">
        <Menu />
      </div>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
