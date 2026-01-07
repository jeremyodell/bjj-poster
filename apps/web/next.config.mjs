/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow local images (templates stored in public folder)
    unoptimized: false,
    // Remote patterns for future CDN/API images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
    ],
  },
};

export default nextConfig;
