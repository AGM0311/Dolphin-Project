import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Códigos alcaldías
const alcaldiasCodigos = {
  "Azcapotzalco": 2,
  "Coyoacán": 3,
  "Cuajimalpa de Morelos": 4,
  "Gustavo A. Madero": 5,
  "Iztacalco": 6,
  "Iztapalapa": 7,
  "La Magdalena Contreras": 8,
  "Milpa Alta": 9,
  "Álvaro Obregón": 10,
  "Tláhuac": 11,
  "Tlalpan": 12,
  "Xochimilco": 13,
  "Benito Juárez": 14,
  "Cuauhtémoc": 15,
  "Miguel Hidalgo": 16,
  "Venustiano Carranza": 17,
};


// Nueva paleta de colores pastel
const getColor = (nivel) => {
  if (nivel == null) return '#d3d3d3';          // gris claro para sin datos
  if (nivel > 70) return '#ff6b6b';             // rojo pastel suave
  if (nivel > 50) return '#f7b267';             // naranja pastel
  if (nivel > 30) return '#f9e79f';             // amarillo pastel
  if (nivel > 10) return '#a2d5c6';             // verde menta suave
  return '#6ab47b';                             // verde suave
};

// Coordenadas y límites para CDMX
const center = [19.4326, -99.1332];
const bounds = [
  [19.0, -99.5],   // suroeste
  [20.0, -98.7],   // noreste
];

const Maps = () => {
  const [geoData, setGeoData] = useState(null);
  const [datosMunicipios, setDatosMunicipios] = useState({});
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState(null);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [filtros, setFiltros] = useState({ tuberculosis: true, vih: true, cancer: true });

  const datosRef = useRef({});
  datosRef.current = datosMunicipios;

  useEffect(() => {
    async function fetchData() {
      try {
        const geo = await fetch('/CDMX_mpal.geojson').then(r => r.json());
        setGeoData(geo);

        const entries = Object.entries(alcaldiasCodigos);
        const allData = {};

        await Promise.all(entries.map(async ([nombre, codigo]) => {
          try {
            const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/datos?codigo=${codigo}`);
            if (res.ok) {
              const info = await res.json();
              allData[nombre] = info.enfermedades || null;
            } else {
              allData[nombre] = null;
            }
          } catch {
            allData[nombre] = null;
          }
        }));

        setDatosMunicipios(allData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoadingGlobal(false);
      }
    }
    fetchData();
  }, []);

  const styleFeature = useCallback((feature) => {
    const nombre = feature.properties.NOM_MUN;
    const enfermedades = datosRef.current[nombre];

    let nivel = null;
    if (enfermedades) {
      const t = filtros.tuberculosis ? enfermedades.tuberculosis || 0 : 0;
      const v = filtros.vih ? enfermedades.vih || 0 : 0;
      const c = filtros.cancer && enfermedades.cancer
        ? Object.values(enfermedades.cancer).reduce((a, b) => a + b, 0)
        : 0;
      nivel = (t + v + c) / ( (filtros.tuberculosis + filtros.vih + filtros.cancer) || 1 );
    }

    return {
      weight: 1.5,
      color: '#34495e',
      fillOpacity: 0.7,
      fillColor: getColor(nivel),
      dashArray: '3',
    };
  }, [filtros]);

  const onEachFeature = useCallback((feature, layer) => {
    const nombre = feature.properties.NOM_MUN;
    layer.on({
      click: () => {
        setLoadingPanel(true);
        setMunicipioSeleccionado({ nombre, enfermedades: null });

        setTimeout(() => {
          const enfermedades = datosRef.current[nombre] || null;
          setMunicipioSeleccionado({ nombre, enfermedades });
          setLoadingPanel(false);
        }, 200);
      }
    });
  }, []);

  const toggleFiltro = (key) => {
    setFiltros(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={11}
        minZoom={10}
        maxZoom={14}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        style={{ height: '100vh', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        {geoData && (
          <GeoJSON
            data={geoData}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      {loadingGlobal && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.95)',
          padding: '20px 30px',
          borderRadius: '12px',
          boxShadow: '0 0 20px rgba(0,0,0,0.15)',
          zIndex: 10000,
          fontWeight: '600',
          color: '#34495e'
        }}>
          🗺️ Cargando mapa y datos...
        </div>
      )}

      {/* Panel lateral */}
      <aside style={{
        position: 'absolute',
        top: 0,
        right: municipioSeleccionado ? 0 : '-360px',
        height: '100%',
        width: '340px',
        maxWidth: '90%',
        backgroundColor: '#fff',
        boxShadow: municipioSeleccionado ? '-3px 0 15px rgba(0,0,0,0.1)' : 'none',
        padding: municipioSeleccionado ? '20px 24px' : 0,
        overflowY: 'auto',
        transition: 'right 0.3s ease, padding 0.3s ease',
        fontFamily: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {municipioSeleccionado && (
          <>
            <button
              onClick={() => setMunicipioSeleccionado(null)}
              aria-label="Cerrar panel"
              style={{
                alignSelf: 'flex-end',
                fontSize: '24px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#7f8c8d',
                marginBottom: '10px',
                padding: 0,
                lineHeight: 1,
              }}
            >&times;</button>

            <h2 style={{ marginTop: 0, color: '#2c3e50', fontWeight: '700' }}>
              {municipioSeleccionado.nombre}
            </h2>

            {/* Filtros */}
            <div style={{ marginBottom: '15px' }}>
              <strong>Filtros</strong>
              <div>
                {['tuberculosis', 'vih', 'cancer'].map(key => (
                  <label key={key} style={{ display: 'block', cursor: 'pointer', marginTop: '6px', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={filtros[key]}
                      onChange={() => toggleFiltro(key)}
                      style={{ marginRight: '8px' }}
                    />
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            {loadingPanel ? (
              <p style={{ color: '#437a7eff' }}><em>Cargando datos...</em></p>
            ) : municipioSeleccionado.enfermedades ? (
              <ul style={{ paddingLeft: 0, listStyle: 'none', color: '#34495e' }}>
                {filtros.tuberculosis && (
                  <li>🦠 Tuberculosis: {municipioSeleccionado.enfermedades.tuberculosis ?? 'N/A'}</li>
                )}
                {filtros.vih && (
                  <li>🧬 VIH: {municipioSeleccionado.enfermedades.vih ?? 'N/A'}</li>
                )}
                {filtros.cancer && municipioSeleccionado.enfermedades.cancer && (
                  Object.entries(municipioSeleccionado.enfermedades.cancer).map(([tipo, cantidad]) => (
                    <li key={tipo}>🎗️ {tipo}: {cantidad}</li>
                  ))
                )}
              </ul>
            ) : (
              <p style={{ color: '#2f52a8ff' }}><em>No hay datos disponibles</em></p>
            )}
          </>
        )}
      </aside>
    </div>
  );
};

export default Maps;
