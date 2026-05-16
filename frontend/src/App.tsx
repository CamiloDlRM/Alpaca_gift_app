import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import SendGift from './pages/SendGift';
import ClaimGift from './pages/ClaimGift';
import KYCPersonal from './pages/kyc/KYCPersonal';
import KYCSSN from './pages/kyc/KYCSSN';
import KYCQuestions from './pages/kyc/KYCQuestions';
import KYCSuccess from './pages/kyc/KYCSuccess';
import KYCPin from './pages/kyc/KYCPin';
import Agreement from './pages/Agreement';
import GiftDashboard from './pages/GiftDashboard';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import RecipientDashboard from './pages/RecipientDashboard';
import MyGifts from './pages/MyGifts';
import Activity from './pages/Activity';
import Education from './pages/Education';
import Profile from './pages/Profile';
import Support from './pages/Support';
import RecipientPortfolioPage from './pages/RecipientPortfolioPage';
import ScheduleGifts from './pages/ScheduleGifts';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/send" element={<ProtectedRoute><SendGift /></ProtectedRoute>} />
        <Route path="/claim/:claimToken" element={<ClaimGift />} />
        <Route path="/claim/:claimToken/kyc/personal" element={<KYCPersonal />} />
        <Route path="/claim/:claimToken/kyc/ssn" element={<KYCSSN />} />
        <Route path="/claim/:claimToken/kyc/questions" element={<KYCQuestions />} />
        <Route path="/claim/:claimToken/kyc/success" element={<KYCSuccess />} />
        <Route path="/claim/:claimToken/verify-pin" element={<KYCPin />} />
        <Route path="/claim/:claimToken/agreement" element={<Agreement />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/recipient/:claimToken/dashboard" element={<RecipientDashboard />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/gift/:giftId" element={<ProtectedRoute><GiftDashboard /></ProtectedRoute>} />
        <Route path="/my-gifts" element={<ProtectedRoute><MyGifts /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
        <Route path="/education" element={<ProtectedRoute><Education /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="/my-portfolio" element={<ProtectedRoute><RecipientPortfolioPage /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute><ScheduleGifts /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
