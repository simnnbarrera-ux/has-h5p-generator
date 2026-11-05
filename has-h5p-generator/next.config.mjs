/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nivel 1: Next.js serverExternalPackages (requerido para Edge Neural TTS WebSockets y Sharp)
  serverExternalPackages: [
    'sharp',
    'edge-tts-universal',
    'msedge-tts',
    'ws',
    'isomorphic-ws',
    'jszip',
  ],
  // Nivel 2: Webpack externals directos (refuerzo obligatorio para evitar empaquetado de ws)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        'sharp',
        'ws',
        'isomorphic-ws',
        'edge-tts-universal',
        'msedge-tts',
      ];
    } else {
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
