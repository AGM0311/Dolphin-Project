import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Maps.css';

const alcaldiasCodigos = {
  Azcapotzalco: 2,
  'Coyoacán': 3,
  'Cuajimalpa de Morelos': 4,
  'Gustavo A. Madero': 5,
  Iztacalco: 6,
  Iztapalapa: 7,
  'La Magdalena Contreras': 8,
  'Milpa Alta': 9,
  'Álvaro Obregón': 10,
  Tláhuac: 11,
  Tlalpan: 12,
  Xochimilco: 13,
  'Benito Juárez': 14,
  Cuauhtémoc: 15,
  'Miguel Hidalgo': 16,
  'Venustiano Carranza': 17,
};

const getColor = (nivel) => {
  if (nivel == null) return '#f0f0f0';
  if (nivel > 70) return '#084594';
  if (nivel > 50) return '#2171b5';
  if (nivel > 30) return '#4292c6';
  if (nivel > 10) return '#6baed6';
  return '#9ecae1';
};

const center = [19.4326, -99.1332];
const bounds = [
  [19.0, -99.5],
  [20.0, -98.7],
];

const Maps = () => {
  const [geoData, setGeoData] = useState(null);
  const [datosMunicipios, setDatosMunicipios] = useState({});
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState(null);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [filtros, setFiltros] = useState({ tuberculosis: true, vih: true, cancer: true });

  const datosRef = useRef(datosMunicipios);
  datosRef.current = datosMunicipios;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const geoResponse = await fetch('/CDMX_mpal.geojson');
        const geoJson = await geoResponse.json();
        setGeoData(geoJson);

        const allData = {};
        const entries = Object.entries(alcaldiasCodigos);

        await Promise.all(
          entries.map(async ([nombre, codigo]) => {
            try {
              const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/datos?codigo=${codigo}`;
              const res = await fetch(url);
              if (!res.ok) throw new Error(`Error en ${nombre}`);
              const info = await res.json();
              allData[nombre] = info.enfermedades || null;
            } catch {
              allData[nombre] = null;
            }
          })
        );

        setDatosMunicipios(allData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoadingGlobal(false);
      }
    };

    fetchData();
  }, []);

  const calcularNivel = useCallback(
    (enfermedades) => {
      if (!enfermedades) return null;

      const filtrosActivos = Object.entries(filtros).filter(([_, val]) => val);
      if (filtrosActivos.length === 0) return null;

      let suma = 0;
      filtrosActivos.forEach(([key]) => {
        if (key === 'cancer') {
          const totalCancer = enfermedades.cancer
            ? Object.values(enfermedades.cancer).reduce((acc, val) => acc + val, 0)
            : 0;
          suma += totalCancer;
        } else {
          suma += enfermedades[key] || 0;
        }
      });

      return suma / filtrosActivos.length;
    },
    [filtros]
  );

  const styleFeature = useCallback(
    (feature) => {
      const nombre = feature.properties.NOM_MUN;
      const enfermedades = datosRef.current[nombre];
      const nivel = calcularNivel(enfermedades);

      return {
        weight: 1.5,
        color: '#34495e',
        fillOpacity: 0.7,
        fillColor: getColor(nivel),
        dashArray: '3',
      };
    },
    [calcularNivel]
  );

  const onEachFeature = useCallback(
    (feature, layer) => {
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
        },
      });
    },
    []
  );

  const toggleFiltro = (key) => {
    setFiltros((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="container">
      <aside className={`panelLateral ${municipioSeleccionado ? 'panelAbierto' : ''}`} aria-live="polite">
        {municipioSeleccionado && (
          <>
            <button onClick={() => setMunicipioSeleccionado(null)} aria-label="Cerrar panel" className="btnCerrar">
              &times;
            </button>

            <h2 className="tituloMunicipio">{municipioSeleccionado.nombre}</h2>

            <div className="filtrosContenedor">
              <strong className="filtrosTitulo">Filtros</strong>
              <div>
                {['tuberculosis', 'vih', 'cancer'].map((key) => (
                  <label key={key} className="filtroLabel">
                    <input
                      type="checkbox"
                      checked={filtros[key]}
                      onChange={() => toggleFiltro(key)}
                      className="checkbox"
                    />
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            {loadingPanel ? (
              <p className="cargandoPanel">
                <span className="spinner" aria-hidden="true"></span> Cargando datos...
              </p>
            ) : municipioSeleccionado.enfermedades ? (
              <ul className="listaDatos">
                {filtros.tuberculosis && (
                  <li>
                    🦠 Tuberculosis: <strong>{municipioSeleccionado.enfermedades.tuberculosis ?? 'N/A'}</strong>
                  </li>
                )}
                {filtros.vih && (
                  <li>
                    🧬 VIH: <strong>{municipioSeleccionado.enfermedades.vih ?? 'N/A'}</strong>
                  </li>
                )}
                {filtros.cancer &&
                  municipioSeleccionado.enfermedades.cancer &&
                  Object.entries(municipioSeleccionado.enfermedades.cancer).map(([tipo, cantidad]) => (
                    <li key={tipo}>
                      🎗️ {tipo}: <strong>{cantidad}</strong>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="noDatos">No hay datos disponibles</p>
            )}
          </>
        )}
      </aside>

      <MapContainer
        center={center}
        zoom={11}
        minZoom={10}
        maxZoom={14}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        className="mapContainer"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
        />
        {geoData && <GeoJSON data={geoData} style={styleFeature} onEachFeature={onEachFeature} />}
      </MapContainer>

      {loadingGlobal && (
        <div className="loadingGlobal" role="status" aria-live="polite">
          <span role="img" aria-label="Mapa" className="loadingEmoji">🗺️</span> Cargando mapa y datos...
        </div>
      )}
    </div>
  );
};

export default Maps;