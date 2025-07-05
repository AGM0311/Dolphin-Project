import React from 'react';
import { Menu } from '../components/inicio';

export function Plantilla({ children }) {
  return (
    <div style={{ backgroundColor: 'green', minHeight: '100vh' }}>
      {/* Menú lateral */}
      <div className='header'>
        <Menu />
      </div>

      {/* Contenido principal con margen izquierdo */}
      <div className='body' style={{ marginLeft: '150px', padding: '10px' }}>
        {children}
      </div>
    </div>
  );
}