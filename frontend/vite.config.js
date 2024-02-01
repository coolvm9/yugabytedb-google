import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxying API requests
      "/api": {
        target: "http://localhost:8080", // nip.io Apigee URL
        changeOrigin: true,
      },
    },
  },
});
