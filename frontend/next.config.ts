import type { NextConfig } from "next";

const lanHost = process.env.LAN_HOST;

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.10.10',
    ...(lanHost ? [lanHost] : []),
  ],
  // Hide dev indicator overlay (can get stuck in Capacitor iOS WebView).
  devIndicators: false,
};

export default nextConfig;
