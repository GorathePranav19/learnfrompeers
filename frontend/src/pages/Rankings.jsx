import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { HiOutlineTrophy } from 'react-icons/hi2';

export default function Rankings() {
  const [rankings, setRankings] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const res = await api.get('/rankings');
      setRankings(res.data.rankings || []);
      setTopPerformers(res.data.topPerformers || []);
    } catch (err) {
      console.error('Failed to fetch rankings:', err);
    } finally {
      setLoading(false);
    }
  };

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
        <h1>🏆 Student Rankings</h1>
        <p>Based on typing speed, accuracy, and attendance</p>
      </div>

      {/* Top 3 Podium */}
      {topPerformers.length >= 3 && (
        <div className="ranking-podium">
          {[1, 0, 2].map((idx) => {
            const p = topPerformers[idx];
            if (!p) return null;
            const podiumClass = idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'bronze';
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
            return (
              <div key={p.student._id} className={`podium-card ${podiumClass}`}>
                <div className="podium-rank">{p.rank}</div>
                <div className="podium-name">{p.student.name}</div>
                <div className="podium-score">{p.score}</div>
                <div className="podium-details">
                  {p.avgSpeed} WPM • {p.avgAccuracy}% accuracy • {p.attendanceRate}% attendance
                </div>
                <div style={{ marginTop: 12 }}>
                  <span className={`badge ${levelColors[p.level]}`}>{p.level}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {topPerformers.length > 0 && topPerformers.length < 3 && (
        <div className="stats-grid mb-24">
          {topPerformers.map(p => (
            <div key={p.student._id} className="stat-card purple">
              <div className="stat-icon purple"><HiOutlineTrophy /></div>
              <div className="stat-content">
                <h3>#{p.rank} {p.student.name}</h3>
                <p>Score: {p.score} • {p.avgSpeed} WPM</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Rankings Table */}
      <div className="card">
        <div className="card-header">
          <h2>All Rankings</h2>
          <span className="badge badge-info">{rankings.length} students</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Score</th>
                <th>Speed (WPM)</th>
                <th>Accuracy</th>
                <th>Attendance</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r) => (
                <tr key={r.student._id}>
                  <td>
                    <span style={{
                      fontWeight: 800,
                      fontSize: 16,
                      color: r.rank === 1 ? '#fbbf24' :
                             r.rank === 2 ? '#94a3b8' :
                             r.rank === 3 ? '#d97706' : 'var(--text-primary)'
                    }}>
                      #{r.rank}
                    </span>
                  </td>
                  <td>
                    <Link to={`/students/${r.student._id}`} style={{ fontWeight: 600 }}>
                      {r.student.name}
                    </Link>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.student.studentId}</div>
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--primary-400)', fontSize: 18 }}>{r.score}</td>
                  <td>
                    <div>{r.latestSpeed} WPM</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Avg: {r.avgSpeed}</div>
                  </td>
                  <td>
                    <div className="flex gap-8" style={{ alignItems: 'center' }}>
                      <div className="progress-bar" style={{ width: 60 }}>
                        <div className="progress-fill green" style={{ width: `${r.avgAccuracy}%` }} />
                      </div>
                      <span>{r.avgAccuracy}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-8" style={{ alignItems: 'center' }}>
                      <div className="progress-bar" style={{ width: 60 }}>
                        <div className="progress-fill amber" style={{ width: `${r.attendanceRate}%` }} />
                      </div>
                      <span>{r.attendanceRate}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${levelColors[r.level]}`}>{r.level}</span>
                  </td>
                </tr>
              ))}
              {rankings.length === 0 && (
                <tr><td colSpan={7} className="text-center" style={{ padding: 60, color: 'var(--text-muted)' }}>
                  No ranking data available yet. Add performance records to see rankings.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
