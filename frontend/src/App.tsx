import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar, Footer, TipModal, WithdrawModal, CelebrationModal } from '@/components/organisms';
import { Landing, Dashboard } from '@/pages';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>

        <Footer />

        <TipModal />
        <WithdrawModal />
        <CelebrationModal />
      </div>
    </BrowserRouter>
  );
}
