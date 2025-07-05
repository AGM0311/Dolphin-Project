import React from 'react';
import './Home.css';

function Home() {
  return (
    <main className="home-container">
      <section className="home-content">
        <h1>Datos de Salud</h1>
        <h2>Verano Delfín 2025</h2>
        <p>
          Bienvenido/a al portal de datos de salud para el programa Verano Delfín 2025.
          Aquí podrás consultar, registrar y actualizar información importante.
        </p>
        <button>Empezar</button>
      </section>
    </main>
  );
}

export default Home;
