declare namespace google.maps {
  interface PlacesLibrary {
    PlaceAutocompleteElement: {
      new(): PlaceAutocompleteElement;
    };
  }

  interface PlaceAutocompleteElement extends HTMLElement {
    setAttribute(name: string, value: string): void;
    addEventListener(type: string, listener: EventListener): void;
    getPlace(): google.maps.places.PlaceResult;
    componentRestrictions?: { country: string };
    locationBias?: google.maps.LatLngBounds | google.maps.LatLng | google.maps.LatLngLiteral;
    locationRestriction?: google.maps.LatLngBounds | google.maps.LatLng | google.maps.LatLngLiteral;
    name?: string;
    requestedLanguage?: string;
    requestedRegion?: string;
    types?: string[];
  }
} 