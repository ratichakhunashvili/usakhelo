// Swap the tile provider here. The default is the public OpenStreetMap tile
// server, which is fine for a prototype but NOT for production traffic – see
// https://operations.osmfoundation.org/policies/tiles/ and use a hosted
// provider (Stadia, MapTiler, Thunderforest, a self-hosted server…) instead.
export const MAP_CONFIG = {
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  maxZoom: 19,
  initialZoom: 12,
  focusZoom: 15,
};
