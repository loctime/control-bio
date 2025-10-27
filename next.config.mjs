/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuración para desarrollo
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Configuración para Hot Module Replacement
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  // Configuración del servidor de desarrollo
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  // Configuración de Turbopack para evitar el error
  turbopack: {},
}

export default nextConfig
