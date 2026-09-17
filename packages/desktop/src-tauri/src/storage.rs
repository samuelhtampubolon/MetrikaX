//! The portable storage probe.
//!
//! `desktop.portable_build.storage_probe_order` states three places to try, in order:
//!
//!   1. the directory containing the executable, if it is writable
//!   2. `%LOCALAPPDATA%/MetriKa`, or the platform equivalent
//!   3. memory only, with a visible warning that progress will not persist
//!
//! The first is what makes the portable build work from a flash drive on a machine that forbids
//! installation, which `why_it_matters` calls the difference between a tool that is used and a tool
//! that is admired and then closed.
//!
//! Writability is decided by writing a file and deleting it, not by reading a permission bit. A
//! read-only mount, a full disk and a policy that denies writes all report differently, and the only
//! answer that matters is whether a write succeeds.

use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum StorageKind {
    /// Beside the executable: the portable case.
    Portable,
    /// The per-user application data directory.
    UserProfile,
    /// Nothing could be written anywhere. The application still computes; it keeps nothing.
    Memory,
}

#[derive(Debug, Clone, Serialize)]
pub struct StorageLocation {
    pub kind: StorageKind,
    /// The directory chosen, or an empty string when nothing is writable.
    pub directory: String,
    /// The database path, or an empty string in the memory case.
    pub database: String,
    /// True when the application must warn that progress will not persist.
    pub ephemeral: bool,
}

const DATABASE_FILE: &str = "metrika.db";
const PROBE_FILE: &str = ".metrika-write-probe";

/// Can this directory actually be written to right now?
fn is_writable(directory: &Path) -> bool {
    if fs::create_dir_all(directory).is_err() {
        return false;
    }
    let probe = directory.join(PROBE_FILE);
    match fs::write(&probe, b"metrika") {
        Ok(()) => {
            let _ = fs::remove_file(&probe);
            true
        }
        Err(_) => false,
    }
}

/// The directory holding the running executable, when it can be determined.
fn executable_directory() -> Option<PathBuf> {
    std::env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(Path::to_path_buf))
}

/// `%LOCALAPPDATA%/MetriKa` on Windows, and the platform equivalent elsewhere.
fn user_profile_directory() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        std::env::var_os("LOCALAPPDATA").map(|base| PathBuf::from(base).join("MetriKa"))
    }
    #[cfg(target_os = "macos")]
    {
        std::env::var_os("HOME")
            .map(|home| PathBuf::from(home).join("Library/Application Support/MetriKa"))
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        if let Some(base) = std::env::var_os("XDG_DATA_HOME") {
            return Some(PathBuf::from(base).join("metrika"));
        }
        std::env::var_os("HOME").map(|home| PathBuf::from(home).join(".local/share/metrika"))
    }
}

/// Run the probe and report where the data will live.
pub fn probe() -> StorageLocation {
    if let Some(directory) = executable_directory() {
        if is_writable(&directory) {
            return StorageLocation {
                kind: StorageKind::Portable,
                database: directory.join(DATABASE_FILE).to_string_lossy().into_owned(),
                directory: directory.to_string_lossy().into_owned(),
                ephemeral: false,
            };
        }
    }

    if let Some(directory) = user_profile_directory() {
        if is_writable(&directory) {
            return StorageLocation {
                kind: StorageKind::UserProfile,
                database: directory.join(DATABASE_FILE).to_string_lossy().into_owned(),
                directory: directory.to_string_lossy().into_owned(),
                ephemeral: false,
            };
        }
    }

    StorageLocation {
        kind: StorageKind::Memory,
        directory: String::new(),
        database: String::new(),
        ephemeral: true,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_writable_directory_is_reported_as_writable() {
        let directory = std::env::temp_dir().join("metrika-probe-writable");
        assert!(is_writable(&directory));
        // The probe file is removed again, so nothing is left behind beside the executable.
        assert!(!directory.join(PROBE_FILE).exists());
        let _ = fs::remove_dir_all(&directory);
    }

    #[test]
    fn a_path_that_cannot_be_created_is_not_writable() {
        // A directory under a file, which no platform will create.
        let file = std::env::temp_dir().join("metrika-probe-file");
        fs::write(&file, b"x").expect("the temporary file should be writable");
        assert!(!is_writable(&file.join("child")));
        let _ = fs::remove_file(&file);
    }

    #[test]
    fn the_probe_always_answers_with_a_usable_location() {
        let location = probe();
        match location.kind {
            StorageKind::Memory => {
                assert!(location.ephemeral);
                assert!(location.database.is_empty());
            }
            _ => {
                assert!(!location.ephemeral);
                assert!(location.database.ends_with(DATABASE_FILE));
            }
        }
    }
}
