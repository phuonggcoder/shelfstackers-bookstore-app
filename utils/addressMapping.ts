/**
 * Helper function to map Nominatim address to Vietnamese administrative units
 * Based on Nominatim response structure for Vietnam:
 * - province: city (e.g., "Thành phố Hồ Chí Minh")
 * - district: suburb (e.g., "Tân Thới Hiệp") 
 * - ward: city_district (e.g., "Phường Tân Thới Hiệp")
 */
export const mapNominatimAddress = (addr: any) => {
  if (!addr) return { province: null, district: null, ward: null };
  
  const province = addr.city || addr.state || addr.county || addr.region || null;
  
  // For district, prefer suburb but avoid duplication with ward
  let district = addr.suburb || addr.town || addr.county || null;
  if (district && addr.city_district && district === addr.city_district.replace(/^Phường\s+|^Xã\s+|^Thị trấn\s+/i, '')) {
    // If suburb matches city_district (without prefix), prefer other sources for district
    district = addr.town || addr.county || null;
  }
  
  // For ward, prefer city_district but fallback to suburb if needed
  const ward = addr.city_district || addr.village || addr.hamlet || addr.neighbourhood || null;
  
  return {
    province,
    district,
    ward
  };
};

/**
 * Normalize string for comparison (remove diacritics and convert to lowercase)
 */
export const normalizeString = (str: string): string => {
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
};

/**
 * Strip administrative prefixes from Vietnamese place names
 */
export const stripPrefixes = (s?: string | null) => {
  if (!s) return '';
  const stripPrefixes = s.replace(/^(phuong|xã|xa|thị trấn|thi tran|thị xã|thi xa|thanh pho|thành phố|tp|quận|quan|huyện|huye?n)\s*/i, '');
  return stripPrefixes.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};
