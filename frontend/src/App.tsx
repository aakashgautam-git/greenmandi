import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import SellerDashboard from './pages/SellerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import TodaysChange from './pages/TodaysChange';
import TransactionDemo from './pages/TransactionDemo';
import { AuthProvider, useAuth } from './context/AuthContext';
import './pages/AuthPage.css';

// Protected route wrapper — redirects to /auth if not logged in
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

// Renders the correct dashboard based on user role
function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'seller') return <SellerDashboard />;
  return <BuyerDashboard />;
}

// Redirect away from /auth if already logged in
function AuthGuard() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <AuthPage />;
}

function AppRoutes() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col font-Sans">
        <Navbar />
        <main className="flex-grow flex flex-col pt-20 pb-8 px-6 max-w-[1600px] w-full mx-auto">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthGuard />} />
            <Route path="/todays-change" element={<TodaysChange />} />
            <Route path="/transaction-demo" element={<TransactionDemo />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
