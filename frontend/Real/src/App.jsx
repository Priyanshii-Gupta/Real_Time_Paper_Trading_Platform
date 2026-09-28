/**
 * App.jsx — Root component
 * Manages auth state and routes between LoginPage and Dashboard.
 */
import { useState } from 'react';
import LoginPage from './components/LoginPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import { useToast, ToastContainer } from './useToast.jsx';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('paper_trade_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const { toasts, toast, dismiss } = useToast();

  const handleLogin = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem('paper_trade_user', JSON.stringify(userData));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUserUpdate = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem('paper_trade_user', JSON.stringify(userData));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('paper_trade_user');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {user ? (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onUserUpdate={handleUserUpdate}
          toast={toast}
        />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}
