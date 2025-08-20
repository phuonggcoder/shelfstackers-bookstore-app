export async function reverseGeocodeNominatim(lat: number, lng: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
    console.log('[osmService] reverseGeocodeNominatim request', { lat, lng, url });
    const res = await fetch(url, { headers: { 'User-Agent': 'shelfstackers-app/1.0 (youremail@example.com)' } });
    if (!res.ok) {
      console.warn('[osmService] Nominatim reverse failed', res.status);
      return null;
    }
    const data = await res.json();
    console.log('[osmService] reverseGeocodeNominatim response', data && { display_name: data.display_name, address: data.address });
    return data;
  } catch (e) {
    console.warn('[osmService] reverseGeocodeNominatim error', e);
    return null;
  }
}
