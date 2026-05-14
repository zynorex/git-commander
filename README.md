<div align="center">
  <br />
  <img src="https://img.icons8.com/color/120/000000/git.png" alt="Git Commander Logo" />
  <h1>Git Commander</h1>
  <p>
    <strong>The Ultimate GUI for Git Repository Management & Configuration</strong>
  </p>
  <p>
    <a href="#features">Features</a> • 
    <a href="#installation">Installation</a> • 
    <a href="#architecture">Architecture</a> • 
    <a href="#safety-first">Safety Protocol</a>
  </p>
</div>

<br />

## 🚀 Overview
**Git Commander** is an enterprise-grade desktop companion designed to solve the most common (and frustrating) Git configuration issues. Whether you are migrating repositories between GitHub accounts, fixing mismatched author emails, purging stale branches, or needing to completely wipe and reinitialize a repository safely—Git Commander provides a sleek, GitHub-inspired Dark Mode GUI to do it all in just a few clicks.

Forget about memorizing obscure Git CLI commands. Every destructive action is previewable, reversible, and explicitly audited.

---

## ✨ Features

### 📊 Comprehensive Dashboard
Get an instant read on your repository's pulse.
- **Identity Check:** Instantly view the currently active User Name and Email.
- **Repository State:** Check the current branch and uncommitted dirty files.
- **Remote Topology:** Beautiful tables displaying all configured Fetch and Push remote URLs.
- **Commit History:** A quick view of the last 10 commits, their hashes, authors, and timestamps.

### 🛠️ Configuration Wizard
Never push a commit to the wrong GitHub profile again.
- Set your Git `user.name` and `user.email` interactively.
- Apply configurations **Locally** (just for this repo) or **Globally** (for your whole machine).
- **Dry-Run Mode:** Preview the exact `git config` commands that will be executed under the hood.

### 🌐 Remote Management
Manage your repository's network connections effortlessly.
- **Add / Update / Remove** remotes (e.g., `origin`, `upstream`) through a clean UI.
- **Auto-Validation:** The app will physically ping the target URL to ensure the repository actually exists *before* you save the configuration.

### 🧹 Branch Cleanup Tool
Spring cleaning for your git tree.
- View a unified table of **Local** and **Remote** branches.
- See exactly how long ago each branch was last updated.
- **Bulk Selection:** Select multiple stale branches and delete them simultaneously.
- **Force Mode:** Toggle `-D` vs `-d` for unmerged branches.
- Quickly checkout cleanly into any existing branch.

### ☢️ Repository Reinitializer
The "Nuke and Pave" solution, made safe.
- Perfect for when a repository's history is hopelessly mangled.
- **Automatic Backup:** Before touching anything, Git Commander duplicates your current `.git` folder into a `.git_backup_<timestamp>` folder.
- Deletes the active Git tracking, runs a fresh `git init`, assigns your chosen Name/Email/Remote, and creates a clean Initial Commit—all in one click.

### 📜 Audit Log
Absolute transparency.
- Every single action you perform via Git Commander is permanently logged to a local `.git/commander-audit.log` file.
- View a chronological history of changes directly within the app's Audit View.

---

## 🏗️ Architecture & Tech Stack

Git Commander is designed with a **Node.js local backend** and a **React/Vite frontend**. This allows the UI to remain incredibly snappy while safely shelling out to the local machine's native Git executable.

### Frontend
- **React 19 & TypeScript:** Strict typing for maximum reliability.
- **Vite:** Blazing fast hot-module replacement and builds.
- **Vanilla CSS:** A custom, highly optimized design system mimicking GitHub's enterprise dark mode. No bulky UI libraries; just CSS variables, glassmorphism, and smooth micro-animations.
- **Lucide React:** Clean, consistent iconography.

### Backend
- **Node.js & Express:** A lightweight local server (`server.js`) acting as the bridge to your filesystem.
- **Native Git Integration:** Uses `child_process.exec` to run highly optimized Git commands directly against the `.git` database.
- **Zero-Dependency Git:** Does not rely on heavy NPM git wrappers. It talks to standard `git` directly.

---

## 💻 Installation & Usage

Git Commander requires **Node.js** and **Git** to be installed on your machine.

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd git-commander
```

### 2. Install Dependencies
```bash
npm install
npm install express cors
```

### 3. Start the Backend Engine
The backend server handles all the file system and Git operations. Open a terminal and run:
```bash
node server.js
```
*(By default, this will run on `http://localhost:3001` or `http://localhost:3000` depending on your configuration).*

### 4. Start the Frontend Application
Open a **second terminal window** and launch the React interface:
```bash
npm run dev
```

### 5. Access the App
Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)**. Enter the absolute path to any local Git repository in the sidebar and click **Load**!

---

## 🛡️ Safety First Protocol
We take your source code seriously.
1. **Dry Runs:** Almost every operation has a "Preview Commands" button. You will always know what terminal commands are being executed.
2. **Backups:** Destructive actions (like the Reinitializer) will **always** create a full physical copy of your `.git` folder before making modifications.
3. **Audit Trails:** If you ever wonder what settings were changed, check the Audit Log tab to see a timestamped history.

---

<div align="center">
  <p>Built for developers who value clean commit histories and flawless configurations.</p>
</div>
