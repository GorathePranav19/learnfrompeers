import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineEye
} from 'react-icons/hi2';

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchStudents();
  }, [search, statusFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/students', { params });
      setStudents(res.data.students);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/students/${id}/approve`);
      fetchStudents();
    } catch (err) {
      alert('Failed to approve student');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch (err) {
      alert('Failed to delete student');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Students</h1>
            <p>{total} total students</p>
          </div>
          {(user.role === 'admin' || user.role === 'teacher') && (
            <Link to="/admission" className="btn btn-primary">
              + New Admission
            </Link>
          )}
        </div>
      </div>

      <div className="filters-row">
        <div className="search-bar">
          <HiOutlineMagnifyingGlass className="search-bar-icon" />
          <input
            type="text"
            placeholder="Search by name, ID, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Course</th>
                <th>Parent</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-spinner"><div className="spinner" /></div></td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={7} className="text-center" style={{ padding: 60, color: 'var(--text-muted)' }}>No students found</td></tr>
              ) : (
                students.map((s) => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-400)' }}>{s.studentId}</td>
                    <td>
                      <Link to={`/students/${s._id}`} style={{ fontWeight: 600 }}>{s.name}</Link>
                    </td>
                    <td>{s.course}</td>
                    <td>{s.parentName}</td>
                    <td>{s.phone}</td>
                    <td>
                      <span className={`badge ${s.status === 'approved' ? 'badge-success' : s.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-8">
                        <Link to={`/students/${s._id}`} className="btn btn-ghost btn-icon" title="View">
                          <HiOutlineEye />
                        </Link>
                        {user.role === 'admin' && s.status === 'pending' && (
                          <button className="btn btn-ghost btn-icon" style={{ color: 'var(--accent-400)' }} onClick={() => handleApprove(s._id)} title="Approve">
                            <HiOutlineCheckCircle />
                          </button>
                        )}
                        {user.role === 'admin' && (
                          <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger-400)' }} onClick={() => handleDelete(s._id)} title="Delete">
                            <HiOutlineTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
