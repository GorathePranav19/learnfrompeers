import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../api';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineEye
} from 'react-icons/hi2';

export default function Students() {
  const { user } = useAuth();
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    // Debounce search — wait 300ms after last keystroke
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, statusFilter, batchFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (batchFilter) params.batch = batchFilter;
      const res = await api.get('/students', { params });
      setStudents(res.data?.students || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/students/${id}/approve`);
      toast.success('Student approved successfully');
      fetchStudents();
    } catch (err) {
      toast.error('Failed to approve student');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted successfully');
      setConfirmDelete(null);
      fetchStudents();
    } catch (err) {
      toast.error('Failed to delete student');
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
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
        >
          <option value="">All Batches</option>
          <option value="Morning">Morning</option>
          <option value="Evening">Evening</option>
          <option value="Weekend">Weekend</option>
        </select>
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
          <option value="dropped">Dropped</option>
          <option value="transferred">Transferred</option>
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
                <th>Batch</th>
                <th>Parent</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="loading-spinner"><div className="spinner" /></div></td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={8} className="text-center" style={{ padding: 60, color: 'var(--text-muted)' }}>No students found</td></tr>
              ) : (
                students.map((s) => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-400)' }}>{s.studentId}</td>
                    <td>
                      <Link to={`/students/${s._id}`} style={{ fontWeight: 600 }}>{s.name}</Link>
                    </td>
                    <td>{s.course}</td>
                    <td>{s.batch || '-'}</td>
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
                          <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger-400)' }} onClick={() => setConfirmDelete(s)} title="Delete">
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

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Student</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This will also remove all their attendance and performance records.</p>
            </div>
            <div className="modal-footer">
              <div className="flex gap-12">
                <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete._id)}>
                  Delete
                </button>
                <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
