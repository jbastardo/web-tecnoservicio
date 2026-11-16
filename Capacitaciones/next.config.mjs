import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/capacitacion",
        destination: "/",
        permanent: false,
      },
      {
        source: "/capacitaciones",
        destination: "/",
        permanent: false,
      },
      {
        source: "/registro",
        destination: "/#registro-express",
        permanent: false,
      },
      {
        source: "/inscripcion",
        destination: "/#registro-express",
        permanent: false,
      },
      {
        source: "/inscripciones",
        destination: "/#registro-express",
        permanent: false,
      },
      {
        source: "/cursos",
        destination: "/",
        permanent: false,
      },
      {
        source: "/curso",
        destination: "/",
        permanent: false,
      },
      {
        source: "/login",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/encuesta",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
