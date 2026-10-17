import { useEffect, useRef, useState } from 'react';

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
let mapsPromise;

function loadMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (!apiKey) return Promise.reject(new Error('Google Maps API key is not configured.'));
  if (!mapsPromise) mapsPromise = new Promise((resolve, reject) => {
    const callback = `freshFoldMapsReady${Date.now()}`;
    window[callback] = () => { resolve(window.google.maps); delete window[callback]; };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&callback=${callback}`;
    script.async = true; script.onerror = () => reject(new Error('Google Maps could not load.')); document.head.appendChild(script);
  });
  return mapsPromise;
}

async function reverseGeocodeWithoutKey(latitude, longitude) {
  const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
  if (!response.ok) throw new Error('Address lookup failed.');
  const place = await response.json();
  const address = [place.locality || place.city, place.principalSubdivision, place.postcode, place.countryName].filter(Boolean).join(', ');
  return { address, pincode: place.postcode || '' };
}

export default function LocationPicker({ value, onChange }) {
  const mapNode = useRef(null); const mapRef = useRef(null); const markerRef = useRef(null);
  const [message, setMessage] = useState(apiKey ? 'Click the map or use your current location.' : 'Add VITE_GOOGLE_MAPS_API_KEY to enable map pinning.');

  const selectLocation = async (maps, location) => {
    const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
    const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
    markerRef.current?.setMap(null);
    markerRef.current = new maps.Marker({ position: { lat, lng }, map: mapRef.current, draggable: true });
    mapRef.current.panTo({ lat, lng }); mapRef.current.setZoom(17); setMessage('Finding this address...');
    try {
      const { results } = await new maps.Geocoder().geocode({ location: { lat, lng } });
      const result = results[0];
      const postal = result?.address_components?.find((part) => part.types.includes('postal_code'))?.long_name;
      onChange({ latitude: lat, longitude: lng, detectedArea: result?.formatted_address || '', ...(postal ? { pincode: postal } : {}) });
      setMessage(result?.formatted_address || 'Location pin selected.');
    } catch { onChange({ latitude: lat, longitude: lng }); setMessage('Pin selected; enter the full address manually.'); }
    markerRef.current.addListener('dragend', (event) => selectLocation(maps, event.latLng));
  };

  useEffect(() => {
    if (!apiKey) return;
    loadMaps().then((maps) => {
      const center = value.latitude && value.longitude ? { lat: Number(value.latitude), lng: Number(value.longitude) } : { lat: 28.6139, lng: 77.2090 };
      mapRef.current = new maps.Map(mapNode.current, { center, zoom: value.latitude ? 17 : 10, streetViewControl: false, mapTypeControl: false });
      mapRef.current.addListener('click', (event) => selectLocation(maps, event.latLng));
      if (value.latitude && value.longitude) markerRef.current = new maps.Marker({ position: center, map: mapRef.current, draggable: true });
    }).catch((error) => setMessage(error.message));
  }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return setMessage('Location is not supported by this browser.');
    setMessage('Getting your current location...');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const location = { latitude: coords.latitude, longitude: coords.longitude };
      if (!apiKey) {
        try {
          setMessage('Current location found. Fetching its address...');
          const place = await reverseGeocodeWithoutKey(coords.latitude, coords.longitude);
          onChange({ ...location, detectedArea: place.address || '', ...(place.pincode ? { pincode: place.pincode } : {}) });
          setMessage(place.address || `GPS pin captured: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
        } catch {
          onChange(location);
          setMessage(`GPS pin captured: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}. Address lookup failed; verify the address below.`);
        }
        return;
      }
      try { const maps = await loadMaps(); selectLocation(maps, { lat: coords.latitude, lng: coords.longitude }); } catch (error) { onChange(location); setMessage(error.message); }
    }, () => setMessage('Location permission was denied.'));
  };

  return <div className="location-picker"><div className="location-heading"><div><b>Set exact pickup pin</b><small>{message}</small></div><button type="button" onClick={useCurrentLocation}>⌖ Use current location</button></div>{apiKey && <div className="google-map" ref={mapNode} />}{value.latitude && <a href={`https://www.google.com/maps?q=${value.latitude},${value.longitude}`} target="_blank" rel="noreferrer">View selected pin on Google Maps ↗</a>}</div>;
}
