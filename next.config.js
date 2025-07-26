/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // nếu bạn dùng <Image />
  },
};

module.exports = nextConfig;
