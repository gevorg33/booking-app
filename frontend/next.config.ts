import type { NextConfig } from "next";

const lanHost = process.env.LAN_HOST;

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.10.10',
    ...(lanHost ? [lanHost] : []),
  ],
  // Hide dev indicator overlay (can get stuck in Capacitor iOS WebView).
  devIndicators: false,
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
    ];
  },
};

export default nextConfig;
