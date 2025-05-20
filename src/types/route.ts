export type Route = {
  routeId: number;
  path: [number, number][];
  distance: number;
  duration: number;
  isTollRoad: boolean;
  tollFee?: number;
  estimatedTime?: number;
}; 