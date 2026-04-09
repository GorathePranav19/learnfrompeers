import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import {
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineCalendar,
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineArrowTrendingUp
} from 'react-icons/hi2';

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      const [stuRes, attRes, perfRes] = await Promise.all([
        api.get(`/students/${id}`),
        api.get(`/attendance/student/${id}`),
        api.get(`/performance/${id}`)
      ]);
      setStudent(stuRes.data);
      setAttendance(attRes.data);
      setPerformance(perfRes.data);
    } catch (err) {
      console.error('Failed to fetch student data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!student) return <div className="empty-state"><h3>Student not found</h3></div>;

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const stats = performance?.stats;
  const levelColors = {
    beginner: 'badge-warning',
    intermediate: 'badge-info',
    advanced: 'badge-success',
    expert: 'badge-success'
  };

  return (
    <div>
      <Link to="/students" className="btn btn-ghost mb-24" style={{ gap: 6 }}>
        <HiOutlineArrowLeft /> Back to Students
      </Link>

      <div className="student-profile-header">
        <div className="student-avatar-lg">{getInitials(student.name)}</div>
        <div className="student-profile-info">
          <h2>{student.name}</h2>
          <div className="student-profile-meta">
            <span><HiOutlineAcademicCap /> {student.course}</span>
            <span style={{ color: 'var(--primary-400)', fontWeight: 600 }}>{student.studentId}</span>
            <span className={`badge ${student.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
              {student.status}
            </span>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>Attendance</button>
        <button className={`tab ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>Performance</button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card purple">
              <div className="stat-icon purple"><HiOutlineArrowTrendingUp /></div>
              <div className="stat-content">
                <h3>{stats?.latestSpeed || 0} <span style={{ fontSize: 14, fontWeight: 400 }}>WPM</span></h3>
                <p>Latest Typing Speed</p>
              </div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon green">🎯</div>
              <div className="stat-content">
                <h3>{stats?.latestAccuracy || 0}<span style={{ fontSize: 14, fontWeight: 400 }}>%</span></h3>
                <p>Latest Accuracy</p>
              </div>
            </div>
            <div className="stat-card amber">
              <div className="stat-icon amber"><HiOutlineCalendar /></div>
              <div className="stat-content">
                <h3>{attendance?.summary?.rate || 0}<span style={{ fontSize: 14, fontWeight: 400 }}>%</span></h3>
                <p>Attendance Rate</p>
              </div>
            </div>
            <div className="stat-card rose">
              <div className="stat-icon rose"><HiOutlineAcademicCap /></div>
              <div className="stat-content">
                <h3 style={{ fontSize: 20 }}>{stats?.level || 'N/A'}</h3>
                <p>Skill Level</p>
              </div>
            </div>
          </div>

          <div className="student-details-grid">
            <div className="card">
              <div className="card-header"><h2>Personal Details</h2></div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Date of Birth</div>
                    <div style={{ fontWeight: 500 }}>{formatDate(student.dob)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gender</div>
                    <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{student.gender}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Phone</div>
                    <div style={{ fontWeight: 500 }}><HiOutlinePhone style={{ marginRight: 4 }} />{student.phone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Admission Date</div>
                    <div style={{ fontWeight: 500 }}>{formatDate(student.admissionDate)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h2>Parent / Guardian</h2></div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Parent Name</div>
                    <div style={{ fontWeight: 500 }}>{student.parentName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Phone</div>
                    <div style={{ fontWeight: 500 }}><HiOutlinePhone style={{ marginRight: 4 }} />{student.parentPhone}</div>
                  </div>
                  {student.parentEmail && (
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email</div>
                      <div style={{ fontWeight: 500 }}><HiOutlineEnvelope style={{ marginRight: 4 }} />{student.parentEmail}</div>
                    </div>
                  )}
                  {student.address && (
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Address</div>
                      <div style={{ fontWeight: 500 }}>{student.address}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'attendance' && (
        <div className="card">
          <div className="card-header">
            <h2>Attendance History</h2>
            <div className="flex gap-16">
              <span className="badge badge-success">Present: {attendance?.summary?.present || 0}</span>
              <span className="badge badge-danger">Absent: {attendance?.summary?.absent || 0}</span>
              <span className="badge badge-warning">Late: {attendance?.summary?.late || 0}</span>
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {(attendance?.attendance || []).map((a) => (
                  <tr key={a._id}>
                    <td>{formatDate(a.date)}</td>
                    <td>
                      <span className={`badge ${a.status === 'present' ? 'badge-success' : a.status === 'absent' ? 'badge-danger' : 'badge-warning'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{a.notes || '-'}</td>
                  </tr>
                ))}
                {(!attendance?.attendance || attendance.attendance.length === 0) && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No attendance records yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <>
          {stats && (
            <div className="stats-grid mb-24">
              <div className="stat-card green">
                <div className="stat-icon green"><HiOutlineArrowTrendingUp /></div>
                <div className="stat-content">
                  <h3>{stats.bestSpeed} <span style={{ fontSize: 14, fontWeight: 400 }}>WPM</span></h3>
                  <p>Best Speed</p>
                </div>
              </div>
              <div className="stat-card purple">
                <div className="stat-icon purple">🎯</div>
                <div className="stat-content">
                  <h3>{stats.bestAccuracy}<span style={{ fontSize: 14, fontWeight: 400 }}>%</span></h3>
                  <p>Best Accuracy</p>
                </div>
              </div>
              <div className="stat-card amber">
                <div className="stat-icon amber">📈</div>
                <div className="stat-content">
                  <h3>{stats.speedImprovement > 0 ? '+' : ''}{stats.speedImprovement} <span style={{ fontSize: 14, fontWeight: 400 }}>WPM</span></h3>
                  <p>Speed Improvement</p>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h2>Performance History</h2>
              {stats && <span className={`badge ${levelColors[stats.level] || 'badge-neutral'}`}>{stats.level}</span>}
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Speed (WPM)</th>
                    <th>Accuracy</th>
                    <th>Level</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(performance?.records || []).map((p) => (
                    <tr key={p._id}>
                      <td>{formatDate(p.date)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-400)' }}>{p.typingSpeed} WPM</td>
                      <td>
                        <div className="flex gap-8" style={{ alignItems: 'center' }}>
                          <div className="progress-bar" style={{ width: 80 }}>
                            <div className="progress-fill green" style={{ width: `${p.accuracy}%` }} />
                          </div>
                          <span>{p.accuracy}%</span>
                        </div>
                      </td>
                      <td><span className={`badge ${levelColors[p.level] || 'badge-neutral'}`}>{p.level}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.notes || '-'}</td>
                    </tr>
                  ))}
                  {(!performance?.records || performance.records.length === 0) && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No performance records yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
