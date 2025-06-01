declare namespace google.maps {
  interface PlacesLibrary {
    PlaceAutocompleteElement: {
      new(options?: PlaceAutocompleteElementOptions): PlaceAutocompleteElement;
    };
  }

  interface PlaceAutocompleteElementOptions {
    types?: string[];
    componentRestrictions?: { country: string };
    locationBias?: LatLngBounds | LatLng | LatLngLiteral;
    locationRestriction?: LatLngBounds | LatLng | LatLngLiteral;
    requestedLanguage?: string;
    requestedRegion?: string;
  }

  interface PlaceAutocompleteElement extends HTMLElement {
    setAttribute(name: string, value: string): void;
    addEventListener(type: string, listener: EventListener): void;
    getPlace(): google.maps.places.PlaceResult;
    componentRestrictions: { country: string } | null;
    locationBias?: LatLngBounds | LatLng | LatLngLiteral;
    locationRestriction?: LatLngBounds | LatLng | LatLngLiteral;
    name?: string;
    requestedLanguage?: string;
    requestedRegion?: string;
    types?: string[];
  }
} 