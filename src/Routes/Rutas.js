import React from "react";
import { Routes, Route } from "react-router-dom";
import  Home  from "../Page/Home";
import { Plantilla } from "../layouts";
import Maps from '../components/Maps/Maps';

export function Rutas() {

  const Layouts=(Layout,Page)=>(
    <Layout>
      <Page/>
    </Layout>
  )
  
  return (
    <Routes>
      <Route path="/" element={Layouts(Plantilla,Home)} />
      <Route path="/maps" element={Layouts(Plantilla,Maps)} />
      <Route path="/usuarios" element={Layouts(Plantilla,)} />
      <Route path="/gestion" element={Layouts(Plantilla,)} />
      <Route path="/informe" element={Layouts(Plantilla,)} />
    </Routes>
  );
}