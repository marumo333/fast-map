/// <reference types="@types/google.maps" />

export interface TrafficInfo {
  duration_in_traffic: number;
  traffic_level: '混雑' | '通常';
}

export interface RouteInfo {
  routeId: number;
  path: [number, number][];
  distance: number;
  duration: {
    driving: number | null;
    walking: number;
  };
  duration_in_traffic: number;
  isTollRoad: boolean;
  mode: 'driving' | 'walking';
  trafficInfo: {
    duration_in_traffic: number;
    traffic_level: string;
  }[];
  tollFee?: number;
  estimatedTime?: number;
}

export type Route = google.maps.DirectionsResult | RouteInfo; 