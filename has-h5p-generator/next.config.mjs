/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js gestiona estos paquetes externos y los incluye en el file tracing
  // de las funciones serverless de Vercel.
  serverExternalPackages: [
    'sharp',
    'edge-tts-universal',
    'msedge-tts',
    'ws',
    'isomorphic-ws',
    'jszip',
  ],
  // Fallbacks solo para dependencias Node que no deben entrar al bundle cliente.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        child_process: false,
        crypto: false,
        events: false,
        stream: false,
      };
    }
    return config;
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
