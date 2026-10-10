/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to this app so a stray lockfile in a parent
  // directory can't be inferred as the root.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
