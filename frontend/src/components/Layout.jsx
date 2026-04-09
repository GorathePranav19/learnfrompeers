import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineUserPlus,
  HiOutlineClipboardDocumentCheck,
  HiOutlineChartBar,
  HiOutlineTrophy,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBars3
} from 'react-icons/hi2';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdminOrTeacher = user?.role === 'admin' || user?.role === 'teacher';

  const navItems = [
    { to: '/', icon: <HiOutlineHome />, label: 'Dashboard', show: true },
    { to: '/students', icon: <HiOutlineUsers />, label: 'Students', show: true },
    { to: '/admission', icon: <HiOutlineUserPlus />, label: 'New Admission', show: isAdminOrTeacher },
    { to: '/attendance', icon: <HiOutlineClipboardDocumentCheck />, label: 'Attendance', show: isAdminOrTeacher },
    { to: '/performance', icon: <HiOutlineChartBar />, label: 'Performance', show: isAdminOrTeacher },
    { to: '/rankings', icon: <HiOutlineTrophy />, label: 'Rankings', show: true },
  ];

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  return (
    <div className="app-layout">
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <HiOutlineBars3 />
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">LF</div>
            <div className="sidebar-logo-text">
              <h1>LearnFlow</h1>
              <span>Pod Manager</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Main Menu</div>
            {navItems.filter(item => item.show).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-link-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-info">
              <div className="user-info-name">{user?.name}</div>
              <div className="user-info-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost logout-btn" onClick={handleLogout}>
            <HiOutlineArrowRightOnRectangle />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
