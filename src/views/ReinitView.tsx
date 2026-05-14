import { useState } from 'react';
import { CheckCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { apiPost } from '../api';

interface Props {
  repoPath: string;
  onUpdated: () => void;
}

export default function ReinitView({ repoPath, onUpdated }: Props) {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewCmds, setPreviewCmds] = useState<string[] | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePreview = async () => {
    const data = await apiPost('/api/preview', {
      path: repoPath,
      action: 'reinitialize',
      payload: { userName, userEmail, remoteUrl },
    });
    setPreviewCmds(data.commands);
  };

  const handleReinit = async () => {
    setShowConfirm(false);
    setLoading(true);
    setMsg(null);
    try {
      await apiPost('/api/reinitialize', {
        path: repoPath,
        userName,
        userEmail,
        remoteUrl,
      });
      setMsg({ type: 'success', text: 'Repository reinitialized! A backup of your old .git folder was saved.' });
      setPreviewCmds(null);
      onUpdated();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
    setLoading(false);
  };

  return (
    <>
      <div className="page-header">
        <h2>Repository Reinitializer</h2>
        <p>Start fresh with a clean Git state. Your old .git folder is backed up automatically.</p>
      </div>

      <div className="alert alert-warning">
        <AlertTriangle size={18} />
        <span><strong>Destructive operation.</strong> This will delete the current .git directory and reinitialize the repository. A backup is always created first.</span>
      </div>

      {msg && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="card">
        <div className="card-title" style={{ marginBottom: '1rem' }}>New Repository Settings</div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Git User Name</label>
            <input className="form-input" placeholder="e.g. John Doe" value={userName} onChange={e => setUserName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Git User Email</label>
            <input className="form-input" placeholder="e.g. john@example.com" value={userEmail} onChange={e => setUserEmail(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Remote URL (optional)</label>
          <input className="form-input mono" placeholder="e.g. https://github.com/user/repo.git" value={remoteUrl} onChange={e => setRemoteUrl(e.target.value)} />
          <p className="form-hint">If provided, this will be set as the "origin" remote.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button className="btn btn-outline" onClick={handlePreview}>Preview Commands</button>
          <button className="btn btn-danger" onClick={() => setShowConfirm(true)} disabled={loading}>
            <RotateCcw size={16} /> {loading ? 'Reinitializing...' : 'Reinitialize Repository'}
          </button>
        </div>
      </div>

      {previewCmds && previewCmds.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-title" style={{ marginBottom: '0.75rem' }}>Dry Run Preview</div>
          <p className="form-hint" style={{ marginBottom: '0.75rem' }}>These are the commands that will be run:</p>
          <div className="code-block">{previewCmds.map((c, i) => <div key={i}>$ {c}</div>)}</div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>⚠️ Confirm Reinitialization</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              This will <strong>delete your entire Git history</strong> and create a fresh repository with a single initial commit. 
              Your old <code>.git</code> folder will be backed up as <code>.git_backup_&lt;timestamp&gt;</code>.
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>Are you sure you want to proceed?</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReinit}>Yes, Reinitialize</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
