import { useState } from "react";
import { Search, GitCommit, AlertTriangle, ArrowRight, User } from "lucide-react";
import "./App.css";

interface Author {
  name: string;
  email: string;
}

function App() {
  const [repoPath, setRepoPath] = useState<string>("");
  const [authors, setAuthors] = useState<Author[]>([]);
  const [mappings, setMappings] = useState<Record<string, Author>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScanRepo = async () => {
    if (!repoPath.trim()) {
      setError("Please enter a valid directory path.");
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanComplete(false);

    try {
      const response = await fetch("http://localhost:3001/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: repoPath })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to scan repository");
      }
      
      const discoveredAuthors = await response.json();
      setAuthors(discoveredAuthors);
      setScanComplete(true);
      
      // Initialize mappings
      const initialMappings: Record<string, Author> = {};
      discoveredAuthors.forEach((a: Author) => {
        initialMappings[a.email] = { name: "", email: "" };
      });
      setMappings(initialMappings);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdateMapping = (oldEmail: string, field: 'name' | 'email', value: string) => {
    setMappings(prev => ({
      ...prev,
      [oldEmail]: {
        ...prev[oldEmail],
        [field]: value
      }
    }));
  };

  const handleRewrite = async () => {
    // In future: send mappings to backend to perform git filter-repo
    alert("This feature is under construction! This will rewrite the history with your new mappings.");
  };

  return (
    <div className="container">
      <div className="header-container">
        <h1 className="title">
          <GitCommit color="var(--accent-color)" size={36} />
          Git History Rewriter
        </h1>
        <p className="subtitle">Safely change past commit authors before pushing to a new account.</p>
      </div>

      {error && (
        <div className="alert-warning">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1 */}
      <div className="card">
        <h2 className="step-title"><span className="step-number">1</span> Select Local Repository</h2>
        <div className="form-group">
          <label>Absolute path to your project folder</label>
          <div className="path-input-wrapper">
            <input 
              type="text" 
              placeholder="e.g. C:\Projects\my-awesome-repo"
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScanRepo()}
            />
            <button 
              className="btn btn-secondary" 
              onClick={handleScanRepo}
              disabled={isScanning}
            >
              {isScanning ? "Scanning..." : <><Search size={18} /> Scan</>}
            </button>
          </div>
          <p className="helper-text">We will look for a .git folder inside this directory.</p>
        </div>
      </div>

      {/* STEP 2 */}
      {scanComplete && authors.length === 0 && (
        <div className="card">
          <p style={{ margin: 0, textAlign: 'center', color: 'var(--text-secondary)' }}>
            No commits found in this repository.
          </p>
        </div>
      )}

      {scanComplete && authors.length > 0 && (
        <div className="card animate-fade-in">
          <h2 className="step-title"><span className="step-number">2</span> Update Identities</h2>
          <p className="helper-text" style={{ marginBottom: '1.5rem' }}>
            We found {authors.length} unique author(s) in the commit history. 
            Enter a new name and email for the ones you want to overwrite. 
            <strong> If left blank, the original author will remain unchanged.</strong>
          </p>

          <div className="author-list">
            {authors.map((author) => (
              <div className="author-item" key={author.email}>
                <div className="author-header">
                  <div className="author-old-info">
                    <User size={20} color="var(--text-secondary)" />
                    <div>
                      <div style={{ fontWeight: 600 }}>{author.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{author.email}</div>
                    </div>
                  </div>
                  <span className="badge">Original Author</span>
                </div>

                <div className="new-inputs-grid">
                  <div className="form-group">
                    <label>Change Name To (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Satoshi Nakamoto"
                      value={mappings[author.email]?.name || ""}
                      onChange={(e) => handleUpdateMapping(author.email, 'name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Change Email To (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. satoshi@bitcoin.org"
                      value={mappings[author.email]?.email || ""}
                      onChange={(e) => handleUpdateMapping(author.email, 'email', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {scanComplete && authors.length > 0 && (
        <div className="card animate-fade-in" style={{ borderColor: 'rgba(248, 81, 73, 0.4)' }}>
          <h2 className="step-title" style={{ color: '#ff7b72' }}>
            <span className="step-number" style={{ background: '#ff7b72', color: 'white' }}>3</span> 
            Execute Rewrite
          </h2>
          <p className="helper-text" style={{ marginBottom: '1.5rem' }}>
            This process will modify your local Git history. A backup of your .git folder will be created automatically before any changes are made.
          </p>
          <button className="btn btn-primary" onClick={handleRewrite} style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem' }}>
            Rewrite History <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
