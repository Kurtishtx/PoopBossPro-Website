import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Same-topic duplicate articles were merged into one (two pages on one topic compete with each
     other in search). Each removed article redirects permanently to the one that was kept. */
  async redirects() {
    return [
      { source: '/blogs/card-on-file-payments-pet-waste-software', destination: '/blogs/card-on-file-autopay-pet-waste-removal', permanent: true },
      { source: '/blogs/stop-chasing-payments-pet-waste-software', destination: '/blogs/card-on-file-autopay-pet-waste-removal', permanent: true },
      { source: '/blogs/pet-waste-mobile-app-for-scoopers', destination: '/blogs/pet-waste-removal-mobile-app-for-crews', permanent: true },
      { source: '/blogs/pet-waste-scaling-crews-software', destination: '/blogs/pet-waste-removal-scaling-crews-software', permanent: true },
    ];
  },
};

export default nextConfig;
