import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "favicon.png", "pwa-192x192.png", "pwa-512x512.png", "pwa-maskable-512x512.png"],
      manifest: {
        name: "AgroCI - Produits Vivriers en Gros",
        short_name: "AgroCI",
        description: "Plateforme de vente de produits vivriers en gros en Côte d'Ivoire.",
        theme_color: "#16a34a",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        id: "/",
        lang: "fr",
        categories: ["business", "food", "shopping"],
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ],
        screenshots: [
          { src: "/og-image.png", sizes: "1200x630", type: "image/png", form_factor: "wide", label: "AgroCI" }
        ],
        shortcuts: [
          { name: "Voir les produits", short_name: "Produits", url: "/products", icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }] },
          { name: "Espace Producteur", short_name: "Producteurs", url: "/producers", icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }] },
          { name: "Espace Acheteur", short_name: "Acheteurs", url: "/buyers", icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }] }
        ],
        related_applications: [],
        prefer_related_applications: false
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/supabase/, /^\/~oauth/],
        // Disable skipWaiting/clientsClaim to prevent page reloads during navigation
        skipWaiting: false,
        clientsClaim: false
      },
      devOptions: {
        enabled: false
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
