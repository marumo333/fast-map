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

export const initializePlaceAutocomplete = async (
  inputRef: React.RefObject<HTMLInputElement>,
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void
): Promise<google.maps.PlaceAutocompleteElement | null> => {
  try {
    await waitForGoogleMaps();
    const { PlaceAutocompleteElement } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

    if (inputRef.current) {
      const placeAutocomplete = new PlaceAutocompleteElement({
        componentRestrictions: { country: 'jp' }
      });

      inputRef.current.parentNode?.insertBefore(
        placeAutocomplete,
        inputRef.current
      );

      placeAutocomplete.addEventListener('place_changed', () => {
        const place = placeAutocomplete.getPlace();
        if (place.geometry?.location) {
          onPlaceSelected(place);
        }
      });

      return placeAutocomplete as unknown as google.maps.PlaceAutocompleteElement;
    }
  } catch (error) {
    console.error('PlaceAutocompleteElementの初期化に失敗:', error);
  }
  return null;
}; 