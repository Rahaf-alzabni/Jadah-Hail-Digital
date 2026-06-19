import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { pickPlace, type UIAttraction } from '@/lib/mappers';
import { fontBody, t } from '@/lib/locale';

const HAIL_CENTER: L.LatLngExpression = [27.5114, 41.6907];

function categoryColor(key: string): string {
  if (key === 'natural') return '#2E7D32';
  if (key === 'historical') return '#C4912A';
  if (key === 'cultural') return '#1565C0';
  return '#0E1C36';
}

function buildMarkerIcon(color: string, size = 14) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2.5px solid white;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(14,28,54,0.35);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function buildCityIcon(ar: boolean) {
  const label = ar ? 'حائل' : 'Hail';
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
      <div style="
        width:18px;height:18px;
        background:#0E1C36;
        border:3px solid #C4912A;
        border-radius:50%;
        box-shadow:0 2px 10px rgba(14,28,54,0.4);
      "></div>
      <span style="
        font-size:10px;font-weight:700;color:#0E1C36;
        background:white;padding:1px 6px;border-radius:6px;
        box-shadow:0 1px 4px rgba(0,0,0,0.15);
        white-space:nowrap;font-family:${fontBody(ar)};
      ">${label}</span>
    </div>`,
    iconSize: [40, 36],
    iconAnchor: [20, 9],
    popupAnchor: [0, -12],
  });
}

function popupHtml(place: UIAttraction, ar: boolean): string {
  const p = pickPlace(place, ar);
  const dir = ar ? 'rtl' : 'ltr';
  const font = fontBody(ar);
  const viewLabel = t(ar, 'عرض التفاصيل', 'View details');
  return `
    <div dir="${dir}" style="font-family:${font};min-width:160px;">
      <p style="margin:0 0 4px;font-weight:700;color:#0E1C36;font-size:13px;">${p.name}</p>
      <p style="margin:0 0 4px;color:#7A6B55;font-size:11px;">${p.cat}</p>
      <p style="margin:0 0 8px;color:#7A6B55;font-size:11px;">${p.hours}</p>
      <a href="#" data-place-id="${place.id}" style="
        color:#C4912A;font-size:11px;font-weight:600;text-decoration:none;
      ">${viewLabel} →</a>
    </div>
  `;
}

export interface HailMapProps {
  ar: boolean;
  attractions: UIAttraction[];
  className?: string;
  /** Single-place focus for detail pages */
  focusPlaceId?: number;
  /** Called when user clicks a marker or popup link */
  onPlaceSelect?: (id: number) => void;
  /** Highlight a marker (e.g. from list hover) */
  highlightId?: number | null;
}

export function HailMap({
  ar,
  attractions,
  className = '',
  focusPlaceId,
  onPlaceSelect,
  highlightId,
}: HailMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const cityMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: HAIL_CENTER,
      zoom: focusPlaceId ? 11 : 8,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    L.control.scale({
      imperial: false,
      metric: true,
      position: ar ? 'bottomleft' : 'bottomright',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      cityMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();
    cityMarkerRef.current?.remove();
    cityMarkerRef.current = null;

    attractions.forEach((place) => {
      const color = categoryColor(place.categoryKey);
      const isFocus = focusPlaceId === place.id;
      const isHighlight = highlightId === place.id;
      const size = isFocus || isHighlight ? 18 : 14;

      const marker = L.marker([place.latitude, place.longitude], {
        icon: buildMarkerIcon(color, size),
        zIndexOffset: isFocus || isHighlight ? 1000 : 0,
      });

      marker.bindPopup(popupHtml(place, ar), { maxWidth: 240, className: 'hail-map-popup' });

      marker.on('popupopen', () => {
        const popup = marker.getPopup()?.getElement();
        const link = popup?.querySelector('[data-place-id]') as HTMLAnchorElement | null;
        if (link && onPlaceSelect) {
          link.onclick = (e) => {
            e.preventDefault();
            onPlaceSelect(place.id);
          };
        }
      });

      if (onPlaceSelect) {
        marker.on('click', () => onPlaceSelect(place.id));
      }

      marker.addTo(map);
      markersRef.current.set(place.id, marker);
    });

    if (!focusPlaceId) {
      cityMarkerRef.current = L.marker(HAIL_CENTER, { icon: buildCityIcon(ar), zIndexOffset: 500 })
        .bindPopup(`<div dir="${ar ? 'rtl' : 'ltr'}" style="font-family:${fontBody(ar)};font-weight:700;color:#0E1C36;">${t(ar, 'مدينة حائل', 'Hail City')}</div>`)
        .addTo(map);
    }

    if (focusPlaceId) {
      const focus = attractions.find((a) => a.id === focusPlaceId);
      if (focus) {
        map.setView([focus.latitude, focus.longitude], 12, { animate: false });
      }
    } else if (attractions.length > 0) {
      const bounds = L.latLngBounds(attractions.map((a) => [a.latitude, a.longitude] as L.LatLngExpression));
      bounds.extend(HAIL_CENTER);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 10 });
    } else {
      map.setView(HAIL_CENTER, 9, { animate: false });
    }

    requestAnimationFrame(() => map.invalidateSize());
  }, [attractions, ar, focusPlaceId, highlightId, onPlaceSelect]);

  useEffect(() => {
    if (highlightId == null || !mapRef.current) return;
    const marker = markersRef.current.get(highlightId);
    if (marker) {
      marker.openPopup();
      mapRef.current.panTo(marker.getLatLng(), { animate: true });
    }
  }, [highlightId]);

  return (
    <div
      ref={containerRef}
      className={`hail-map-container w-full h-full ${className}`}
      aria-label={t(ar, 'خريطة منطقة حائل', 'Hail region map')}
    />
  );
}
