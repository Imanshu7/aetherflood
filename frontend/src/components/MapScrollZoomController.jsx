import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Root cause fix for Leaflet scroll traps: with scrollWheelZoom left enabled,
 * every wheel event over the map zooms the map and the page can never scroll
 * past it. This controller keeps scroll-zoom OFF until the user explicitly
 * clicks/focuses the map, and turns it back off when the pointer leaves or
 * the map loses focus. Drag-pan, markers, popups, and custom zoom controls
 * keep working in both states.
 *
 * Usage: render inside a <MapContainer scrollWheelZoom={false}>.
 */
export default function MapScrollZoomController({ onAvailabilityChange }) {
  const map = useMap();
  useEffect(() => {
    map.scrollWheelZoom.disable();
    const container = map.getContainer();
    const enable = () => {
      map.scrollWheelZoom.enable();
      onAvailabilityChange?.(true);
    };
    const disable = () => {
      if (map.scrollWheelZoom.enabled()) {
        map.scrollWheelZoom.disable();
        onAvailabilityChange?.(false);
      }
    };
    container.addEventListener('click', enable);
    map.on('focus', enable);
    map.on('blur', disable);
    container.addEventListener('mouseleave', disable);
    return () => {
      container.removeEventListener('click', enable);
      map.off('focus', enable);
      map.off('blur', disable);
      container.removeEventListener('mouseleave', disable);
    };
  }, [map, onAvailabilityChange]);
  return null;
}
