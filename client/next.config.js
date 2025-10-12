/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Keep old paths working if the app still calls /api/public/*
      { source: '/api/public/:path*', destination: '/api/:path*' },
    ]
  },
}

module.exports = nextConfig


