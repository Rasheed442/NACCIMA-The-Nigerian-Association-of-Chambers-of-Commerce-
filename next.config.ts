// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/media-proxy/:path*',
        destination: 'https://mediaserver.advancedtechnologypark.com/media/:path*',
      },
    ];
  },
};
module.exports = nextConfig;