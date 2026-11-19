import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "printreadydesigns.in",
          },
        ],
        destination: "https://www.printreadydesigns.in/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "browserutilitystudio.com",
          },
        ],
        destination: "https://www.printreadydesigns.in/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.browserutilitystudio.com",
          },
        ],
        destination: "https://www.printreadydesigns.in/:path*",
        permanent: true,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    };

    if (isServer) {
      config.resolve.alias["onnxruntime-web"] = false;
    } else {
      config.resolve.alias["onnxruntime-web"] = path.resolve(
        __dirname,
        "node_modules/onnxruntime-web/dist/ort.all.min.js"
      );
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
