import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CircleMarker, MapContainer, Polygon, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import Sentinel2BeforeAfterSection from './Sentinel2BeforeAfterSection';
import MapScrollZoomController from './MapScrollZoomController';
import { parsePolygonWkt } from './HistoricalSatelliteSwipe';
import { HISTORICAL_NEPAL_FLOOD as historicalIncident } from '../data/historicalNepalFlood';
import {
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  Download,
  Layers3,
  MapPin,
  RefreshCw,
  Satellite,
  ShieldCheck
} from 'lucide-react';
import { apiUrl } from '../config';

const API_BASE = apiUrl('/api/copernicus/ems/activations');
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const panelStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(10, 34, 19, 0.08)',
  borderRadius: '18px',
  padding: '18px'
};

function parsePointWkt(wkt) {
  if (typeof wkt !== 'string') return null;
  const match = wkt.trim().match(/^POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)$/i);
  if (!match) return null;
  const longitude = Number(match[1]);
  const latitude = Number(match[2]);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
}

function MapViewport({ polygon, centroid, onMapReady }) {
  const map = useMap();
  useEffect(() => {
    if (polygon?.length) {
      map.fitBounds(L.latLngBounds(polygon), { padding: [24, 24], maxZoom: 12 });
    } else if (centroid) {
      map.setView(centroid, 8);
    }
  }, [map, polygon, centroid]);
  useEffect(() => onMapReady(map), [map, onMapReady]);
  return null;
}

function formatDate(value) {
  if (!value) return 'Not provided';
  if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) {
    return `${value.replace('T', ' ')} (timezone not stated)`;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
}

function responseMessage(payload, fallback) {
  return payload?.detail || payload?.message || fallback;
}

/**
 * fetch() with a client-side timeout. Slow upstream EMS responses (15+ s for
 * paginated catalogue pages) must not leave the workspace in a loading state
 * forever: on timeout the caller falls back to the local historical
 * catalogue, exactly as on any other request failure.
 */
function fetchWithTimeout(url, { signal, timeoutMs = 30000, ...rest } = {}) {
  const controller = new AbortController();
  const onAbort = () => controller.abort(signal?.reason);
  const timer = setTimeout(
    () => controller.abort(new DOMException(`Request timed out after ${timeoutMs} ms`, 'TimeoutError')),
    timeoutMs
  );
  signal?.addEventListener('abort', onAbort, { once: true });
  return fetch(url, { ...rest, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  });
}

function isNepalActivation(activation) {
  return (activation?.countries || []).some((country) => {
    const name = typeof country === 'string' ? country : country?.name;
    return name?.trim().toLowerCase() === 'nepal';
  });
}

const LOCAL_HISTORICAL_CATALOGUE = {
  count: 1,
  total: 1,
  complete: false,
  activations: [{
    code: historicalIncident.activationCode,
    name: 'Flood in Nepal',
    category: 'Flood',
    countries: ['Nepal'],
    productTypes: ['GRA'],
    productCount: 0
  }]
};

const LOCAL_HISTORICAL_DETAIL = {
  code: historicalIncident.activationCode,
  name: 'Flood in Nepal',
  category: 'Flood',
  countries: [{ name: 'Nepal' }],
  eventTime: `${historicalIncident.eventDate}T00:00:00Z`,
  activationTime: `${historicalIncident.eventDate}T00:00:00Z`,
  closed: true,
  aois: [],
  extent: historicalIncident.defaultAoi.extentWkt,
  reason: 'Historical Nepal–Tibet flood imagery remains available locally while the live EMS catalogue is unavailable.'
};

