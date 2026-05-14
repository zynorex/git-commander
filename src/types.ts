export interface DashboardData {
  userName: string;
  userEmail: string;
  currentBranch: string;
  remotes: Record<string, Record<string, string>>;
  commits: Commit[];
  dirtyFiles: number;
  repoName: string;
}

export interface Commit {
  hash: string;
  authorName: string;
  authorEmail: string;
  message: string;
  timeAgo: string;
}

export interface BranchInfo {
  name: string;
  hash: string;
  lastCommit: string;
  upstream: string | null;
  isCurrent: boolean;
  isRemote: boolean;
}

export type Page = 'dashboard' | 'config' | 'remotes' | 'branches' | 'reinit' | 'audit';
