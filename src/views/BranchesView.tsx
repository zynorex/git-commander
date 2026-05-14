import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Trash2, GitBranch } from 'lucide-react';
import { apiPost } from '../api';
import type { BranchInfo } from '../types';

interface Props {
  repoPath: string;
  onUpdated: () => void;
}

export default function BranchesView({ repoPath, onUpdated }: Props) {
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [force, setForce] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewCmds, setPreviewCmds] = useState<string[] | null>(null);

  const fetchBranches = async () => {
    try {
      const data = await apiPost('/api/branches', { path: repoPath });
      setBranches(data);
    } catch { /* empty */ }
  };

  useEffect(() => { fetchBranches(); }, [repoPath]);

  const localBranches = branches.filter(b => !b.isRemote);
  const remoteBranches = branches.filter(b => b.isRemote);

  const toggleSelect = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handlePreview = async () => {
    const data = await apiPost('/api/preview', {
      path: repoPath,
      action: 'branch-delete',
      payload: { branches: Array.from(selected), force },
    });
    setPreviewCmds(data.commands);
  };

  const handleDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} branch(es)? This cannot be undone easily.`)) return;
    setLoading(true);
    setMsg(null);
    try {
      const results = await apiPost('/api/branch/delete', {
        path: repoPath,
        branches: Array.from(selected),
        force,
      });
      const failed = results.filter((r: any) => !r.success);
      if (failed.length > 0) {
        setMsg({ type: 'error', text: `${failed.length} branch(es) failed. Try enabling "Force delete".` });
      } else {
        setMsg({ type: 'success', text: `${selected.size} branch(es) deleted successfully.` });
        setSelected(new Set());
        setPreviewCmds(null);
      }
      fetchBranches();
      onUpdated();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
    setLoading(false);
  };

  const handleCheckout = async (branch: string) => {
    try {
      await apiPost('/api/branch/checkout', { path: repoPath, branch });
      setMsg({ type: 'success', text: `Switched to branch "${branch}".` });
      fetchBranches();
      onUpdated();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Branch Cleanup</h2>
        <p>View all branches, delete stale ones, and switch to a clean branch.</p>
      </div>

      {msg && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Local Branches */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><GitBranch size={18} /> Local Branches ({localBranches.length})</span>
          {selected.size > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selected.size} selected</span>
              <button className="btn btn-sm btn-outline" onClick={handlePreview}>Preview</button>
              <button className="btn btn-sm btn-danger" onClick={handleDelete} disabled={loading}>
                <Trash2 size={14} /> Delete Selected
              </button>
            </div>
          )}
        </div>

        {localBranches.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No local branches found.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th style={{width:32}}></th><th>Branch</th><th>Last Commit</th><th>Tracking</th><th></th></tr></thead>
              <tbody>
                {localBranches.map(b => (
                  <tr key={b.name}>
                    <td>
                      {!b.isCurrent && (
                        <input type="checkbox" checked={selected.has(b.name)} onChange={() => toggleSelect(b.name)} style={{ accentColor: 'var(--accent-blue)', cursor: 'pointer' }} />
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{b.name}</span>
                      {b.isCurrent && <span className="badge badge-green" style={{ marginLeft: '0.5rem' }}>current</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{b.lastCommit}</td>
                    <td>{b.upstream ? <span className="badge badge-purple">{b.upstream}</span> : <span style={{ color: 'var(--text-muted)' }}>none</span>}</td>
                    <td style={{ textAlign: 'right' }}>
                      {!b.isCurrent && (
                        <button className="btn btn-sm btn-outline" onClick={() => handleCheckout(b.name)}>Checkout</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '0.75rem' }}>
          <label className="checkbox-row" style={{ width: 'fit-content' }}>
            <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} />
            <span style={{ fontSize: '0.85rem' }}>Force delete (use -D instead of -d, required for unmerged branches)</span>
          </label>
        </div>
      </div>

      {/* Remote Branches */}
      {remoteBranches.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-title" style={{ marginBottom: '0.75rem' }}>Remote Branches ({remoteBranches.length})</div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Branch</th><th>Last Commit</th></tr></thead>
              <tbody>
                {remoteBranches.map(b => (
                  <tr key={b.name}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{b.name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{b.lastCommit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewCmds && previewCmds.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-title" style={{ marginBottom: '0.75rem' }}>Dry Run Preview</div>
          <div className="code-block">{previewCmds.map((c, i) => <div key={i}>$ {c}</div>)}</div>
        </div>
      )}
    </>
  );
}