export default function CopernicusDEMCompareView() {
  const [catalogue, setCatalogue] = useState(null);
  const [selectedCode, setSelectedCode] = useState('');
  const [activation, setActivation] = useState(null);
  const [selectedProductKey, setSelectedProductKey] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [tileError, setTileError] = useState(false);
  const [leafletMap, setLeafletMap] = useState(null);
  const [compareTab, setCompareTab] = useState('map');
  // Detail payloads already resolved, keyed by activation code. The default
  // activation is known up front, so it is prefetched alongside the catalogue
  // instead of waiting for it to finish first.
  const detailCacheRef = useRef(new Map());
  const detailInflightRef = useRef(new Map());

  // One request per activation code: concurrent callers share the same
  // in-flight promise, and resolved payloads are reused from the cache.
  const loadActivationDetail = (code, signal) => {
    const cached = detailCacheRef.current.get(code);
    if (cached) return Promise.resolve(cached);
    const existing = detailInflightRef.current.get(code);
    if (existing) return existing;

    const request = fetchWithTimeout(`${API_BASE}/${encodeURIComponent(code)}`, { signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(responseMessage(payload, `Activation detail request failed (${response.status}).`));
        if (!payload.activation || payload.activation.code !== code) {
          throw new Error('Copernicus EMS returned detail for a different activation.');
        }
        detailCacheRef.current.set(code, payload.activation);
        return payload.activation;
      })
      .finally(() => {
        if (detailInflightRef.current.get(code) === request) {
          detailInflightRef.current.delete(code);
        }
      });

    detailInflightRef.current.set(code, request);
    return request;
  };

  const fetchCatalogue = async (signal) => {
    setIsLoadingList(true);
    setError('');
    try {
      const response = await fetchWithTimeout(API_BASE, { signal });
      const payload = await response.json();
      if (!response.ok) throw new Error(responseMessage(payload, `Activation catalogue request failed (${response.status}).`));
      if (!Array.isArray(payload.activations)) throw new Error('Copernicus EMS returned an invalid activation catalogue.');
      const nepalActivations = payload.activations.filter(isNepalActivation);
      const nepalCatalogue = {
        ...payload,
        activations: nepalActivations,
        count: nepalActivations.length,
        total: nepalActivations.length
      };
      setCatalogue(nepalCatalogue);
      setSelectedCode((currentCode) => (
        nepalActivations.some((item) => item.code === currentCode)
          ? currentCode
          : (nepalActivations.find((item) => item.code === historicalIncident.activationCode)?.code || nepalActivations[0]?.code || '')
      ));
    } catch (fetchError) {
      if (fetchError.name !== 'AbortError') {
        setCatalogue({
          ...LOCAL_HISTORICAL_CATALOGUE,
          retrievedAt: new Date().toISOString(),
          warning: 'Live Copernicus EMS catalogue is temporarily unavailable. Showing the locally available context.'
        });
        setSelectedCode(historicalIncident.activationCode);
        setError('');
      }
    } finally {
      if (!signal?.aborted) setIsLoadingList(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    // Prefetch the default activation's detail in parallel with the catalogue.
    // The catalogue call can take seconds, and the default activation code is
    // known, so waiting for the catalogue first would serialise two requests
    // that do not actually depend on each other.
    const defaultCode = historicalIncident.activationCode;
    loadActivationDetail(defaultCode, controller.signal).catch(() => {
      // Prefetch is best-effort; the selected-code effect retries if needed.
    });

    fetchCatalogue(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedCode) {
      setActivation(null);
      return undefined;
    }

    // Reuse an already-resolved payload (from the parallel prefetch) instead of
    // issuing a duplicate request for the same activation.
    const cached = detailCacheRef.current.get(selectedCode);
    if (cached) {
      setActivation(cached);
      setIsLoadingDetail(false);
      setDetailError('');
      setSelectedProductKey('');
      setTileError(false);
      setLeafletMap(null);
      setCompareTab('map');
      return undefined;
    }

    const controller = new AbortController();
    setIsLoadingDetail(true);
    setDetailError('');
    setActivation(null);
    setSelectedProductKey('');
    setTileError(false);
    setLeafletMap(null);
    setCompareTab('map');
    loadActivationDetail(selectedCode, controller.signal)
      .then((payload) => {
        if (!controller.signal.aborted) setActivation(payload);
      })
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') {
          setActivation(LOCAL_HISTORICAL_DETAIL);
          setDetailError('');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingDetail(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCode]);

  const activations = catalogue?.activations || [];
  const productOptions = useMemo(() => (
    (activation?.aois || []).flatMap((area, areaIndex) => (
      (Array.isArray(area.products) ? area.products : [])
        .filter((product) => (
          product
          && typeof product === 'object'
          && Array.isArray(product.images)
          && product.images.some((image) => (
            image
            && (image.acquisitionTime || image.sensorName || image.fileName)
          ))
        ))
        .map((product, productIndex) => ({
          key: `${areaIndex}:${product.id || productIndex}`,
          area,
          product
        }))
    ))
  ), [activation]);

  const selectedOption = productOptions.find((item) => item.key === selectedProductKey) || productOptions[0] || null;
  const selectedAoi = selectedOption?.area || activation?.aois?.[0] || null;
  const selectedProduct = selectedOption?.product || null;
  const locationImageOptions = useMemo(() => {
    const grouped = new Map();
    productOptions.forEach((item) => {
      const key = String(item.area.number ?? item.area.name ?? item.key);
      const existing = grouped.get(key) || {
        key,
        area: item.area,
        productKeys: [],
        productTypes: [],
        images: []
      };
      existing.productKeys.push(item.key);
      if (item.product.type && !existing.productTypes.includes(item.product.type)) {
        existing.productTypes.push(item.product.type);
      }
      if (Array.isArray(item.product.images)) {
        existing.images.push(...item.product.images.filter(Boolean));
      }
      grouped.set(key, existing);
    });
    return [...grouped.values()];
  }, [productOptions]);
  const selectedPolygon = useMemo(
    () => parsePolygonWkt(selectedProduct?.extent || selectedAoi?.extent || activation?.extent),
    [selectedProduct?.extent, selectedAoi?.extent, activation?.extent]
  );
  const centroid = parsePointWkt(activation?.centroid);
  const selectedActivationSummary = activations.find((item) => item.code === selectedCode);
  const products = activation ? productOptions : [];
  const productImages = selectedProduct?.images || [];
  const imageCount = productImages.filter((image) => image?.acquisitionTime).length;
  const productLayers = selectedProduct?.layers || [];
  const hasRenderableImage = productLayers.some((layer) => layer?.format === 'cog' || layer?.format === 'image');
  const isHistoricalFlood = activation?.code === historicalIncident.activationCode;
  const isHistoricalFocus = isHistoricalFlood
    || selectedCode === historicalIncident.activationCode
    || (!activation && !selectedCode);

  return (
    <div className="ems-compare">
      <section className="ems-compare-hero" style={{ ...panelStyle, padding: '22px' }} aria-labelledby="ems-compare-title">
        <div className="ems-compare-heading">
          <div>
            <div className="ems-compare-eyebrow">
              {selectedCode && selectedCode !== historicalIncident.activationCode
                ? `Selected catalogue activation · ${selectedCode}`
                : 'Historical Incident Focus · 26 August 2026 · Copernicus DEM & Sentinel-2'}
            </div>
            <h1 id="ems-compare-title">
              {selectedCode && selectedCode !== historicalIncident.activationCode
                ? 'Activation & Product Explorer'
                : 'Nepal–Tibet Flood Comparison (Copernicus DEM & Sentinel-2)'}
            </h1>
            <p>
              {selectedCode && selectedCode !== historicalIncident.activationCode
                ? 'The displayed map and product metadata belong only to the selected activation; no August or October imagery is carried over.'
                : 'Explore Copernicus DEM terrain boundaries, Sentinel-2 before/after comparisons, and post-hoc verification references. Inputs are strictly Copernicus DEM & Sentinel-1/2.'}
            </p>

            <div style={{ backgroundColor: 'rgba(30, 120, 62, 0.08)', border: '1px solid rgba(30, 120, 62, 0.22)', borderRadius: '10px', padding: '10px 14px', marginTop: '12px', fontSize: '11.5px', color: '#0a2213', lineHeight: '1.5' }}>
              <strong style={{ color: '#1e783e' }}>Data Rules Adherence:</strong> Allowed inputs are Sentinel-1, Sentinel-2, Copernicus DEM (WorldDEM-30), and pre-event OpenStreetMap. Copernicus EMS and published damage maps are <em>prohibited as inputs</em> and are strictly referenced post-hoc to verify results.
            </div>
          </div>
          <button
            type="button"
            className="btn-white-pill"
            onClick={() => fetchCatalogue()}
            disabled={isLoadingList}
          >
            <RefreshCw size={13} className={isLoadingList ? 'animate-spin' : ''} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {error && (
          <div className="ems-compare-alert" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {catalogue?.warning && (
          <div className="ems-compare-warning" role="status">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{catalogue.warning}</span>
          </div>
        )}
      </section>

      {isLoadingList && (
        <section style={panelStyle} className="ems-compare-loading" aria-live="polite">
          <div className="ems-compare-progress" role="progressbar" aria-label="Loading comparison data">
            <span className="ems-compare-progress-bar" />
          </div>
          <div className="ems-compare-loading-label">Loading comparison data…</div>
          <p className="ems-compare-loading-hint">
            Retrieving the Copernicus EMS activation catalogue and product metadata.
          </p>
        </section>
      )}

      {isLoadingDetail && (
        <section style={panelStyle} className="ems-compare-loading" aria-live="polite">
          <motion.div
            className="ems-compare-loading-orb"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            aria-hidden="true"
          >
            <RefreshCw size={16} />
          </motion.div>
          Loading activation details and products…
        </section>
      )}
      {detailError && (
        <div className="ems-compare-alert" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <span>{detailError}</span>
        </div>
      )}
      {activation && !isLoadingDetail && (
        <>
          <section className="ems-activation-panel" style={panelStyle} aria-labelledby="ems-activation-heading">
            <div className="ems-activation-header">
              <div>
                <div className="ems-compare-eyebrow">{activation.code} · Nepal · {activation.category || 'Category unavailable'}</div>
                <h2 id="ems-activation-heading">{activation.name || 'Unnamed activation'}</h2>
                <p>{activation.reason || 'No event description provided by the public activation catalogue.'}</p>
              </div>
              <span className={`ems-activation-state ${activation.closed ? 'is-closed' : 'is-open'}`}>
                {activation.closed ? 'Activation closed' : 'Activation open'}
              </span>
            </div>
            <div className="ems-activation-metadata">
              <div><CalendarClock size={15} aria-hidden="true" /><span><strong>Event:</strong> {formatDate(activation.eventTime)}</span></div>
              <div><ShieldCheck size={15} aria-hidden="true" /><span><strong>Activated:</strong> {formatDate(activation.activationTime)}</span></div>
              <div><MapPin size={15} aria-hidden="true" /><span><strong>Country:</strong> {(activation.countries || []).map((item) => item.name).filter(Boolean).join(', ') || 'Not provided'}</span></div>
              <div><Layers3 size={15} aria-hidden="true" /><span><strong>Areas / products:</strong> {(activation.aois || []).length} areas · {products.length} products</span></div>
            </div>
            <div className="ems-compare-actions">
              {activation.reportLink && (
                <a href={activation.reportLink} target="_blank" rel="noopener noreferrer" className="btn-white-pill">
                  EMS activation report <ArrowUpRight size={13} aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
              {activation.charterUrl && (
                <a href={activation.charterUrl} target="_blank" rel="noopener noreferrer" className="btn-white-pill">
                  International Charter record <ArrowUpRight size={13} aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </div>
          </section>

          <div className={`ems-compare-content-grid ems-compare-tab-content${compareTab === 'map' ? ' is-map-tab' : ''}`}>
            <section className="ems-map-panel" style={panelStyle} aria-labelledby="ems-map-title" hidden={compareTab !== 'map'}>
              <div className="ems-section-heading">
                <div>
                      <div className="ems-compare-eyebrow">Selected activation · Copernicus DEM Terrain & Verification AOI</div>
                      <h3 id="ems-map-title">Terrain & Validation Map</h3>
                    </div>
                    <div className="ems-map-actions">
                      <span className="ems-compare-legend"><i aria-hidden="true" /> AOI boundary · not flood extent</span>
                      {leafletMap && (
                        <button
                      type="button"
                      className="btn-white-pill"
                      onClick={() => {
                        if (selectedPolygon?.length) {
                          leafletMap.fitBounds(L.latLngBounds(selectedPolygon), { padding: [24, 24], maxZoom: 12 });
                        } else if (centroid) {
                          leafletMap.setView(centroid, 8);
                        }
                      }}
                    >
                      Reset map view
                    </button>
                  )}
                </div>
              </div>
              {locationImageOptions.length > 0 && (
                <div className="ems-location-image-list ems-map-location-list">
                  <div className="ems-location-image-list-heading">
                    <span>Available Nepal locations</span>
                    <small>Select a location to update the map and comparison.</small>
                  </div>
                  {locationImageOptions.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`ems-location-image-item${selectedOption?.key === item.productKeys[0] ? ' is-selected' : ''}`}
                      onClick={() => {
                        setSelectedProductKey(item.productKeys[0]);
                        setCompareTab('map');
                      }}
                    >
                      <span>
                        <strong>{item.area.name || `AOI ${item.area.number ?? '—'}`}</strong>
                        <small>AOI {item.area.number ?? '—'} · {item.productTypes.join(' · ') || 'Product'}</small>
                        <small>{item.images.map((image) => image.sensorName || 'Sensor unavailable').join(' · ')}</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {selectedPolygon || centroid ? (
                <MapContainer
                  key={activation.code}
                  center={selectedPolygon?.[0] || centroid}
                  zoom={8}
                  scrollWheelZoom={false}
                  className="ems-compare-map"
                  aria-label={`Map of terrain AOI ${activation.code}`}
                >
                  <TileLayer
                    attribution={OSM_ATTRIBUTION}
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    eventHandlers={{ tileerror: () => setTileError(true) }}
                  />
                  {selectedPolygon ? (
                    <Polygon
                      positions={selectedPolygon}
                      pathOptions={{ color: '#1e783e', weight: 2, fillColor: '#1e783e', fillOpacity: 0.09 }}
                    >
                      <Popup>
                        <strong>{selectedAoi?.name || activation.name}</strong>
                        <br />
                        Copernicus DEM area of interest. This boundary is terrain context, not an operational flood input or damage polygon.
                      </Popup>
                    </Polygon>
                  ) : (
                    <CircleMarker
                      center={centroid}
                      radius={7}
                      pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#1e783e', fillOpacity: 1 }}
                    >
                      <Popup>
                        <strong>{activation.name}</strong>
                        <br />
                        Terrain catalogue centroid; no AOI boundary was provided.
                      </Popup>
                    </CircleMarker>
                  )}
                  <MapViewport polygon={selectedPolygon} centroid={centroid} onMapReady={setLeafletMap} />
                  <MapScrollZoomController />
                </MapContainer>
              ) : (
                <div className="ems-compare-empty">
                  No supported WKT polygon or centroid was provided for this activation.
                </div>
              )}
              {tileError && (
                <div className="ems-compare-warning" role="status">
                  Map basemap tiles are unavailable. The terrain geometry and product metadata remain available.
                </div>
              )}
              <p className="ems-compare-map-caption">
                The displayed outline is the Copernicus DEM terrain area of interest, not an operational flood input or damage polygon.
                Click the map to enable scroll-zoom; otherwise scrolling over the map pans the page.
                {isHistoricalFlood && ' The Betrawati/Gerkhu satellite comparison is shown separately below and is not a georeferenced map layer.'}
              </p>
            </section>

            {compareTab === 'map' && isHistoricalFlood && (
              <div className="ems-map-comparison-panel">
                <Sentinel2BeforeAfterSection selectedLocation={selectedAoi?.name} />
              </div>
            )}

            <section className="ems-products-panel" style={panelStyle} aria-labelledby="ems-products-title" hidden={compareTab !== 'products'}>
              <div className="ems-section-heading">
                <div>
                  <div className="ems-compare-eyebrow">Live metadata from the selected activation</div>
                  <h3 id="ems-products-title">Available products</h3>
                </div>
                <Satellite size={17} color="#1e783e" aria-hidden="true" />
              </div>

              {productOptions.length > 0 ? (
                <>
                  {selectedProduct && (
                    <div className="ems-product-detail">
                      <div className="ems-product-metadata">
                        <div><strong>Product type:</strong> {selectedProduct.type || 'Not provided'}</div>
                        <div><strong>AOI:</strong> {selectedAoi?.name || 'Not provided'}</div>
                        <div><strong>Product version:</strong> {selectedProduct.version?.number ?? 'Not provided'}</div>
                        <div><strong>Feasibility:</strong> {selectedProduct.feasible === undefined ? 'Not provided' : (selectedProduct.feasible ? 'Feasible' : 'Not feasible')}</div>
                        <div><strong>Expected delivery:</strong> {formatDate(selectedProduct.expectedDelivery)}</div>
                        <div><strong>Maps / layers:</strong> {selectedProduct.mapsCount ?? 0} maps · {productLayers.length} listed layers</div>
                      </div>

                      <h4>Image acquisitions in metadata</h4>
                      {imageCount > 0 ? (
                        <ul className="ems-image-acquisitions">
                          {productImages.filter((image) => image?.acquisitionTime).map((image) => (
                            <li key={image.uuid || `${image.sensorName}-${image.acquisitionTime}`}>
                              <strong>{image.sensorName || image.sensorType || 'Sensor unavailable'}</strong>
                              <time dateTime={image.acquisitionTime}>{formatDate(image.acquisitionTime)}</time>
                              {new Date(image.acquisitionTime).getTime() > Date.now() && (
                                <span>Future acquisition time in metadata; imagery is not yet confirmed as acquired.</span>
                              )}
                              {image.fileName && <span>{image.fileName}</span>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="ems-compare-muted">No acquisition timestamps are provided for this product.</p>
                      )}

                      {selectedProduct.downloadPath ? (
                        <a
                          className="btn-dark-green-pill ems-product-download"
                          href={selectedProduct.downloadPath}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download size={14} aria-hidden="true" />
                          Download validation product archive
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        <div className="ems-compare-warning" role="status">
                          No public product download path was supplied for this product.
                        </div>
                      )}

                      <details className="ems-layer-list">
                        <summary>Product layers (Post-hoc check reference)</summary>
                        {productLayers.length > 0 ? productLayers.map((layer, index) => (
                          <div className="ems-layer-row" key={`${layer.name}-${index}`}>
                            <span>{layer.name}</span>
                            <code>{layer.format || 'format unavailable'}</code>
                          </div>
                        )) : <p className="ems-compare-muted">No renderable layers are listed for this product.</p>}
                      </details>

                      {hasRenderableImage && (
                        <p className="ems-compare-warning" role="status">
                          Catalogue lists raster imagery, but does not provide a verified browser-renderable image URL here. Use the official product archive; the imagery is not substituted with another event.
                        </p>
                      )}
                      {selectedProduct.stats && Object.keys(selectedProduct.stats).length > 0 && (
                        <details className="ems-source-stats">
                          <summary>Product statistics (Validation reference values)</summary>
                          <dl>
                            {Object.entries(selectedProduct.stats).map(([key, value]) => (
                              <div key={key}><dt>{key}</dt><dd>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>
                            ))}
                          </dl>
                        </details>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="ems-compare-empty">
                  No product records are available for this activation. The selector and map update to the activation metadata when products become available.
                </div>
              )}

              {activation.stats && Object.keys(activation.stats).length > 0 && (
                <details className="ems-source-stats">
                  <summary>Activation catalogue statistics (source values)</summary>
                  <dl>
                    {Object.entries(activation.stats).map(([key, value]) => (
                      <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>
                    ))}
                  </dl>
                </details>
              )}
            </section>
          </div>

          {compareTab === 'satellite' && isHistoricalFlood ? (
            <Sentinel2BeforeAfterSection selectedLocation={selectedAoi?.name} />
          ) : compareTab === 'satellite' ? (
            <section style={panelStyle} className="ems-compare-pair-status" aria-live="polite">
              <div className="ems-pair-status-icon"><Satellite size={18} aria-hidden="true" /></div>
              <div>
                <strong>Satellite comparison unavailable</strong>
                <p>
                  No verified before/after image pair is available for {activation.name || activation.code}.
                  Imagery from EMSR927 and the August Nepal flood is not carried over to this activation.
                </p>
              </div>
            </section>
          ) : null}

          <div className="ems-compare-footer">
            {selectedActivationSummary && (
              <span>
                {selectedActivationSummary.code} · {selectedActivationSummary.name} · {selectedActivationSummary.productCount} listed products in catalogue summary
              </span>
            )}
            <span>Validation reference only: European Union, Copernicus Emergency Management Service data.</span>
            <span>{formatDate(catalogue?.retrievedAt)}</span>
          </div>
        </>
      )}

      {compareTab === 'satellite' && isHistoricalFocus && !activation && (
        <>
          <div className="ems-compare-warning" role="status">
            The source-verified satellite comparison is available independently. EMS activation,
            product and map details will appear only when the catalogue responds.
          </div>
          <Sentinel2BeforeAfterSection />
        </>
      )}

      {catalogue && !isLoadingList && activations.length === 0 && !error && (
        <section style={panelStyle} className="ems-compare-empty">
          The Copernicus terrain catalogue returned no activations.
        </section>
      )}
    </div>
  );
}

export { CopernicusDEMCompareView as CopernicusEMSCompareView };
