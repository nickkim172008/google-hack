import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Leaflet maps are incompatible with StrictMode's dev double-mount:
  // react-leaflet layers added after mount (heat circles, route polylines)
  // can bind to the destroyed first map instance and crash on getPane().
  // The demo runs `npm run dev`, so this must stay off.
  reactStrictMode: false,
};

export default nextConfig;
