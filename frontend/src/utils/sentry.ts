import * as Sentry from '@sentry/react';

export function initSentry() {
  // Only initialize in production
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // Performance Monitoring
      tracesSampleRate: 1, // Capture 100% of transactions in production
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // Sample 10% of sessions
      replaysOnErrorSampleRate: 1, // Always capture replays when errors occur
      
      // Filter out known errors
      beforeSend(event) {
        // Ignore MetaMask/wallet errors
        if (
          event.exception?.values?.[0]?.value?.includes('MetaMask') ||
          event.exception?.values?.[0]?.value?.includes('wallet')
        ) {
          return null;
        }
        return event;
      },
    });
  }
}

// Export error boundary
export const ErrorBoundary = Sentry.ErrorBoundary;
