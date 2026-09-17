// Prevents an additional console window on Windows in release. The application is a window, not a
// command line tool, and a console flashing up behind it looks like a fault.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    metrika_lib::run()
}
