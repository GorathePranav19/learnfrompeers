import { useState, useEffect, useCallback } from 'react';
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
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
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
  }, [user.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  // Parent/Student view — show linked student data
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
          <Link to="/students" style={{ textDecoration: 'none' }}>
            <div className="stat-card amber">
              <div className="stat-icon amber"><HiOutlineUsers /></div>
              <div className="stat-content">
                <h3>All Students</h3>
                <p>Browse the student directory</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {};

  // Build chart data from monthly trend
  const chartData = (analytics?.monthlyTrend || []).map(m => {
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      name: monthNames[m._id.month],
      rate: m.total > 0 ? Math.round((m.present / m.total) * 100) : 0
    };
  });

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
              <HiOutlineArrowTrendingUp /> {overview.avgAccuracy || 0}% accuracy
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

      <div className="dashboard-grid">
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

        {/* Course Distribution + Attendance Chart */}
        <div className="card">
          <div className="card-header">
            <h2>Overview</h2>
          </div>
          <div className="card-body">
            {/* Attendance Trend Chart */}
            {chartData.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Attendance Trend
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
                      formatter={(value) => [`${value}%`, 'Rate']}
                    />
                    <Area type="monotone" dataKey="rate" stroke="var(--primary-400)" fill="url(#attendGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Course Distribution */}
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Course Distribution
            </div>
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
