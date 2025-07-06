import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Maps = () => {
  const [geoData, setGeoData] = useState(null);
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

  const onEachFeature = (feature, layer) => {
    const nombre = feature.properties.NOM_MUN;

    const showPopup = () => {
      if (infoCache.current[nombre]) {
        const data = infoCache.current[nombre];
        if (!data.enfermedades) {
          layer.bindPopup(`<b>${nombre}</b><br>No hay datos disponibles.`).openPopup();
        } else {
          layer.bindPopup(
            `<b>${nombre}</b><br>
            Diabetes: ${data.enfermedades.diabetes}<br>
            Hipertensión: ${data.enfermedades.hipertension}<br>
            Asma: ${data.enfermedades.asma}`
          ).openPopup();
        }
      } else {
        fetch(`http://localhost:5000/api/datos?alcaldia=${encodeURIComponent(nombre)}`)
          .then(res => {
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return res.json();
          })
          .then(info => {
            infoCache.current[nombre] = info;
            if (!info.enfermedades) {
              layer.bindPopup(`<b>${nombre}</b><br>No hay datos disponibles.`).openPopup();
            } else {
              layer.bindPopup(
                `<b>${nombre}</b><br>
                Diabetes: ${info.enfermedades.diabetes}<br>
                Hipertensión: ${info.enfermedades.hipertension}<br>
                Asma: ${info.enfermedades.asma}`
              ).openPopup();
            }
          })
          .catch(err => {
            console.error(err);
            layer.bindPopup(`<b>${nombre}</b><br>Error al cargar datos.`).openPopup();
          });
      }
    };

    layer.on('mouseover', showPopup);
    layer.on('click', showPopup);

    layer.on('mouseover', () => layer.setStyle({ fillOpacity: 0.7 }));
    layer.on('mouseout', () => layer.setStyle({ fillOpacity: 0.4 }));
  };

  return (
    <MapContainer center={[19.43, -99.13]} zoom={10} style={{ height: '90vh', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {geoData && (
        <GeoJSON
          data={geoData}
          style={{ color: '#333', weight: 1, fillOpacity: 0.4 }}
          onEachFeature={onEachFeature}
        />
      )}
    </MapContainer>
  );
};

export default Maps;
