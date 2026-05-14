use git2::Repository;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Hash)]
pub struct Author {
    pub name: String,
    pub email: String,
}

#[tauri::command]
fn scan_repository(path: &str) -> Result<Vec<Author>, String> {
    // Open the local repository
    let repo = Repository::open(path).map_err(|e| format!("Failed to open repository: {}", e.message()))?;
    
    let mut revwalk = repo.revwalk().map_err(|e| format!("Failed to create revwalk: {}", e.message()))?;
    
    // We walk from HEAD
    revwalk.push_head().map_err(|e| format!("Repository might be empty or missing HEAD: {}", e.message()))?;
    
    let mut unique_authors = HashSet::new();

    // Iterate through all commits
    for oid in revwalk {
        if let Ok(oid) = oid {
            if let Ok(commit) = repo.find_commit(oid) {
                let author = commit.author();
                if let (Some(name), Some(email)) = (author.name(), author.email()) {
                    unique_authors.insert(Author {
                        name: name.to_string(),
                        email: email.to_string(),
                    });
                }
                
                // Also check committer identity just in case
                let committer = commit.committer();
                if let (Some(name), Some(email)) = (committer.name(), committer.email()) {
                    unique_authors.insert(Author {
                        name: name.to_string(),
                        email: email.to_string(),
                    });
                }
            }
        }
    }

    let mut result: Vec<Author> = unique_authors.into_iter().collect();
    // Sort alphabetically by name
    result.sort_by(|a, b| a.name.cmp(&b.name));
    
    Ok(result)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![scan_repository])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
