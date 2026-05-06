const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'txsfdlgtfgcvpfmxzhdw.supabase.co',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;