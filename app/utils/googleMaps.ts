import { Location } from '../types/location';

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

export const initializeGoogleMaps = async () => {
  const checkGoogleMaps = setInterval(async () => {
    if (window.google && window.google.maps) {
      clearInterval(checkGoogleMaps);
      try {
        const { Map, DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        return { Map, DirectionsService, DirectionsRenderer };
      } catch (error) {
        console.error('Google Maps APIの初期化に失敗:', error);
        throw error;
      }
    }
  }, 100);

  setTimeout(() => {
    clearInterval(checkGoogleMaps);
    throw new Error('Google Maps APIの初期化がタイムアウトしました');
  }, 10000);
};

export const createCustomMarker = (label: string, color: string) => {
  const div = document.createElement('div');
  div.style.width = '40px';
  div.style.height = '40px';
  div.style.backgroundColor = color;
  div.style.border = '4px solid #FFFFFF';
  div.style.borderRadius = '50%';
  div.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'center';
  div.style.position = 'relative';
  div.style.transition = 'all 0.3s ease';

  const innerCircle = document.createElement('div');
  innerCircle.style.width = '16px';
  innerCircle.style.height = '16px';
  innerCircle.style.backgroundColor = '#FFFFFF';
  innerCircle.style.borderRadius = '50%';
  innerCircle.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  div.appendChild(innerCircle);

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
  div.appendChild(labelElement);

  return div;
};

export const initializePlaceAutocomplete = async (
  inputRef: React.RefObject<HTMLInputElement>,
  onPlaceSelected: (place: google.maps.places.Place) => void
) => {
  if (!inputRef.current) return null;

  try {
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