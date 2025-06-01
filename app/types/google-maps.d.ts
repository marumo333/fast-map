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
  }
} 