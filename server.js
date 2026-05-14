import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const app = express();

app.use(cors());
app.use(express.json());

// ─── Helpers ────────────────────────────────────────────────────────
async function git(repoPath, args) {
    const { stdout } = await execAsync(`git -C "${repoPath}" ${args}`, {
        maxBuffer: 1024 * 1024 * 50,
        timeout: 15000,
    });
    return stdout.trim();
}

function auditLogPath(repoPath) {
    return path.join(repoPath, '.git', 'commander-audit.log');
}

function appendAuditLog(repoPath, action, details) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${action}: ${details}\n`;
    try {
        fs.appendFileSync(auditLogPath(repoPath), entry);
    } catch { /* ignore if .git doesn't exist yet */ }
}

// ─── 1. Dashboard: Full overview ────────────────────────────────────
app.post('/api/dashboard', async (req, res) => {
    const { path: repoPath } = req.body;
    if (!repoPath) return res.status(400).json({ error: 'Path is required' });

    try {
        // Check if .git exists
        const gitDir = path.join(repoPath, '.git');
        if (!fs.existsSync(gitDir)) {
            return res.status(400).json({ error: 'No .git directory found. This is not a Git repository.' });
        }

        // Gather all info in parallel
        const [userName, userEmail, currentBranch, remotesRaw, commitsRaw, statusRaw] = await Promise.all([
            git(repoPath, 'config user.name').catch(() => 'Not set'),
            git(repoPath, 'config user.email').catch(() => 'Not set'),
            git(repoPath, 'rev-parse --abbrev-ref HEAD').catch(() => 'No commits yet'),
            git(repoPath, 'remote -v').catch(() => ''),
            git(repoPath, 'log --all -10 --format="%H|%an|%ae|%s|%ar"').catch(() => ''),
            git(repoPath, 'status --porcelain').catch(() => ''),
        ]);

        // Parse remotes
        const remotes = {};
        if (remotesRaw) {
            remotesRaw.split('\n').forEach(line => {
                const parts = line.split(/\s+/);
                if (parts.length >= 2) {
                    const name = parts[0];
                    const url = parts[1];
                    const type = parts[2]?.replace(/[()]/g, '') || 'unknown';
                    if (!remotes[name]) remotes[name] = {};
                    remotes[name][type] = url;
                }
            });
        }

        // Parse commits
        const commits = commitsRaw ? commitsRaw.split('\n').filter(Boolean).map(line => {
            const [hash, authorName, authorEmail, message, timeAgo] = line.split('|');
            return { hash: hash?.substring(0, 7), authorName, authorEmail, message, timeAgo };
        }) : [];

        // Dirty file count
        const dirtyFiles = statusRaw ? statusRaw.split('\n').filter(Boolean).length : 0;

        res.json({
            userName,
            userEmail,
            currentBranch,
            remotes,
            commits,
            dirtyFiles,
            repoName: path.basename(repoPath),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── 2. List Branches ───────────────────────────────────────────────
app.post('/api/branches', async (req, res) => {
    const { path: repoPath } = req.body;
    if (!repoPath) return res.status(400).json({ error: 'Path is required' });

    try {
        const raw = await git(repoPath, 'branch -a --format="%(refname:short)|%(objectname:short)|%(committerdate:relative)|%(upstream:short)|%(HEAD)"').catch(() => '');

        const branches = raw ? raw.split('\n').filter(Boolean).map(line => {
            const [name, hash, lastCommit, upstream, head] = line.split('|');
            return {
                name: name.trim(),
                hash,
                lastCommit,
                upstream: upstream || null,
                isCurrent: head?.trim() === '*',
                isRemote: name.startsWith('origin/') || name.includes('/'),
            };
        }) : [];

        res.json(branches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── 3. Update Git Config ───────────────────────────────────────────
app.post('/api/config/update', async (req, res) => {
    const { path: repoPath, name, email, global } = req.body;
    if (!repoPath) return res.status(400).json({ error: 'Path is required' });

    try {
        const scope = global ? '--global' : '--local';
        if (name) {
            await git(repoPath, `config ${scope} user.name "${name}"`);
        }
        if (email) {
            await git(repoPath, `config ${scope} user.email "${email}"`);
        }
        appendAuditLog(repoPath, 'CONFIG_UPDATE', `Set name="${name || '(unchanged)'}", email="${email || '(unchanged)'}" (${global ? 'global' : 'local'})`);
        res.json({ success: true, message: 'Git config updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── 4. Remote Management ───────────────────────────────────────────
app.post('/api/remote/add', async (req, res) => {
    const { path: repoPath, name, url } = req.body;
    try {
        await git(repoPath, `remote add ${name} "${url}"`);
        appendAuditLog(repoPath, 'REMOTE_ADD', `Added remote "${name}" -> ${url}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/remote/update', async (req, res) => {
    const { path: repoPath, name, url } = req.body;
    try {
        await git(repoPath, `remote set-url ${name} "${url}"`);
        appendAuditLog(repoPath, 'REMOTE_UPDATE', `Updated remote "${name}" -> ${url}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/remote/remove', async (req, res) => {
    const { path: repoPath, name } = req.body;
    try {
        await git(repoPath, `remote remove ${name}`);
        appendAuditLog(repoPath, 'REMOTE_REMOVE', `Removed remote "${name}"`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/remote/validate', async (req, res) => {
    const { url } = req.body;
    try {
        await execAsync(`git ls-remote "${url}"`, { timeout: 10000 });
        res.json({ valid: true });
    } catch {
        res.json({ valid: false });
    }
});

// ─── 5. Branch Operations ───────────────────────────────────────────
app.post('/api/branch/delete', async (req, res) => {
    const { path: repoPath, branches, force } = req.body;
    const flag = force ? '-D' : '-d';
    const results = [];
    for (const branch of branches) {
        try {
            await git(repoPath, `branch ${flag} "${branch}"`);
            appendAuditLog(repoPath, 'BRANCH_DELETE', `Deleted branch "${branch}"`);
            results.push({ branch, success: true });
        } catch (error) {
            results.push({ branch, success: false, error: error.message });
        }
    }
    res.json(results);
});

app.post('/api/branch/checkout', async (req, res) => {
    const { path: repoPath, branch } = req.body;
    try {
        await git(repoPath, `checkout "${branch}"`);
        appendAuditLog(repoPath, 'BRANCH_CHECKOUT', `Checked out "${branch}"`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── 6. Reinitialize ────────────────────────────────────────────────
app.post('/api/reinitialize', async (req, res) => {
    const { path: repoPath, userName, userEmail, remoteUrl } = req.body;
    if (!repoPath) return res.status(400).json({ error: 'Path is required' });

    try {
        const gitDir = path.join(repoPath, '.git');

        // Backup old .git
        if (fs.existsSync(gitDir)) {
            const backupName = `.git_backup_${Date.now()}`;
            const backupPath = path.join(repoPath, backupName);
            fs.cpSync(gitDir, backupPath, { recursive: true });
            fs.rmSync(gitDir, { recursive: true, force: true });
            appendAuditLog(repoPath, 'REINIT_BACKUP', `Backed up .git to ${backupName}`);
        }

        // Fresh init
        await git(repoPath, 'init');
        if (userName) await git(repoPath, `config user.name "${userName}"`);
        if (userEmail) await git(repoPath, `config user.email "${userEmail}"`);
        if (remoteUrl) await git(repoPath, `remote add origin "${remoteUrl}"`);

        // Stage and initial commit
        await git(repoPath, 'add .');
        await git(repoPath, 'commit -m "Initial commit (reinitialized by Git Commander)"');

        res.json({ success: true, message: 'Repository reinitialized successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── 7. Dry Run Preview ─────────────────────────────────────────────
app.post('/api/preview', async (req, res) => {
    const { path: repoPath, action, payload } = req.body;

    const preview = [];

    if (action === 'config') {
        if (payload.name) preview.push(`git config ${payload.global ? '--global' : '--local'} user.name "${payload.name}"`);
        if (payload.email) preview.push(`git config ${payload.global ? '--global' : '--local'} user.email "${payload.email}"`);
    }
    if (action === 'remote-add') {
        preview.push(`git remote add ${payload.name} "${payload.url}"`);
    }
    if (action === 'remote-update') {
        preview.push(`git remote set-url ${payload.name} "${payload.url}"`);
    }
    if (action === 'remote-remove') {
        preview.push(`git remote remove ${payload.name}`);
    }
    if (action === 'branch-delete') {
        payload.branches.forEach(b => preview.push(`git branch ${payload.force ? '-D' : '-d'} "${b}"`));
    }
    if (action === 'reinitialize') {
        preview.push('# Backup .git -> .git_backup_<timestamp>');
        preview.push('rm -rf .git');
        preview.push('git init');
        if (payload.userName) preview.push(`git config user.name "${payload.userName}"`);
        if (payload.userEmail) preview.push(`git config user.email "${payload.userEmail}"`);
        if (payload.remoteUrl) preview.push(`git remote add origin "${payload.remoteUrl}"`);
        preview.push('git add .');
        preview.push('git commit -m "Initial commit (reinitialized by Git Commander)"');
    }

    res.json({ commands: preview });
});

// ─── 8. Audit Log ───────────────────────────────────────────────────
app.post('/api/audit-log', async (req, res) => {
    const { path: repoPath } = req.body;
    try {
        const logFile = auditLogPath(repoPath);
        if (fs.existsSync(logFile)) {
            const content = fs.readFileSync(logFile, 'utf-8');
            res.json({ entries: content.split('\n').filter(Boolean).reverse() });
        } else {
            res.json({ entries: [] });
        }
    } catch {
        res.json({ entries: [] });
    }
});

// ─── 9. Validate GitHub User ────────────────────────────────────────
app.post('/api/validate-github', async (req, res) => {
    const { username } = req.body;
    try {
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (response.ok) {
            const data = await response.json();
            res.json({ valid: true, name: data.name, avatar: data.avatar_url });
        } else {
            res.json({ valid: false });
        }
    } catch {
        res.json({ valid: false });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Git Commander Backend running on http://localhost:${PORT}`);
});
