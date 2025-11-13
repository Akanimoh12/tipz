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
import { initSentry, ErrorBoundary } from './utils/sentry';

// Initialize Sentry error tracking
initSentry();

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
    <ErrorBoundary
      fallback={(errorData) => (
        <div className="min-h-screen flex items-center justify-center bg-background text-text">
          <div className="text-center space-y-4 p-8">
            <h1 className="text-h1 font-bold">Something went wrong</h1>
            <p className="text-body text-text-muted">
              {errorData.error instanceof Error ? errorData.error.message : 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                errorData.resetError();
                globalThis.location.reload();
              }}
              className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand-hover transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
    >
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
    </ErrorBoundary>
  </StrictMode>
);
