import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import api from '../api';
import { HiOutlineCheckCircle } from 'react-icons/hi2';

export default function Attendance() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState({});
  const [existingRecords, setExistingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (students.length) fetchExisting();
  }, [date, students]);

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

  const fetchExisting = async () => {
    try {
      const res = await api.get(`/attendance/daily/${date}`);
      const existing = {};
      res.data.forEach(a => {
        if (a.studentId?._id) {
          existing[a.studentId._id] = a.status;
        }
      });
      setRecords(existing);
      setExistingRecords(res.data);
    } catch (err) {
      console.error('Failed to fetch existing:', err);
    }
  };

  const setStatus = (studentId, status) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? undefined : status
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    const attendanceRecords = Object.entries(records)
      .filter(([_, status]) => status)
      .map(([studentId, status]) => ({ studentId, status }));

    if (attendanceRecords.length === 0) {
      toast.warning('Please mark attendance for at least one student');
      return;
    }

    setSaving(true);
    try {
      await api.post('/attendance', { date, records: attendanceRecords });
      setSaved(true);
      toast.success('Attendance saved successfully!');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = () => {
    const all = {};
    students.forEach(s => { all[s._id] = 'present'; });
    setRecords(all);
    setSaved(false);
  };

  const totalMarked = Object.values(records).filter(Boolean).length;
  const presentCount = Object.values(records).filter(s => s === 'present').length;
  const absentCount = Object.values(records).filter(s => s === 'absent').length;
  const lateCount = Object.values(records).filter(s => s === 'late').length;

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Mark Attendance</h1>
            <p>{students.length} students • {totalMarked} marked</p>
          </div>
          <div className="flex gap-12">
            <input
              type="date"
              className="form-input"
              style={{ width: 180 }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button className="btn btn-secondary" onClick={markAllPresent}>
              Mark All Present
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </div>

      {saved && (
        <div className="alert-success mb-24">
          <HiOutlineCheckCircle /> Attendance saved successfully!
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card green" style={{ padding: 16 }}>
          <div className="stat-content">
            <h3>{presentCount}</h3>
            <p>Present</p>
          </div>
        </div>
        <div className="stat-card rose" style={{ padding: 16 }}>
          <div className="stat-content">
            <h3>{absentCount}</h3>
            <p>Absent</p>
          </div>
        </div>
        <div className="stat-card amber" style={{ padding: 16 }}>
          <div className="stat-content">
            <h3>{lateCount}</h3>
            <p>Late</p>
          </div>
        </div>
      </div>

      <div className="attendance-grid">
        {students.map((s) => (
          <div key={s._id} className="attendance-row">
            <div className="attendance-student">
              <div className="attendance-student-name">{s.name}</div>
              <div className="attendance-student-id">{s.studentId} • {s.course}</div>
            </div>
            <div className="attendance-actions">
              <button
                className={`attendance-btn ${records[s._id] === 'present' ? 'present' : ''}`}
                onClick={() => setStatus(s._id, 'present')}
              >
                Present
              </button>
              <button
                className={`attendance-btn ${records[s._id] === 'absent' ? 'absent' : ''}`}
                onClick={() => setStatus(s._id, 'absent')}
              >
                Absent
              </button>
              <button
                className={`attendance-btn ${records[s._id] === 'late' ? 'late' : ''}`}
                onClick={() => setStatus(s._id, 'late')}
              >
                Late
              </button>
            </div>
          </div>
        ))}
        {students.length === 0 && (
          <div className="empty-state">
            <h3>No students found</h3>
            <p>Add approved students first to mark attendance</p>
          </div>
        )}
      </div>
    </div>
  );
}
