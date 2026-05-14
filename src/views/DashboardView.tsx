import { User, Mail, GitBranch, Globe, FileWarning, GitCommit } from 'lucide-react';
import type { DashboardData } from '../types';

export default function DashboardView({ data }: { data: DashboardData | null }) {
  if (!data) {
    return (
      <div className="empty-state">
        <GitCommit size={48} />
        <h3>No Repository Loaded</h3>
        <p>Enter a repository path in the sidebar and click "Load" to get started.</p>
      </div>
    );
  }

  const remoteEntries = Object.entries(data.remotes);

  return (
    <>
      <div className="page-header">
        <h2>Dashboard — {data.repoName}</h2>
        <p>Overview of your repository's current Git configuration.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label"><User size={14} /> User Name</div>
          <div className={`stat-value ${data.userName === 'Not set' ? 'orange' : 'green'}`}>{data.userName}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Mail size={14} /> User Email</div>
          <div className={`stat-value ${data.userEmail === 'Not set' ? 'orange' : 'green'}`}>{data.userEmail}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><GitBranch size={14} /> Current Branch</div>
          <div className="stat-value blue">{data.currentBranch}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><FileWarning size={14} /> Uncommitted Changes</div>
          <div className={`stat-value ${data.dirtyFiles > 0 ? 'orange' : 'green'}`}>
            {data.dirtyFiles > 0 ? `${data.dirtyFiles} file(s)` : 'Clean'}
          </div>
        </div>
      </div>

      {/* Remotes */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Globe size={18} /> Remotes</span>
        </div>
        {remoteEntries.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No remotes configured.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Fetch URL</th><th>Push URL</th></tr></thead>
              <tbody>
                {remoteEntries.map(([name, urls]) => (
                  <tr key={name}>
                    <td><span className="badge badge-blue">{name}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{urls.fetch || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{urls.push || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Commits */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <span className="card-title"><GitCommit size={18} /> Recent Commits</span>
        </div>
        {data.commits.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No commits yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Hash</th><th>Author</th><th>Message</th><th>When</th></tr></thead>
              <tbody>
                {data.commits.map((c) => (
                  <tr key={c.hash}>
                    <td><span className="hash">{c.hash}</span></td>
                    <td>{c.authorName}</td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.message}</td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{c.timeAgo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
