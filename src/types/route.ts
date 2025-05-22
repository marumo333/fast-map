export interface TrafficInfo {
  duration_in_traffic: number;
  traffic_level: '混雑' | '通常';
}

export interface Route {
  routeId: number;
  path: [number, number][];
  distance: number;
  duration: number;
  duration_in_traffic: number;
  isTollRoad: boolean;
  trafficInfo: TrafficInfo[];
  tollFee?: number;
  estimatedTime?: number;
} 