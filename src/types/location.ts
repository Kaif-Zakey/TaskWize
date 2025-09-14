export  default interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string; // e.g., "Supermarket", "Office"
  range?: number; // notification range in meters
}