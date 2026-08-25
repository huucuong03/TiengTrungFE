const nextConfig = {
  allowedDevOrigins: [
    '127.0.0.1',
    '*.ngrok-free.dev',
    '*.ngrok-free.app',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
  // Tự động chuyển tiếp các request /api/... về backend port 8000
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://tiengtrung-7hto.onrender.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;