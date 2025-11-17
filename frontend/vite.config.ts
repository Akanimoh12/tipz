import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import removeConsole from 'vite-plugin-remove-console';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    
    // Node.js polyfills for browser (required by Somnia Streams SDK)
    nodePolyfills({
      include: ['buffer'],
      globals: {
        Buffer: true,
      },
    }),
    
    // Remove console.logs in production
    removeConsole({
      includes: ['log', 'debug', 'warn'],
    }),
    
    // Bundle size visualization
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: './dist/stats.html',
    }) as any,
    
    // PWA with service worker for offline support
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Tipz - Blockchain Tipping Platform',
        short_name: 'Tipz',
        description: 'Send and receive crypto tips on Somnia blockchain',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globIgnores: ['**/stats.html'], // Exclude bundle analyzer output
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/gateway\.pinata\.cloud\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ipfs-images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
    
    // Sentry error tracking (only in production)
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            sourcemaps: {
              assets: './dist/**',
            },
          }),
        ]
      : []),
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  server: {
    port: 5173,
    open: true,
    hmr: {
      clientPort: 443, // Required for ngrok
    },
    allowedHosts: [
      'localhost',
      '.ngrok-free.dev', // Allow all ngrok free domains
      '.ngrok.io', // Allow ngrok.io domains (older format)
      'denotative-charmedly-shalonda.ngrok-free.dev', // Your specific ngrok URL
    ],
  },
  
  build: {
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          web3: ['viem', 'wagmi', '@rainbow-me/rainbowkit'],
          ui: ['framer-motion', 'lucide-react'],
        },
      },
    },
    // Enable source maps for production debugging (Sentry needs them)
    sourcemap: true,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'viem', 'wagmi'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  
  // Define global for Node.js modules
  define: {
    global: 'globalThis',
  },
});
