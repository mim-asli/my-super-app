#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePoolOptions, Pool, Sqlite};
use sysinfo::System;

// ساختار نگهدارنده دیتابیس
struct AppState {
    db: Pool<Sqlite>,
}

// --- دستور ۱: وضعیت سیستم ---
#[tauri::command]
fn get_system_stats() -> String {
    let mut sys = System::new_all();
    sys.refresh_memory();
    let total_gb = sys.total_memory() / 1024 / 1024 / 1024;
    let used_gb = sys.used_memory() / 1024 / 1024 / 1024;
    format!("RAM: {} GB Used / {} GB Total", used_gb, total_gb)
}

// --- دستور ۲: ذخیره یادداشت (جدید) ---
// این تابع متن رو از فرانت‌اند می‌گیره و تو دیتابیس ذخیره می‌کنه
#[tauri::command]
async fn add_note(state: tauri::State<'_, AppState>, text: String) -> Result<String, String> {
    // دستور SQL برای وارد کردن داده
    let query = "INSERT INTO notes (title, content) VALUES ('New Note', $1)";
    
    sqlx::query(query)
        .bind(text) // متن کاربر رو می‌ذاره جای $1
        .execute(&state.db) // روی دیتابیس اجرا می‌کنه
        .await
        .map_err(|e| e.to_string())?; // اگه ارور داد، متنش رو برگردون

    Ok("Note saved successfully!".to_string())
}

// --- شروع برنامه ---
#[tokio::main]
async fn main() {
    const DB_URL: &str = "sqlite://app.db";

    if !Sqlite::database_exists(DB_URL).await.unwrap_or(false) {
        Sqlite::create_database(DB_URL).await.unwrap();
    }

    let db_pool = SqlitePoolOptions::new()
        .connect(DB_URL)
        .await
        .expect("Failed to connect to database");

    // ساخت جدول (اگر نباشد)
    sqlx::query("CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )").execute(&db_pool).await.expect("Failed to create table");

    tauri::Builder::default()
        .manage(AppState { db: db_pool }) 
        // نکته مهم: دستور جدید رو اینجا اضافه کردیم 👇
        .invoke_handler(tauri::generate_handler![get_system_stats, add_note])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}