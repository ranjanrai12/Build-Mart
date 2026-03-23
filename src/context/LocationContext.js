import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          setLoading(false);
          return;
        }

        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        setLocation(loc.coords);

        // Reverse geocode to get city/area name
        const reverse = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (reverse && reverse.length > 0) {
          const main = reverse[0];
          setAddress(`${main.district || main.city || main.subregion}, ${main.region || main.isoCountryCode}`);
        }
      } catch (err) {
        setError('Could not fetch location');
        console.log('Location Error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  return (
    <LocationContext.Provider value={{ 
      location, 
      address, 
      loading, 
      error, 
      calculateDistance 
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
