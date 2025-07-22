import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const alcaldiasCodigos = {
  "Distrito Federal": 0,
  "Azcapotzalco": 2,
  "Coyoacan": 3,
  "Cuajimalpa de Morelos": 4,
  "Gustavo A. Madero": 5,
  "Iztacalco": 6,
  "Iztapalapa": 7,
  "La Magdalena Contreras": 8,
  "Milpa Alta": 9,
  "Álvaro Obregon": 10,
  "Tlahuac": 11,
  "Tlalpan": 12,
  "Xochimilco": 13,
  "Benito Juarez": 14,
  "Cuauhtemoc": 15,
  "Miguel Hidalgo": 16,
  "Venustiano Carranza": 17,
  "Municipio no especificado": 999
};

// Función para color del nivel (puedes ajustar esta lógica luego)
const getColor = (nivel) => {
  return nivel > 70 ? '#e74c3c' : // rojo fuerte
         nivel > 50 ? '#f39c12' : // naranja
         nivel > 30 ? '#f1c40f' : // amarillo
         nivel > 10 ? '#2ecc71' : // verde claro
                      '#27ae60';  // verde oscuro
};

const styleFeature = () => {
  const randomNivel = Math.floor(Math.random() * 100);
  return {
    weight: 1.5,
    color: '#2c3e50',
    fillOpacity: 0.6,
    fillColor: getColor(randomNivel)
  };
};

const FitBounds = ({ geoData }) => {
  const map = useMap();
  useEffect(() => {
    if (geoData) {
      const geoJsonLayer = L.geoJSON(geoData);
      map.fitBounds(geoJsonLayer.getBounds());
    }
  }, [geoData, map]);
  return null;
};

const Legend = () => {
  const map = useMap();
  useEffect(() => {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      const grades = [0, 10, 30, 50, 70];
      const labels = [];

      for (let i = 0; i < grades.length; i++) {
        labels.push(
          `<i style="background:${getColor(grades[i] + 1)}; width: 18px; height: 18px; display: inline-block; margin-right: 6px; border-radius: 3px;"></i> 
           ${grades[i]}${grades[i + 1] ? ' – ' + grades[i + 1] : '+'}`
        );
      }

      div.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      div.style.padding = '8px 12px';
      div.style.borderRadius = '8px';
      div.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
      div.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      div.style.fontSize = '13px';
      div.innerHTML = `<strong>Índice de Salud</strong><br>${labels.join('<br>')}`;
      return div;
    };

    legend.addTo(map);
    return () => legend.remove();
  }, [map]);
  return null;
};

