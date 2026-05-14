import { useState, useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import { apiPost } from '../api';

export default function AuditView({ repoPath }: { repoPath: string }) {
  const [entries, setEntries] = useState<string[]>([]);

  useEffect(() => {
    if (!repoPath) return;
    apiPost('/api/audit-log', { path: repoPath })
      .then(data => setEntries(data.entries))
      .catch(() => {});
  }, [repoPath]);

  return (
    <>
      <div className="page-header">
        <h2>Audit Log</h2>
        <p>A record of every change Git Commander has made to this repository.</p>
      </div>

      <div className="card">
        {entries.length === 0 ? (
          <div className="empty-state">
            <ScrollText size={48} />
            <h3>No Entries Yet</h3>
            <p>When you make changes through Git Commander, they will appear here.</p>
          </div>
        ) : (
          entries.map((entry, i) => <div className="log-entry" key={i}>{entry}</div>)
        )}
      </div>
    </>
  );
}
