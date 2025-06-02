import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from '../contexts/LocationContext';
import { useRouter } from 'next/navigation';

// TODO: 2025年3月以降の移行計画
// 1. google.maps.places.Autocomplete から google.maps.places.PlaceAutocompleteElement への移行
// 2. google.maps.Marker から google.maps.marker.AdvancedMarkerElement への移行
// 参考: https://developers.google.com/maps/documentation/javascript/places-autocomplete-migration
// 参考: https://developers.google.com/maps/documentation/javascript/markers-migration

export default function LocationForm() {
  const { currentLocation, setCurrentLocation, destination, setDestination } = useLocation();
  const [currentAddress, setCurrentAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const currentLocationInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const currentLocationAutocompleteRef = useRef<google.maps.PlaceAutocompleteElement | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.PlaceAutocompleteElement | null>(null);

  const getAddressFromLocation = useCallback(async (location: { lat: number; lng: number }) => {
    return new Promise<string>((resolve, reject) => {
      // Google Maps APIが読み込まれるのを待つ
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps);
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location },
            (
              results: google.maps.GeocoderResult[],
              status: google.maps.GeocoderStatus
            ) => {
              if (status === 'OK' && results && results[0]) {
                resolve(results[0].formatted_address);
              } else {
                console.error('住所の取得に失敗:', status);
                reject(new Error(`住所の取得に失敗しました: ${status}`));
              }
            }
          );
        }
      }, 100);

      // タイムアウト処理
      setTimeout(() => {
        clearInterval(checkGoogleMaps);
        reject(new Error('Google Maps APIの初期化がタイムアウトしました'));
      }, 10000);
    });
  }, []);

  // 現在地の住所を取得
  useEffect(() => {
    if (currentLocation && !currentAddress) {
      getAddressFromLocation(currentLocation).then(address => {
        setCurrentAddress(address);
      });
    }
  }, [currentLocation, currentAddress, getAddressFromLocation]);

  // 目的地の住所を取得
  useEffect(() => {
    if (destination && !destinationAddress) {
      getAddressFromLocation(destination).then(address => {
        setDestinationAddress(address);
      });
    }
  }, [destination, destinationAddress, getAddressFromLocation]);

  useEffect(() => {
    const initPlaceAutocomplete = async () => {
      try {
        const { PlaceAutocompleteElement } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

        if (currentLocationInputRef.current && !currentLocationAutocompleteRef.current) {
          const placeAutocomplete = new PlaceAutocompleteElement({
            types: ['address'],
            componentRestrictions: { country: 'jp' }
          });
          
          currentLocationInputRef.current.parentNode?.insertBefore(
            placeAutocomplete,
            currentLocationInputRef.current
          );

          placeAutocomplete.addEventListener('place_changed', () => {
            const place = placeAutocomplete.getPlace();
            if (place.geometry?.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const newLocation = { lat, lng };
              setCurrentLocation(newLocation);
              setCurrentAddress(place.formatted_address || '');
            }
          });

          currentLocationAutocompleteRef.current = placeAutocomplete as unknown as google.maps.PlaceAutocompleteElement;
        }

        if (destinationInputRef.current && !destinationAutocompleteRef.current) {
          const placeAutocomplete = new PlaceAutocompleteElement({
            types: ['address'],
            componentRestrictions: { country: 'jp' }
          });
          
          destinationInputRef.current.parentNode?.insertBefore(
            placeAutocomplete,
            destinationInputRef.current
          );

          placeAutocomplete.addEventListener('place_changed', () => {
            const place = placeAutocomplete.getPlace();
            if (place.geometry?.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const newLocation = { lat, lng };
              setDestination(newLocation);
              setDestinationAddress(place.formatted_address || '');
            }
          });

          destinationAutocompleteRef.current = placeAutocomplete as unknown as google.maps.PlaceAutocompleteElement;
        }
      } catch (error) {
        console.error('PlaceAutocompleteElementの初期化に失敗:', error);
      }
    };

    initPlaceAutocomplete();
  }, [setCurrentLocation, setDestination]);

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
        
        const newLocation = { lat: latitude, lng: longitude };
        setCurrentLocation(newLocation);

        try {
          const address = await getAddressFromLocation(newLocation);
          console.log('現在地の住所を取得:', address);
          setCurrentAddress(address);
        } catch (error) {
          console.error('現在地の住所取得に失敗:', error);
          setCurrentAddress('住所を取得できませんでした');
        }

        setIsLoading(false);
      },
      (error) => {
        console.error('位置情報の取得に失敗:', error);
        setError('位置情報の取得に失敗しました。');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
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
            ref={currentLocationInputRef}
            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="現在地を入力"
            disabled={!!currentLocation}
          />
          <button
            onClick={handleGetLocation}
            disabled={isLoading || !!currentLocation}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isLoading ? '取得中...' : '現在地を取得'}
          </button>
        </div>
        {currentLocation && (
          <p className="mt-1 text-sm text-gray-500">
            現在地が設定されています
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">目的地</label>
        <div className="mt-1">
          <input
            type="text"
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.target.value)}
            ref={destinationInputRef}
            className="block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="目的地を入力"
          />
        </div>
        {destination && (
          <p className="mt-1 text-sm text-gray-500">
            目的地が設定されています
          </p>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
    </div>
  );
} 