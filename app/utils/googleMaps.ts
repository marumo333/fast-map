interface GoogleMapsLibraries {
  Map: typeof google.maps.Map;
  DirectionsService: typeof google.maps.DirectionsService;
  DirectionsRenderer: typeof google.maps.DirectionsRenderer;
  Geocoder: typeof google.maps.Geocoder;
  PlacesService: typeof google.maps.places.PlacesService;
}

let isInitializing = false;
let initializationPromise: Promise<GoogleMapsLibraries> | null = null;

export const waitForGoogleMaps = async (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const checkGoogleMaps = setInterval(() => {
      if (window.google && window.google.maps) {
        clearInterval(checkGoogleMaps);
        resolve();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkGoogleMaps);
      reject(new Error('Google Maps APIの初期化がタイムアウトしました'));
    }, 10000);
  });
};

export const initializeGoogleMaps = async (): Promise<GoogleMapsLibraries> => {
  if (initializationPromise) {
    return initializationPromise;
  }

  if (isInitializing) {
    throw new Error('Google Maps APIの初期化が既に進行中です');
  }

  isInitializing = true;

  try {
    initializationPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Google Maps APIの初期化がタイムアウトしました'));
      }, 30000);

      if (typeof window === 'undefined') {
        clearTimeout(timeout);
        reject(new Error('ブラウザ環境でのみ実行可能です'));
        return;
      }

      if (!window.google?.maps) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geocoding&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;

        (window as any).initGoogleMaps = () => {
          clearTimeout(timeout);
          if (window.google?.maps) {
            resolve({
              Map: window.google.maps.Map,
              DirectionsService: window.google.maps.DirectionsService,
              DirectionsRenderer: window.google.maps.DirectionsRenderer,
              Geocoder: window.google.maps.Geocoder,
              PlacesService: window.google.maps.places.PlacesService
            });
          } else {
            reject(new Error('Google Maps APIの初期化に失敗しました'));
          }
        };

        document.head.appendChild(script);
      } else {
        clearTimeout(timeout);
        resolve({
          Map: window.google.maps.Map,
          DirectionsService: window.google.maps.DirectionsService,
          DirectionsRenderer: window.google.maps.DirectionsRenderer,
          Geocoder: window.google.maps.Geocoder,
          PlacesService: window.google.maps.places.PlacesService
        });
      }
    });

    return await initializationPromise;
  } catch (error) {
    initializationPromise = null;
    throw error;
  } finally {
    isInitializing = false;
  }
};

export const createCustomMarker = (label: string, color: string) => {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.width = '40px';
  container.style.height = '40px';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';

  // 波紋エフェクト用の要素
  const ripple = document.createElement('div');
  ripple.style.position = 'absolute';
  ripple.style.width = '100%';
  ripple.style.height = '100%';
  ripple.style.borderRadius = '50%';
  ripple.style.backgroundColor = color;
  ripple.style.opacity = '0.3';
  ripple.style.animation = 'ripple 2s infinite';
  container.appendChild(ripple);

  // 中心のマーカー
  const marker = document.createElement('div');
  marker.style.width = '20px';
  marker.style.height = '20px';
  marker.style.backgroundColor = color;
  marker.style.border = '3px solid #FFFFFF';
  marker.style.borderRadius = '50%';
  marker.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  container.appendChild(marker);

  // ラベル
  const labelElement = document.createElement('div');
  labelElement.style.position = 'absolute';
  labelElement.style.bottom = '-20px';
  labelElement.style.left = '50%';
  labelElement.style.transform = 'translateX(-50%)';
  labelElement.style.backgroundColor = '#FFFFFF';
  labelElement.style.padding = '2px 6px';
  labelElement.style.borderRadius = '4px';
  labelElement.style.fontSize = '12px';
  labelElement.style.whiteSpace = 'nowrap';
  labelElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  labelElement.textContent = label;
  container.appendChild(labelElement);

  // アニメーション用のスタイルを追加
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      0% {
        transform: scale(0.5);
        opacity: 0.3;
      }
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  return container;
};

export const initializePlaceAutocomplete = async (
  inputRef: React.RefObject<HTMLInputElement>,
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void
) => {
  if (!inputRef.current) return null;

  try {
    await waitForGoogleMaps();
    const { PlaceAutocompleteElement } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
    const placeAutocomplete = new PlaceAutocompleteElement({
      componentRestrictions: { country: 'jp' }
    });

    inputRef.current.parentNode?.insertBefore(
      placeAutocomplete,
      inputRef.current
    );

    placeAutocomplete.addEventListener('place_changed', () => {
      const place = placeAutocomplete.getPlace();
      onPlaceSelected(place);
    });

    return placeAutocomplete;
  } catch (error) {
    console.error('PlaceAutocompleteElementの初期化に失敗:', error);
    return null;
  }
}; 