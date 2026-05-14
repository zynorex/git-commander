import { useState } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { apiPost } from '../api';

interface Props {
  repoPath: string;
  onUpdated: () => void;
}

export default function ConfigView({ repoPath, onUpdated }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewCmds, setPreviewCmds] = useState<string[] | null>(null);

  const handlePreview = async () => {
    const data = await apiPost('/api/preview', {
      path: repoPath,
      action: 'config',
      payload: { name, email, global: isGlobal },
    });
    setPreviewCmds(data.commands);
  };

  const handleSave = async () => {
    if (!name && !email) { setMsg({ type: 'error', text: 'Enter at least a name or email.' }); return; }
    setLoading(true);
    setMsg(null);
    try {
      await apiPost('/api/config/update', { path: repoPath, name, email, global: isGlobal });
      setMsg({ type: 'success', text: 'Git config updated successfully!' });
      setPreviewCmds(null);
      onUpdated();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Configuration Wizard</h2>
        <p>Update your Git user identity for this repository or globally.</p>
      </div>

      {msg && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="card">
        <div className="card-title" style={{ marginBottom: '1rem' }}>Set Git Identity</div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">User Name</label>
            <input className="form-input" placeholder="e.g. John Doe" value={name} onChange={e => setName(e.target.value)} />
            <p className="form-hint">This will appear as the author on your commits.</p>
          </div>
          <div className="form-group">
            <label className="form-label">User Email</label>
            <input className="form-input" placeholder="e.g. john@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            <p className="form-hint">Must match your GitHub account email for commit attribution.</p>
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-row" style={{ width: 'fit-content' }}>
            <input type="checkbox" checked={isGlobal} onChange={e => setIsGlobal(e.target.checked)} />
            <span>Apply globally (affects all repositories on this machine)</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button className="btn btn-outline" onClick={handlePreview}>Preview Commands</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {previewCmds && previewCmds.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-title" style={{ marginBottom: '0.75rem' }}>Dry Run Preview</div>
          <p className="form-hint" style={{ marginBottom: '0.75rem' }}>These commands will be executed when you click "Save Configuration":</p>
          <div className="code-block">{previewCmds.map((c, i) => <div key={i}>$ {c}</div>)}</div>
        </div>
      )}
    </>
  );
}
