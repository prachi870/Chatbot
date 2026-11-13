import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ChatPage from './pages/ChatPage';

export default function App() {
  return (
    <Routes>
      {/* No login/signup — a session is created silently and the app opens straight into chat. */}
      <Route path="/*" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
    </Routes>
  );
}
