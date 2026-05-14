import { useState } from 'react';
import { CheckCircle, AlertTriangle, Plus, Trash2, ExternalLink } from 'lucide-react';
import { apiPost } from '../api';
import type { DashboardData } from '../types';

interface Props {
  repoPath: string;
  data: DashboardData | null;
  onUpdated: () => void;
}

export default function RemotesView({ repoPath, data, onUpdated }: Props) {
  const [remoteName, setRemoteName] = useState('origin');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [mode, setMode] = useState<'add' | 'update'>('add');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validating, setValidating] = useState(false);
  const [validResult, setValidResult] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const remoteEntries = data ? Object.entries(data.remotes) : [];

  const handleValidate = async () => {
    if (!remoteUrl) return;
    setValidating(true);
    setValidResult(null);
    try {
      const res = await apiPost('/api/remote/validate', { url: remoteUrl });
      setValidResult(res.valid);
    } catch { setValidResult(false); }
    setValidating(false);
  };

  const handleSubmit = async () => {
    if (!remoteName || !remoteUrl) { setMsg({ type: 'error', text: 'Both name and URL are required.' }); return; }
    setLoading(true);
    setMsg(null);
    try {
      const endpoint = mode === 'add' ? '/api/remote/add' : '/api/remote/update';
      await apiPost(endpoint, { path: repoPath, name: remoteName, url: remoteUrl });
      setMsg({ type: 'success', text: `Remote "${remoteName}" ${mode === 'add' ? 'added' : 'updated'} successfully.` });
      setRemoteUrl('');
      onUpdated();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
    setLoading(false);
  };

  const handleRemove = async (name: string) => {
    if (!confirm(`Are you sure you want to remove remote "${name}"?`)) return;
    try {
      await apiPost('/api/remote/remove', { path: repoPath, name });
      setMsg({ type: 'success', text: `Remote "${name}" removed.` });
      onUpdated();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Remote Management</h2>
        <p>Add, update, or remove remote URLs. Validate that a remote exists before setting it.</p>
      </div>

      {msg && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Existing remotes table */}
      {remoteEntries.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: '0.75rem' }}>Current Remotes</div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>URL</th><th></th></tr></thead>
              <tbody>
                {remoteEntries.map(([name, urls]) => (
                  <tr key={name}>
                    <td><span className="badge badge-blue">{name}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{urls.fetch || urls.push}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-sm btn-danger" onClick={() => handleRemove(name)}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Update Form */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button className={`btn btn-sm ${mode === 'add' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('add')}>
            <Plus size={14} /> Add New
          </button>
          <button className={`btn btn-sm ${mode === 'update' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('update')}>
            <ExternalLink size={14} /> Update Existing
          </button>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Remote Name</label>
            <input className="form-input" placeholder="e.g. origin" value={remoteName} onChange={e => setRemoteName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Remote URL</label>
            <input className="form-input mono" placeholder="e.g. https://github.com/user/repo.git" value={remoteUrl} onChange={e => { setRemoteUrl(e.target.value); setValidResult(null); }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={handleValidate} disabled={validating || !remoteUrl}>
            {validating ? 'Checking...' : 'Validate URL'}
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : (mode === 'add' ? 'Add Remote' : 'Update Remote')}
          </button>
          {validResult === true && <span className="badge badge-green"><CheckCircle size={12} /> URL is reachable</span>}
          {validResult === false && <span className="badge badge-red"><AlertTriangle size={12} /> URL is unreachable</span>}
        </div>
      </div>
    </>
  );
}
