import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Job } from '../../types';

interface JobMapProps {
  jobs: Job[];
  onSelectJob?: (job: Job) => void;
}

export const JobMap: React.FC<JobMapProps> = ({ jobs, onSelectJob }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix default marker icon issues in bundled Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Default center around Roorkee / Haridwar area
    const defaultCenter: [number, number] = [29.8543, 77.8880];

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(defaultCenter, 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const markers: L.Marker[] = [];

    jobs.forEach((job) => {
      const lat = job.latitude || 29.8543 + (Math.random() - 0.5) * 0.08;
      const lng = job.longitude || 77.8880 + (Math.random() - 0.5) * 0.08;

      const marker = L.marker([lat, lng]).addTo(map);
      
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans text-slate-900';
      popupContent.innerHTML = `
        <h4 style="font-weight: 700; margin: 0 0 4px 0; color: #1e1b4b; font-size: 14px;">${job.title}</h4>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #4338ca; font-weight: 600;">${job.profession} • ${job.location}</p>
        <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #059669;">₹${job.salary_min.toLocaleString()} - ₹${job.salary_max.toLocaleString()}</p>
        <p style="margin: 0; font-size: 11px; color: #64748b;">${job.job_type} • ${job.remote_or_onsite}</p>
      `;

      marker.bindPopup(popupContent);
      markers.push(marker);
    });

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    }

    return () => {
      // clean up markers if needed
    };
  }, [jobs]);

  return (
    <div className="w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />
    </div>
  );
};

