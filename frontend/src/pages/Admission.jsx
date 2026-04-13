import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import api from '../api';
import { HiOutlineCheckCircle } from 'react-icons/hi2';

export default function Admission() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    name: '', dob: '', gender: '', phone: '',
    parentName: '', parentPhone: '', parentEmail: '',
    course: '', batch: '', address: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/students', form);
      setSuccess(true);
      toast.success('Admission submitted successfully!');
      setTimeout(() => navigate('/students'), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit admission';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 64, color: 'var(--accent-400)' }}><HiOutlineCheckCircle /></div>
        <h2>Admission Submitted!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Student has been registered. Redirecting...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>New Admission</h1>
        <p>Register a new student to the pod</p>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-body">
          {error && (
            <div className="login-error" style={{ marginBottom: 20 }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--primary-400)' }}>
              Student Information
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="adm-name">Full Name *</label>
              <input id="adm-name" name="name" className="form-input" placeholder="Enter student name" value={form.name} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="adm-dob">Date of Birth *</label>
                <input id="adm-dob" name="dob" type="date" className="form-input" value={form.dob} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="adm-gender">Gender *</label>
                <select id="adm-gender" name="gender" className="form-select" value={form.gender} onChange={handleChange} required>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="adm-phone">Phone *</label>
                <input id="adm-phone" name="phone" className="form-input" placeholder="9876543210" value={form.phone} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="adm-course">Course *</label>
                <select id="adm-course" name="course" className="form-select" value={form.course} onChange={handleChange} required>
                  <option value="">Select Course</option>
                  <option value="Typing">Typing</option>
                  <option value="Computer Basics">Computer Basics</option>
                  <option value="MS Office">MS Office</option>
                  <option value="Tally">Tally</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="adm-batch">Batch *</label>
                <select id="adm-batch" name="batch" className="form-select" value={form.batch} onChange={handleChange} required>
                  <option value="">Select Batch</option>
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                  <option value="Weekend">Weekend</option>
                </select>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '28px 0' }} />

            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--primary-400)' }}>
              Parent / Guardian Information
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="adm-parentName">Parent Name *</label>
              <input id="adm-parentName" name="parentName" className="form-input" placeholder="Enter parent name" value={form.parentName} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="adm-parentPhone">Parent Phone *</label>
                <input id="adm-parentPhone" name="parentPhone" className="form-input" placeholder="9876543211" value={form.parentPhone} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="adm-parentEmail">Parent Email</label>
                <input id="adm-parentEmail" name="parentEmail" type="email" className="form-input" placeholder="Optional" value={form.parentEmail} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="adm-address">Address</label>
              <textarea id="adm-address" name="address" className="form-textarea" placeholder="Enter address (optional)" value={form.address} onChange={handleChange} />
            </div>

            <div className="flex gap-12" style={{ marginTop: 28 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Admission'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/students')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
