import { lazy, Suspense, memo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar, Footer, TipModal, WithdrawModal, CelebrationModal } from '@/components/organisms';
import { Skeleton } from '@/components/atoms';
import { useContractEventListener } from '@/hooks/useContractEventListener';

// Lazy load pages for code splitting
const Landing = lazy(() => import('@/pages').then(module => ({ default: module.Landing })));
const Dashboard = lazy(() => import('@/pages').then(module => ({ default: module.Dashboard })));
const Register = lazy(() => import('@/pages').then(module => ({ default: module.Register })));
const Profile = lazy(() => import('@/pages').then(module => ({ default: module.Profile })));
const Leaderboard = lazy(() => import('@/pages').then(module => ({ default: module.Leaderboard })));
const NotFound = lazy(() => import('@/pages').then(module => ({ default: module.NotFound })));

// Loading fallback component
function PageLoader() {
  return (
    <div className="container mx-auto px-md py-xl space-y-md">
      <Skeleton variant="rectangular" width="100%" height="200px" />
      <Skeleton variant="rectangular" width="100%" height="400px" />
    </div>
  );
}

// Memoized event listener status banner - only re-renders when content actually changes
const EventListenerBanner = memo<{
  isListening: boolean;
  metrics: {
    tipsDetected: number;
    tipsPublished: number;
    profilesCreatedDetected: number;
    profilesCreatedPublished: number;
    profilesUpdatedDetected: number;
    profilesUpdatedPublished: number;
    publishErrors: number;
    queueSize: number;
  };
}>(({ isListening, metrics }) => {
  if (!import.meta.env.DEV) {
    return null;
  }

  // Always render the banner space to prevent layout shift
  // Just change the content when listening state changes
  return (
    <div className="bg-green-500/10 border-b-2 border-green-500 px-md py-xs text-xs">
      <div className="container mx-auto flex items-center justify-between">
        <span className="flex items-center gap-xs">
          {isListening ? (
            <>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium">Event Listener Active</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-gray-400 rounded-full" />
              <span className="font-medium text-primary/50">Event Listener Inactive</span>
            </>
          )}
        </span>
        {isListening && (
          <span className="text-primary/70">
            Tips: {metrics.tipsDetected}/{metrics.tipsPublished} | 
            Profiles: {metrics.profilesCreatedDetected + metrics.profilesUpdatedDetected}/
            {metrics.profilesCreatedPublished + metrics.profilesUpdatedPublished}
            {metrics.publishErrors > 0 && ` | Errors: ${metrics.publishErrors}`}
            {metrics.queueSize > 0 && ` | Queue: ${metrics.queueSize}`}
          </span>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if values actually changed
  return (
    prevProps.isListening === nextProps.isListening &&
    prevProps.metrics.tipsDetected === nextProps.metrics.tipsDetected &&
    prevProps.metrics.tipsPublished === nextProps.metrics.tipsPublished &&
    prevProps.metrics.profilesCreatedDetected === nextProps.metrics.profilesCreatedDetected &&
    prevProps.metrics.profilesCreatedPublished === nextProps.metrics.profilesCreatedPublished &&
    prevProps.metrics.profilesUpdatedDetected === nextProps.metrics.profilesUpdatedDetected &&
    prevProps.metrics.profilesUpdatedPublished === nextProps.metrics.profilesUpdatedPublished &&
    prevProps.metrics.publishErrors === nextProps.metrics.publishErrors &&
    prevProps.metrics.queueSize === nextProps.metrics.queueSize
  );
});

export default function App() {
  // Initialize contract event listener
  // Automatically starts when wallet connects and stops when disconnects
  const { isListening, metrics, error } = useContractEventListener({
    autoStart: true,
    enableLogging: false, // Disable logging to prevent re-renders
  });

  // Log event listener status in development
  if (import.meta.env.DEV && error) {
    console.error('Contract event listener error:', error);
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        {/* Development: Show event listener status */}
        <EventListenerBanner isListening={isListening} metrics={metrics} />
        
        <Navbar />
        
        <div className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/register" element={<Register />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/@:username" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>

        <Footer />

        <TipModal />
        <WithdrawModal />
        <CelebrationModal />
      </div>
    </BrowserRouter>
  );
}
