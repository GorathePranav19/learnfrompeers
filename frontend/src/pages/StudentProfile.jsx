import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../api';
import {
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineCalendar,
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineArrowTrendingUp,
  HiOutlinePencilSquare,
  HiOutlineXMark,
  HiOutlineDocumentText,
  HiOutlineArrowDownTray,
  HiOutlineTrash
} from 'react-icons/hi2';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // New features state
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docLabel, setDocLabel] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', reason: '' });
  const [statusSaving, setStatusSaving] = useState(false);

  const fetchAll = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openEdit = () => {
    setEditForm({
      name: student.name,
      phone: student.phone,
      course: student.course,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail || '',
      course: student.course,
      batch: student.batch || '',
      address: student.address || ''
    });
    setShowEdit(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put(`/students/${id}`, editForm);
      setStudent(res.data);
      setShowEdit(false);
      toast.success('Student updated successfully');
    } catch (err) {
      toast.error('Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadId = async () => {
    try {
      const res = await api.get(`/students/${id}/idcard`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `idcard-${student.studentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download ID card');
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('label', docLabel);

      const res = await api.post(`/students/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStudent(res.data);
      setSelectedFile(null);
      setDocLabel('');
      toast.success('Document uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      const res = await api.delete(`/students/${id}/documents/${docId}`);
      setStudent(res.data);
      toast.success('Document deleted');
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const openStatusModal = () => {
    setStatusForm({ status: student.status, reason: '' });
    setShowStatusModal(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setStatusSaving(true);
    try {
      const res = await api.put(`/students/${id}/status`, statusForm);
      setStudent(res.data);
      setShowStatusModal(false);
      toast.success('Status updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusSaving(false);
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

  // Build chart data for performance trend (reverse to chronological)
  const chartData = (performance?.records || []).slice().reverse().map(r => ({
    date: new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    speed: r.typingSpeed,
    accuracy: r.accuracy
  }));

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
            {student.batch && <span className="badge badge-info">{student.batch} Batch</span>}
            <span style={{ color: 'var(--primary-400)', fontWeight: 600 }}>{student.studentId}</span>
            <span className={`badge ${student.status === 'approved' ? 'badge-success' : student.status === 'dropped' || student.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
              {student.status}
            </span>
          </div>
        </div>
        <div className="flex gap-12" style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={handleDownloadId}>
            <HiOutlineArrowDownTray style={{ marginRight: 6 }} /> ID Card
          </button>
          {user?.role === 'admin' && (
            <>
              <button className="btn btn-secondary" onClick={openEdit}>
                <HiOutlinePencilSquare /> Edit
              </button>
              <button className="btn btn-secondary" onClick={openStatusModal}>
                Status
              </button>
            </>
          )}
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>Attendance</button>
        <button className={`tab ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>Performance</button>
        <button className={`tab ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>Documents</button>
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

          {/* Performance Chart */}
          {chartData.length > 1 && (
            <div className="card mb-24">
              <div className="card-header"><h2>Performance Trend</h2></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-500)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--accent-500)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
                    />
                    <Area type="monotone" dataKey="speed" stroke="var(--primary-400)" fill="url(#speedGrad)" strokeWidth={2} name="Speed (WPM)" />
                    <Area type="monotone" dataKey="accuracy" stroke="var(--accent-400)" fill="url(#accGrad)" strokeWidth={2} name="Accuracy (%)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="student-details-grid">
            <div className="card">
              <div className="card-header"><h2>Personal Details</h2></div>
              <div className="card-body">
                <div className="detail-list">
                  <div className="detail-item">
                    <div className="detail-label">Date of Birth</div>
                    <div className="detail-value">{formatDate(student.dob)}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Gender</div>
                    <div className="detail-value" style={{ textTransform: 'capitalize' }}>{student.gender}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Phone</div>
                    <div className="detail-value"><HiOutlinePhone style={{ marginRight: 4 }} />{student.phone}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Admission Date</div>
                    <div className="detail-value">{formatDate(student.admissionDate)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h2>Parent / Guardian</h2></div>
              <div className="card-body">
                <div className="detail-list">
                  <div className="detail-item">
                    <div className="detail-label">Parent Name</div>
                    <div className="detail-value">{student.parentName}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Phone</div>
                    <div className="detail-value"><HiOutlinePhone style={{ marginRight: 4 }} />{student.parentPhone}</div>
                  </div>
                  {student.parentEmail && (
                    <div className="detail-item">
                      <div className="detail-label">Email</div>
                      <div className="detail-value"><HiOutlineEnvelope style={{ marginRight: 4 }} />{student.parentEmail}</div>
                    </div>
                  )}
                  {student.address && (
                    <div className="detail-item">
                      <div className="detail-label">Address</div>
                      <div className="detail-value">{student.address}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status History */}
          {(student.statusHistory && student.statusHistory.length > 0) && (
            <div className="card mt-24" style={{ marginTop: 24 }}>
              <div className="card-header"><h2>Status History</h2></div>
              <div className="card-body">
                <div className="timeline">
                  {student.statusHistory.slice().reverse().map((h, i) => (
                    <div key={i} className="timeline-item" style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                      <div className="timeline-date" style={{ color: 'var(--text-muted)', fontSize: 13, minWidth: 100 }}>
                        {formatDate(h.date)}
                      </div>
                      <div className="timeline-content">
                        <span className={`badge ${h.status === 'approved' ? 'badge-success' : h.status === 'dropped' || h.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`} style={{ marginBottom: 4, display: 'inline-block' }}>
                          Changed to {h.status}
                        </span>
                        <p style={{ margin: 0, fontSize: 14 }}>{h.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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

      {activeTab === 'documents' && (
        <div className="card">
          <div className="card-header">
            <h2>Student Documents</h2>
          </div>
          <div className="card-body">
            {user?.role === 'admin' && (
              <form onSubmit={handleUploadDocument} className="mb-24" style={{ display: 'flex', gap: 16, alignItems: 'flex-end', background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}>
                <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label className="form-label">Document Label</label>
                  <input type="text" className="form-input" placeholder="e.g. Birth Certificate" value={docLabel} onChange={e => setDocLabel(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label className="form-label">File</label>
                  <input type="file" className="form-input" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setSelectedFile(e.target.files[0])} required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={uploadingDoc}>
                  {uploadingDoc ? 'Uploading...' : 'Upload'}
                </button>
              </form>
            )}

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Uploaded On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(student.documents || []).map((doc) => (
                    <tr key={doc._id}>
                      <td style={{ fontWeight: 500 }}><HiOutlineDocumentText style={{ verticalAlign: 'middle', marginRight: 6 }} /> {doc.label}</td>
                      <td>{formatDate(doc.uploadedAt)}</td>
                      <td>
                        <div className="flex gap-8">
                          <a href={`${api.defaults.baseURL.replace('/api', '')}${doc.path}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-icon" title="View Document">
                            <HiOutlineArrowDownTray />
                          </a>
                          {user?.role === 'admin' && (
                            <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger-400)' }} onClick={() => handleDeleteDocument(doc._id)} title="Delete Document">
                              <HiOutlineTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!student.documents || student.documents.length === 0) && (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No documents uploaded yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Student</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEdit(false)}>
                <HiOutlineXMark />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Course</label>
                    <select className="form-select" value={editForm.course} onChange={e => setEditForm({ ...editForm, course: e.target.value })} required>
                      <option value="Typing">Typing</option>
                      <option value="Computer Basics">Computer Basics</option>
                      <option value="MS Office">MS Office</option>
                      <option value="Tally">Tally</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Batch</label>
                    <select className="form-select" value={editForm.batch} onChange={e => setEditForm({ ...editForm, batch: e.target.value })} required>
                      <option value="">Select Batch</option>
                      <option value="Morning">Morning</option>
                      <option value="Evening">Evening</option>
                      <option value="Weekend">Weekend</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Name</label>
                  <input className="form-input" value={editForm.parentName} onChange={e => setEditForm({ ...editForm, parentName: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Parent Phone</label>
                    <input className="form-input" value={editForm.parentPhone} onChange={e => setEditForm({ ...editForm, parentPhone: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Parent Email</label>
                    <input className="form-input" type="email" value={editForm.parentEmail} onChange={e => setEditForm({ ...editForm, parentEmail: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea className="form-textarea" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
                </div>
                <div className="flex gap-12">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Student Status</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowStatusModal(false)}>
                <HiOutlineXMark />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleStatusSubmit}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={statusForm.status} onChange={e => setStatusForm({ ...statusForm, status: e.target.value })} required>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="dropped">Dropped</option>
                    <option value="transferred">Transferred</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason / Notes</label>
                  <textarea className="form-textarea" placeholder="Provide a reason for the status change..." value={statusForm.reason} onChange={e => setStatusForm({ ...statusForm, reason: e.target.value })} required />
                </div>
                <div className="flex gap-12 mt-24">
                  <button type="submit" className="btn btn-primary" disabled={statusSaving}>
                    {statusSaving ? 'Saving...' : 'Update Status'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
