import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api';
import {
  HiOutlineUsers,
  HiOutlineClipboardDocumentCheck,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown
} from 'react-icons/hi2';

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (user.role === 'admin' || user.role === 'teacher') {
        const res = await api.get('/analytics');
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  // Parent/Student view
  if (user.role === 'parent' || user.role === 'student') {
    return (
      <div>
        <div className="page-header">
          <h1>Welcome, {user.name}! 👋</h1>
          <p>View your student's progress and performance</p>
        </div>
        <div className="stats-grid">
          <Link to={user.linkedStudentId ? `/students/${user.linkedStudentId}` : '/rankings'} style={{ textDecoration: 'none' }}>
            <div className="stat-card purple">
              <div className="stat-icon purple"><HiOutlineChartBar /></div>
              <div className="stat-content">
                <h3>View Progress</h3>
                <p>Check performance & attendance</p>
              </div>
            </div>
          </Link>
          <Link to="/rankings" style={{ textDecoration: 'none' }}>
            <div className="stat-card green">
              <div className="stat-icon green"><HiOutlineArrowTrendingUp /></div>
              <div className="stat-content">
                <h3>Rankings</h3>
                <p>See student rankings</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {};

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {user.name}! 👋</h1>
        <p>Here's what's happening in your pod today</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon purple"><HiOutlineUsers /></div>
          <div className="stat-content">
            <h3>{overview.approvedStudents || 0}</h3>
            <p>Active Students</p>
            {overview.pendingAdmissions > 0 && (
              <div className="stat-trend up">
                +{overview.pendingAdmissions} pending
              </div>
            )}
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon green"><HiOutlineClipboardDocumentCheck /></div>
          <div className="stat-content">
            <h3>{overview.presentToday || 0}</h3>
            <p>Present Today</p>
            <div className="stat-trend up">
              <HiOutlineArrowTrendingUp /> {overview.weekAttendanceRate || 0}% this week
            </div>
          </div>
        </div>

        <div className="stat-card amber">
          <div className="stat-icon amber"><HiOutlineChartBar /></div>
          <div className="stat-content">
            <h3>{overview.avgTypingSpeed || 0}</h3>
            <p>Avg. WPM Speed</p>
            <div className="stat-trend up">
              <HiOutlineArrowTrendingUp /> Improving
            </div>
          </div>
        </div>

        <div className="stat-card rose">
          <div className="stat-icon rose"><HiOutlineClock /></div>
          <div className="stat-content">
            <h3>{overview.absentToday || 0}</h3>
            <p>Absent Today</p>
            {overview.absentToday > 0 && (
              <div className="stat-trend down">
                <HiOutlineArrowTrendingDown /> Needs attention
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Admissions */}
        <div className="card">
          <div className="card-header">
            <h2>Recent Admissions</h2>
            <Link to="/students" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(analytics?.recentAdmissions || []).map((s) => (
                  <tr key={s._id}>
                    <td>
                      <Link to={`/students/${s._id}`} style={{ fontWeight: 600 }}>
                        {s.name}
                      </Link>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.studentId}</div>
                    </td>
                    <td>{s.course}</td>
                    <td>
                      <span className={`badge ${s.status === 'approved' ? 'badge-success' : s.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!analytics?.recentAdmissions || analytics.recentAdmissions.length === 0) && (
                  <tr><td colSpan={3} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>No admissions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Course Distribution */}
        <div className="card">
          <div className="card-header">
            <h2>Course Distribution</h2>
          </div>
          <div className="card-body">
            {(analytics?.courseDistribution || []).map((c) => (
              <div key={c._id} style={{ marginBottom: 20 }}>
                <div className="flex-between mb-8">
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{c._id}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.count} students</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill purple"
                    style={{ width: `${(c.count / (overview.approvedStudents || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {(!analytics?.courseDistribution || analytics.courseDistribution.length === 0) && (
              <div className="empty-state">
                <p>No course data available yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
