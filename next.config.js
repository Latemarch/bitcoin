/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // cz-shortcut-listen 속성 무시 설정
  webpack: (config) => {
    config.module.rules.push({
      test: /\.html$/,
      loader: 'html-loader',
      options: {
        attributes: {
          ignore: ['cz-shortcut-listen'],
        },
      },
    });
    return config;
  },
};

module.exports = nextConfig;
