import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import Admission from './pages/Admission';
import Attendance from './pages/Attendance';
import Performance from './pages/Performance';
import Rankings from './pages/Rankings';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentProfile />} />
        <Route path="admission" element={
          <ProtectedRoute roles={['admin', 'teacher']}>
            <Admission />
          </ProtectedRoute>
        } />
        <Route path="attendance" element={
          <ProtectedRoute roles={['admin', 'teacher']}>
            <Attendance />
          </ProtectedRoute>
        } />
        <Route path="performance" element={
          <ProtectedRoute roles={['admin', 'teacher']}>
            <Performance />
          </ProtectedRoute>
        } />
        <Route path="rankings" element={<Rankings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
