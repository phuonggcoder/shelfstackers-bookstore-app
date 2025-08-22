# Address Mapping for Vietnam

## Overview

This document explains how we map Nominatim address data to Vietnamese administrative units (province, district, ward).

## Nominatim Response Structure for Vietnam

Nominatim returns address data in the following structure for Vietnam:

```json
{
  "display_name": "Trần Thị Bảy, Tân Thới Hiệp, Phường Tân Thới Hiệp, Thành phố Hồ Chí Minh, 71716, Việt Nam",
  "address": {
    "ISO3166-2-lvl4": "VN-SG",
    "city": "Thành phố Hồ Chí Minh",
    "city_district": "Phường Tân Thới Hiệp",
    "country": "Việt Nam",
    "country_code": "vn",
    "postcode": "71716",
    "road": "Trần Thị Bảy",
    "suburb": "Tân Thới Hiệp"
  }
}
```

## Mapping Logic

### Province (Tỉnh/Thành phố)
- **Primary source**: `address.city`
- **Fallback sources**: `address.state`, `address.county`, `address.region`
- **Example**: `"city": "Thành phố Hồ Chí Minh"` → province = "Thành phố Hồ Chí Minh"

### District (Quận/Huyện)
- **Primary source**: `address.suburb`
- **Fallback sources**: `address.town`, `address.county`
- **Note**: Avoids duplication with ward by checking if suburb matches city_district (without prefix)
- **Example**: `"suburb": "Tân Thới Hiệp"` → district = "Tân Thới Hiệp"

### Ward (Phường/Xã)
- **Primary source**: `address.city_district`
- **Fallback sources**: `address.village`, `address.hamlet`, `address.neighbourhood`
- **Example**: `"city_district": "Phường Tân Thới Hiệp"` → ward = "Phường Tân Thới Hiệp"

## Usage

```typescript
import { mapNominatimAddress } from '../utils/addressMapping';

// From Nominatim response
const nominatimResponse = {
  address: {
    city: "Thành phố Hồ Chí Minh",
    suburb: "Tân Thới Hiệp", 
    city_district: "Phường Tân Thới Hiệp"
  }
};

const { province, district, ward } = mapNominatimAddress(nominatimResponse.address);

console.log(province); // "Thành phố Hồ Chí Minh"
console.log(district); // "Tân Thới Hiệp"
console.log(ward);     // "Phường Tân Thới Hiệp"
```

## Important Notes

1. **Data Consistency**: Nominatim data may not always be consistent. The mapping uses fallback sources to handle variations.

2. **Prefix Handling**: Vietnamese administrative units often include prefixes like "Phường", "Quận", "Thành phố". These are preserved in the mapping.

3. **Normalization**: For comparison purposes, use the `normalizeString` and `stripPrefixes` utility functions.

4. **Error Handling**: The function returns `null` for any field that cannot be mapped.

## Components Using This Mapping

- `app/add-address.tsx` - Main address form
- `components/AddressSelector.tsx` - Address selection component  
- `app/address-detail.tsx` - Detailed address input page