const Maps = () => {
  const [geoData, setGeoData] = useState(null);
  const [filtros, setFiltros] = useState({
    tuberculosis: true,
    vih: true,
    cancer: true
  });

  const filtrosRef = useRef(filtros);
  useEffect(() => {
    filtrosRef.current = filtros;
  }, [filtros]);

  const infoCache = useRef({});

  useEffect(() => {
    fetch('/CDMX_mpal.geojson')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then(data => setGeoData(data))
      .catch(err => console.error('Error cargando geojson:', err));
  }, []);

  const iconos = {
    tuberculosis: '🦠',
    vih: '🧬',
    cancer: '🎗️'
  };

  const generarContenido = (nombre, enfermedades) => {
    if (!enfermedades) return `<b>${nombre}</b><br><em>No hay datos disponibles.</em>`;

    const items = [];

    if (filtrosRef.current.tuberculosis && enfermedades.tuberculosis !== undefined) {
      items.push(`<li>${iconos.tuberculosis} <b>Tuberculosis:</b> ${enfermedades.tuberculosis}</li>`);
    }

    if (filtrosRef.current.vih && enfermedades.vih !== undefined) {
      items.push(`<li>${iconos.vih} <b>VIH:</b> ${enfermedades.vih}</li>`);
    }

    if (filtrosRef.current.cancer && enfermedades.cancer) {
      Object.entries(enfermedades.cancer).forEach(([tipo, cantidad]) => {
        items.push(`<li>${iconos.cancer} <b>${tipo}:</b> ${cantidad}</li>`);
      });
    }

    return `
      <div style="
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        font-size: 14px; 
        color: #34495e;
        max-width: 230px;
      ">
        <strong style="font-size: 16px; color: #2c3e50;">${nombre}</strong><br/>
        ${items.length > 0 
          ? `<ul style="margin: 6px 0 0 18px; padding: 0; list-style-type: none;">${items.join('')}</ul>` 
          : '<em style="color: #7f8c8d;">Ninguna enfermedad seleccionada.</em>'}
      </div>
    `;
  };

  const onEachFeature = (feature, layer) => {
    const nombre = feature.properties.NOM_MUN;
    layer.bindPopup('Cargando...');

    const showPopup = () => {
      const filtrosActivos = filtrosRef.current.tuberculosis || filtrosRef.current.vih || filtrosRef.current.cancer;
      if (!filtrosActivos) {
        layer.closePopup();
        return;
      }

      if (infoCache.current[nombre]) {
        const data = infoCache.current[nombre];
        const enfermedades = data.enfermedades || null;
        const contenido = generarContenido(nombre, enfermedades);
        layer.setPopupContent(contenido).openPopup();
      } else {
        const codigo = alcaldiasCodigos[nombre];
        if (codigo === undefined) {
          layer.setPopupContent(`<b>${nombre}</b><br><em>Código no encontrado.</em>`).openPopup();
          return;
        }

        fetch(`http://localhost:5000/api/datos?codigo=${codigo}`)
          .then(res => {
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return res.json();
          })
          .then(info => {
            infoCache.current[nombre] = info;
            const enfermedades = info.enfermedades || null;
            const contenido = generarContenido(nombre, enfermedades);
            layer.setPopupContent(contenido).openPopup();
          })
          .catch(err => {
            console.error(err);
            layer.setPopupContent(`<b>${nombre}</b><br><em>Error al cargar datos.</em>`).openPopup();
          });
      }
    };

    layer.on('mouseover', () => {
      showPopup();
      layer.setStyle({ fillOpacity: 0.8, weight: 2, color: '#2980b9' });
    });

    layer.on('click', showPopup);

    layer.on('mouseout', () => {
      layer.setStyle({ fillOpacity: 0.6, weight: 1.5, color: '#2c3e50' });
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* 🩺 Caja de ayuda */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '12px 18px',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        fontSize: '15px',
        fontWeight: '600',
        color: '#34495e',
        maxWidth: '280px',
        userSelect: 'none'
      }}>
        🩺 Pasa el mouse por una alcaldía para ver los datos de salud
      </div>

      {/* 🧪 Filtros */}
      <div style={{
        position: 'absolute',
        top: 80,
        left: 10,
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '15px 20px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        fontSize: '15px',
        fontWeight: '600',
        color: '#34495e',
        maxWidth: '280px',
        userSelect: 'none'
      }}>
        <strong style={{ display: 'block', marginBottom: '10px', fontSize: '17px', color: '#2c3e50' }}>🧪 Filtros</strong>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={filtros.tuberculosis}
            onChange={() => setFiltros(f => ({ ...f, tuberculosis: !f.tuberculosis }))}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          Tuberculosis
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={filtros.vih}
            onChange={() => setFiltros(f => ({ ...f, vih: !f.vih }))}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          VIH
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={filtros.cancer}
            onChange={() => setFiltros(f => ({ ...f, cancer: !f.cancer }))}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          Cáncer
        </label>
      </div>

      {/* 🌍 Mapa principal */}
      <MapContainer center={[19.43, -99.13]} zoom={10} style={{ height: '90vh', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        {geoData && (
          <>
            <GeoJSON
              data={geoData}
              style={styleFeature}
              onEachFeature={onEachFeature}
            />
            <FitBounds geoData={geoData} />
            <Legend />
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default Maps;
