import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import '@rainbow-me/rainbowkit/styles.css';
import './index.css';
import App from './App.tsx';
import { wagmiConfig } from './config/wagmi.config';
import { RainbowKitConfig } from './config/rainbowkit.config';
import { TOAST_CONFIG } from './config/app.config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitConfig>
            <App />
            <Toaster
            position={TOAST_CONFIG.POSITION}
            toastOptions={{
              duration: TOAST_CONFIG.DURATION.SUCCESS,
              style: {
                border: '3px solid #000000',
                padding: '16px',
                color: '#000000',
                background: '#FFFFFF',
                borderRadius: '4px',
                fontFamily: 'Inter, sans-serif',
              },
              success: {
                duration: TOAST_CONFIG.DURATION.SUCCESS,
                iconTheme: {
                  primary: '#000000',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                duration: TOAST_CONFIG.DURATION.ERROR,
                iconTheme: {
                  primary: '#DC2626',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
        </RainbowKitConfig>
      </QueryClientProvider>
    </WagmiProvider>
    </HelmetProvider>
  </StrictMode>
);
