import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "pdf2json", "mammoth", "tesseract.js"],
};

export default nextConfig;
