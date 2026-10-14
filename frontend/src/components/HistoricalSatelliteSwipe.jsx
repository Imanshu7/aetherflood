export function parsePolygonWkt(wkt) {
  if (typeof wkt !== 'string') return null;
  const match = wkt.trim().match(/^POLYGON\s*\(\((.+)\)\)$/i);
  if (!match) return null;
  const points = match[1].split(',').map((pair) => {
    const [longitude, latitude] = pair.trim().split(/\s+/).map(Number);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
  });
  return points.length >= 4 && points.every(Boolean) ? points : null;
}
