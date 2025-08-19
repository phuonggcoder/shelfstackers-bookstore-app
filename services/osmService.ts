export async function reverseGeocodeNominatim(lat: number, lng: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'shelfstackers-app/1.0 (youremail@example.com)' } });
    if (!res.ok) {
      console.warn('Nominatim reverse failed', res.status);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (e) {
    console.warn('reverseGeocodeNominatim error', e);
    return null;
  }
}
