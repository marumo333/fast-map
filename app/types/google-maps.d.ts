/// <reference types="@types/google.maps" />

declare namespace google.maps {
  interface MapsLibrary {
    Map: typeof google.maps.Map;
  }

  interface RoutesLibrary {
    DirectionsService: typeof google.maps.DirectionsService;
    DirectionsRenderer: typeof google.maps.DirectionsRenderer;
  }

  interface PlacesLibrary {
    PlaceAutocompleteElement: {
      new(options?: PlaceAutocompleteElementOptions): PlaceAutocompleteElement;
    };
  }

  interface GeocodingLibrary {
    Geocoder: typeof google.maps.Geocoder;
  }

  interface PlaceAutocompleteElementOptions {
    types?: string[];
    componentRestrictions?: { country: string };
    locationBias?: google.maps.LatLngBounds | google.maps.LatLng | google.maps.LatLngLiteral;
    locationRestriction?: google.maps.LatLngBounds | google.maps.LatLng | google.maps.LatLngLiteral;
    requestedLanguage?: string;
    requestedRegion?: string;
  }

  interface PlaceAutocompleteElement extends HTMLElement {
    setAttribute(name: string, value: string): void;
    addEventListener(type: string, listener: (event: Event) => void): void;
    getPlace(): google.maps.places.PlaceResult;
    componentRestrictions: { country: string } | null;
    locationBias: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral | google.maps.Circle | google.maps.CircleLiteral | null;
    locationRestriction: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral | google.maps.Circle | google.maps.CircleLiteral | null;
    name?: string;
    requestedLanguage?: string;
    requestedRegion?: string;
    types?: string[];
  }
}

declare global {
  interface Window {
    google?: typeof google;
    initGoogleMaps: () => void;
  }
} 