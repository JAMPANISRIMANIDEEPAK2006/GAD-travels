import React, { useEffect, useState } from 'react'; import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet'; import { io } from 'socket.io-client'; import api, { BASE } from '../api.js';
export default function Track() {
  const { id } = useParams(), [bus, setBus] = useState(null), [line, setLine] = useState([]), [pos, setPos] = useState(null);
  useEffect(() => {
    api.get('/buses/' + id, { params: { date: new Date().toISOString().slice(0, 10) } }).then(async r => { setBus(r.data);
      const { fromLoc: a, toLoc: b } = r.data; setLine((await api.get('/geo/route', { params: { from: `${a.lat},${a.lng}`, to: `${b.lat},${b.lng}` } })).data.coords); });
    const s = io(BASE); s.emit('track', id); s.on('pos', setPos); return () => s.disconnect(); }, [id]);
  if (!bus) return <p className="center">Loading map…</p>;
  return <div className="wrap"><h2>Live tracking: {bus.name}</h2>
    <p>{pos ? `${Math.round(pos.progress * 100)}% of the journey done` : 'Waiting for the bus to share its location.'} <button className="btn sm" onClick={() => api.post(`/buses/${id}/track/start`)}>Start demo trip</button></p>
    <MapContainer center={[bus.fromLoc.lat, bus.fromLoc.lng]} zoom={7} style={{ height: 460, borderRadius: 12 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
      {line.length > 0 && <Polyline positions={line} color="#0b7a75" />}
      {[bus.fromLoc, bus.toLoc].map(p => <CircleMarker key={p.name} center={[p.lat, p.lng]} radius={7} color="#0f2a43"><Popup>{p.name}</Popup></CircleMarker>)}
      {pos && <CircleMarker center={[pos.lat, pos.lng]} radius={11} pathOptions={{ color: '#f2a900', fillOpacity: 1 }}><Popup>{bus.name}</Popup></CircleMarker>}
    </MapContainer></div>;
}
