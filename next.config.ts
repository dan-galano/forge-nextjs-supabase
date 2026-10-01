import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the dev badge clear of the sidebar's account menu.
  devIndicators: { position: "bottom-right" },
  // Let the dev server be opened from other devices on the LAN, not just localhost.
  allowedDevOrigins: ["10.32.1.129"],
};

export default nextConfig;
