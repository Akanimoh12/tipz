import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar, Footer, TipModal, WithdrawModal, CelebrationModal } from '@/components/organisms';
import { Skeleton } from '@/components/atoms';

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

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
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
