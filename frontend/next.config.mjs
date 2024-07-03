import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const config = {
  distDir: 'build',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

// if (process.env.NODE_ENV === 'production') {
//   config.output = 'export';
// }
export default config