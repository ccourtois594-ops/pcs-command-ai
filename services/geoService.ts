
import { GeoPoint } from '../types';
import { MAP_CENTER } from '../constants';

// Fallback deterministic mock for offline usage or if API fails
const getFallbackCoordinates = (address: string): GeoPoint => {
  let hashX = 0;
  let hashY = 0;
  for (let i = 0; i < address.length; i++) {
    hashX = (hashX + address.charCodeAt(i) * 7) % 1000; 
    hashY = (hashY + address.charCodeAt(i) * 13) % 1000;
  }
  
  const offsetLat = ((hashX / 1000) - 0.5) * 0.04;
  const offsetLng = ((hashY / 1000) - 0.5) * 0.04;

  return { 
    lat: MAP_CENTER.lat + offsetLat, 
    lng: MAP_CENTER.lng + offsetLng 
  };
};

// Real Geocoding using French Government API (BAN - Base Adresse Nationale)
// This is significantly more reliable for French addresses than raw Nominatim without specific headers.
export const geocodeAddress = async (address: string): Promise<GeoPoint> => {
  if (!address) return MAP_CENTER;

  try {
    // Using API Adresse (data.gouv.fr)
    // This API is free, open, and requires no key for reasonable usage.
    const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`);
    
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const coords = data.features[0].geometry.coordinates;
      // Note: GeoJSON uses [longitude, latitude], so we swap them for our GeoPoint [lat, lng]
      return {
        lat: coords[1],
        lng: coords[0]
      };
    } else {
      console.warn("Address not found via API, using fallback.");
      return getFallbackCoordinates(address);
    }
  } catch (error) {
    console.error("Geocoding failed:", error);
    return getFallbackCoordinates(address);
  }
};

// Helper to calculate distance in KM (Haversine formula)
export const calculateDistance = (p1: GeoPoint, p2: GeoPoint): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(p2.lat - p1.lat);
  const dLon = deg2rad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(p1.lat)) * Math.cos(deg2rad(p2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
