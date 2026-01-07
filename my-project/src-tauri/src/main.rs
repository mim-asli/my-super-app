#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// تغییر: حذف SystemExt چون در نسخه جدید لازم نیست
use sysinfo::System; 

#[tauri::command]
fn get_system_stats() -> String {
    let mut sys = System::new_all();
    sys.refresh_memory(); 

    // در نسخه جدید، این توابع مستقیم روی sys صدا زده می‌شوند
    let total_ram = sys.total_memory();
    let used_ram = sys.used_memory();

    // تبدیل بایت به گیگابایت
    let total_gb = total_ram / 1024 / 1024 / 1024;
    let used_gb = used_ram / 1024 / 1024 / 1024;

    format!("RAM: {} GB Used / {} GB Total", used_gb, total_gb)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_system_stats])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}