import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Maps = () => {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch('/alcaldias.geojson') // Desde Flask o public/
      .then(res => res.json())
      .then(data => setGeoData(data));
  }, []);

  const onEachFeature = (feature, layer) => {
    const nombre = feature.properties.NOM_MUN;

    fetch(`/api/datos?alcaldia=${encodeURIComponent(nombre)}`)
      .then(res => res.json())
      .then(info => {
        layer.bindPopup(`<b>${nombre}</b><br>Dato: ${info.valor}`);
      });

    layer.on({
      mouseover: () => layer.setStyle({ fillOpacity: 0.7 }),
      mouseout: () => layer.setStyle({ fillOpacity: 0.4 }),
    });
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
