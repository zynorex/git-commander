import { useState, useCallback } from 'react';
import {
  LayoutDashboard, Settings, Globe, GitBranch, RotateCcw, ScrollText, GitCommit,
} from 'lucide-react';
import { apiPost } from './api';
import type { DashboardData, Page } from './types';

import DashboardView from './views/DashboardView';
import ConfigView from './views/ConfigView';
import RemotesView from './views/RemotesView';
import BranchesView from './views/BranchesView';
import ReinitView from './views/ReinitView';
import AuditView from './views/AuditView';

import './App.css';

const NAV_ITEMS: { key: Page; label: string; icon: React.ReactNode; section?: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, section: 'Overview' },
  { key: 'config', label: 'Config Wizard', icon: <Settings size={18} />, section: 'Tools' },
  { key: 'remotes', label: 'Remotes', icon: <Globe size={18} /> },
  { key: 'branches', label: 'Branch Cleanup', icon: <GitBranch size={18} /> },
  { key: 'reinit', label: 'Reinitializer', icon: <RotateCcw size={18} /> },
  { key: 'audit', label: 'Audit Log', icon: <ScrollText size={18} />, section: 'History' },
];

function App() {
  const [repoPath, setRepoPath] = useState('');
  const [page, setPage] = useState<Page>('dashboard');
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRepo = useCallback(async (path?: string) => {
    const target = path ?? repoPath;
    if (!target.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost('/api/dashboard', { path: target });
      setDashData(data);
    } catch (err: any) {
      setError(err.message);
      setDashData(null);
    }
    setLoading(false);
  }, [repoPath]);

  const handleLoad = () => loadRepo();
  const handleRefresh = () => loadRepo();

  let currentSection = '';

  return (
    <>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1><GitCommit size={22} color="var(--accent-blue)" /> Git Commander</h1>
          <p>Repository Configuration Tool</p>
        </div>

        {/* Repo Path Input */}
        <div className="repo-selector">
          <label>Repository Path</label>
          <div className="repo-selector-input-row">
            <input
              type="text"
              placeholder="C:\Projects\my-app"
              value={repoPath}
              onChange={e => setRepoPath(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLoad()}
            />
            <button onClick={handleLoad} disabled={loading}>
              {loading ? '...' : 'Load'}
            </button>
          </div>
          {error && <div className="repo-status error">{error}</div>}
          {dashData && <div className="repo-status success">✓ {dashData.repoName} loaded</div>}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => {
            const showSection = item.section && item.section !== currentSection;
            if (item.section) currentSection = item.section;
            return (
              <div key={item.key}>
                {showSection && <div className="nav-section-title">{item.section}</div>}
                <button
                  className={`nav-item ${page === item.key ? 'active' : ''}`}
                  onClick={() => setPage(item.key)}
                >
                  {item.icon} {item.label}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          v1.0.0 — Built for developers
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-area">
        {page === 'dashboard' && <DashboardView data={dashData} />}
        {page === 'config' && (
          repoPath ? <ConfigView repoPath={repoPath} onUpdated={handleRefresh} />
          : <NoRepo />
        )}
        {page === 'remotes' && (
          repoPath ? <RemotesView repoPath={repoPath} data={dashData} onUpdated={handleRefresh} />
          : <NoRepo />
        )}
        {page === 'branches' && (
          repoPath ? <BranchesView repoPath={repoPath} onUpdated={handleRefresh} />
          : <NoRepo />
        )}
        {page === 'reinit' && (
          repoPath ? <ReinitView repoPath={repoPath} onUpdated={handleRefresh} />
          : <NoRepo />
        )}
        {page === 'audit' && (
          repoPath ? <AuditView repoPath={repoPath} />
          : <NoRepo />
        )}
      </main>
    </>
  );
}

function NoRepo() {
  return (
    <div className="empty-state">
      <GitCommit size={48} />
      <h3>No Repository Selected</h3>
      <p>Enter a repository path in the sidebar and click "Load" to begin.</p>
    </div>
  );
}

export default App;
