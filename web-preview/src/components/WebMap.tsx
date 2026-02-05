import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

import type { Event } from '../types';

type EventWithCoords = Event & {
  coordinates: { lat: number; lng: number };
};

type Props = {
  events: EventWithCoords[];
  onMarkerPress: (event: EventWithCoords) => void;
  isDark?: boolean;
};

const PAYS_DE_RETZ_CENTER: [number, number] = [47.1167, -2.1];

function InvalidateSizeOnMount() {
  const map = useMap();

  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 0);

    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);

  return null;
}

export default function WebMap({ events, onMarkerPress, isDark }: Props) {
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const attribution = isDark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const markerIcon = useMemo(
    () =>
      L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    []
  );

  const center: [number, number] =
    events.length > 0
      ? [events[0].coordinates.lat, events[0].coordinates.lng]
      : PAYS_DE_RETZ_CENTER;

  return (
    <View style={{ flex: 1 }}>
      <MapContainer
        center={center}
        zoom={10}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <InvalidateSizeOnMount />
        <TileLayer url={tileUrl} attribution={attribution} />

        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.coordinates.lat, event.coordinates.lng]}
            icon={markerIcon}
            eventHandlers={{
              click: () => onMarkerPress(event),
            }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{event.title}</div>
                <div style={{ opacity: 0.8, fontSize: 13 }}>{event.location}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </View>
  );
}
