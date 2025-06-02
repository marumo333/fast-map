import { Location } from '../types/location';

export const getAddressFromLocation = async (location: Location): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const checkGoogleMaps = setInterval(async () => {
      if (window.google && window.google.maps) {
        clearInterval(checkGoogleMaps);
        try {
          const { Geocoder } = await google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;
          const geocoder = new Geocoder();
          geocoder.geocode(
            { location },
            (
              results: google.maps.GeocoderResult[] | null,
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
        } catch (error) {
          console.error('Geocoderの初期化に失敗:', error);
          reject(error);
        }
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkGoogleMaps);
      reject(new Error('Google Maps APIの初期化がタイムアウトしました'));
    }, 10000);
  });
}; 