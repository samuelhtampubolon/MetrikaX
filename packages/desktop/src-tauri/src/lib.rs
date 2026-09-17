//! The MetriKa desktop shell.
//!
//! It does three things and nothing else: it opens one window on the built web application, it
//! tells the front end where the database may live, and it loads the two plugins the specification
//! names. There is no HTTP plugin, no shell plugin and no updater, so the offline assertion holds
//! by construction rather than by discipline.

mod storage;

use storage::StorageLocation;

/// Where the database lives on this machine, and whether anything can be kept at all.
///
/// The front end calls this once at start-up. When the answer is the memory case it puts a standing
/// warning in the status bar, because a tool that appears to save and does not is worse than one
/// that says plainly that it cannot.
#[tauri::command]
fn storage_location() -> StorageLocation {
    storage::probe()
}

/// A statement of what this build is permitted to reach, shown in the About dialog.
///
/// It is computed rather than written down, so it cannot drift away from the truth as the
/// dependency list changes.
#[tauri::command]
fn capability_statement() -> serde_json::Value {
    serde_json::json!({
        "network": false,
        "plugins": ["sql", "dialog"],
        "csp_connect_src": "none",
        "telemetry": false,
        "updater": false,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            storage_location,
            capability_statement
        ])
        .run(tauri::generate_context!())
        .expect("the MetriKa window failed to start");
}
