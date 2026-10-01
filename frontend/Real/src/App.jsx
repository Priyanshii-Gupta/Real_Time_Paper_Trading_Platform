/**
 * App.jsx — Root component
 * Manages auth state and routes between LoginPage and Dashboard.
 */
import { useState } from 'react';
import LoginPage from './components/LoginPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import { useToast, ToastContainer } from './useToast.jsx';

export default function App() {
  const [user, setUser] = useState(null);          // always start at login
  const { toasts, toast, dismiss } = useToast();

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => setUser(null);
  const handleUserUpdate = (userData) => setUser(userData);

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