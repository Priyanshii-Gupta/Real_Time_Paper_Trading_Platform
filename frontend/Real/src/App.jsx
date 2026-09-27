/**
 * App.jsx — Root component
 * Manages auth state and routes between LoginPage and Dashboard.
 */
import { useState } from 'react';
import LoginPage from './components/LoginPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import { useToast, ToastContainer } from './useToast.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const { toasts, toast, dismiss } = useToast();

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => setUser(null);

  return (
    <>
      {user ? (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          toast={toast}
        />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}
