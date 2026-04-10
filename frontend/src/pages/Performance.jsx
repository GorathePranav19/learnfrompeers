import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import api from '../api';
import { HiOutlineCheckCircle } from 'react-icons/hi2';

export default function Performance() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [form, setForm] = useState({ typingSpeed: '', accuracy: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recentRecords, setRecentRecords] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) fetchRecent();
  }, [selectedStudent]);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students', { params: { status: 'approved', limit: 100 } });
      setStudents(res.data.students);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecent = async () => {
    try {
      const res = await api.get(`/performance/${selectedStudent}`);
      setRecentRecords(res.data.records?.slice(0, 5) || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.warning('Please select a student');
      return;
    }
    setSaving(true);
    try {
      await api.post('/performance', {
        studentId: selectedStudent,
        typingSpeed: parseInt(form.typingSpeed),
        accuracy: parseFloat(form.accuracy),
        notes: form.notes
      });
      setSuccess(true);
      toast.success('Performance record saved!');
      setForm({ typingSpeed: '', accuracy: '', notes: '' });
      fetchRecent();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      toast.error('Failed to save performance record');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  const levelColors = {
    beginner: 'badge-warning',
    intermediate: 'badge-info',
    advanced: 'badge-success',
    expert: 'badge-success'
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Performance Tracking</h1>
        <p>Record typing speed and accuracy for students</p>
      </div>

      {success && (
        <div className="alert-success mb-24">
          <HiOutlineCheckCircle /> Performance record saved!
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2>Add Performance Record</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="perf-student">Student *</label>
                <select
                  id="perf-student"
                  className="form-select"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  required
                >
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="perf-speed">Typing Speed (WPM) *</label>
                  <input
                    id="perf-speed"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 35"
                    min="0"
                    max="200"
                    value={form.typingSpeed}
                    onChange={(e) => setForm({ ...form, typingSpeed: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="perf-accuracy">Accuracy (%) *</label>
                  <input
                    id="perf-accuracy"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 85"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.accuracy}
                    onChange={(e) => setForm({ ...form, accuracy: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="perf-notes">Notes</label>
                <textarea
                  id="perf-notes"
                  className="form-textarea"
                  placeholder="Optional notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Record'}
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Recent Records</h2>
          </div>
          {selectedStudent ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Speed</th>
                    <th>Accuracy</th>
                    <th>Level</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map(r => (
                    <tr key={r._id}>
                      <td>{formatDate(r.date)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-400)' }}>{r.typingSpeed} WPM</td>
                      <td>{r.accuracy}%</td>
                      <td><span className={`badge ${levelColors[r.level]}`}>{r.level}</span></td>
                    </tr>
                  ))}
                  {recentRecords.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <p>Select a student to see recent records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
