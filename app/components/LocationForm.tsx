import { useState, useEffect, useRef } from 'react';
import { useLocation } from '../contexts/LocationContext';
import { useRouter } from 'next/navigation';

export default function LocationForm() {
  const { currentLocation, setCurrentLocation, destination, setDestination } = useLocation();
  const [currentAddress, setCurrentAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (currentLocation) {
      // 現在地の住所を取得
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: currentLocation.lat, lng: currentLocation.lng } },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            setCurrentAddress(results[0].formatted_address);
          }
        }
      );
    }
  }, [currentLocation]);

  useEffect(() => {
    if (destination) {
      // 目的地の住所を取得
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: destination.lat, lng: destination.lng } },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            setDestinationAddress(results[0].formatted_address);
          }
        }
      );
    }
  }, [destination]);

  const handleGetLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('お使いのブラウザは位置情報をサポートしていません。');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('現在地を取得しました:', { lat: latitude, lng: longitude });
        
        // 現在地の住所を取得
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            if (status === 'OK' && results && results[0]) {
              setCurrentAddress(results[0].formatted_address);
            }
          }
        );

        setCurrentLocation({ lat: latitude, lng: longitude });
        setIsLoading(false);
      },
      (error) => {
        console.error('位置情報の取得に失敗:', error);
        setError('位置情報の取得に失敗しました。');
        setIsLoading(false);
      }
    );
  };

  const handleCurrentLocationSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setCurrentLocation({ lat, lng });
        setCurrentAddress(place.formatted_address || '');
      }
    }
  };

  const handleDestinationSelect = () => {
    if (destinationAutocompleteRef.current) {
      const place = destinationAutocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setDestination({ lat, lng });
        setDestinationAddress(place.formatted_address || '');
      }
    }
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700">現在地</label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            value={currentAddress}
            onChange={(e) => setCurrentAddress(e.target.value)}
            onBlur={handleCurrentLocationSelect}
            ref={(input) => {
              if (input && !autocompleteRef.current) {
                autocompleteRef.current = new google.maps.places.Autocomplete(input, {
                  types: ['address'],
                  componentRestrictions: { country: 'jp' }
                });
              }
            }}
            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="現在地を入力"
          />
          <button
            onClick={handleGetLocation}
            disabled={isLoading}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoading ? '取得中...' : '現在地を取得'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">目的地</label>
        <div className="mt-1">
          <input
            type="text"
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.target.value)}
            onBlur={handleDestinationSelect}
            ref={(input) => {
              if (input && !destinationAutocompleteRef.current) {
                destinationAutocompleteRef.current = new google.maps.places.Autocomplete(input, {
                  types: ['address'],
                  componentRestrictions: { country: 'jp' }
                });
              }
            }}
            className="block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="目的地を入力"
          />
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
    </div>
  );
} 