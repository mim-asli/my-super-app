#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePoolOptions, Pool, Sqlite, FromRow};
use sysinfo::System;
use serde::Serialize; // برای اینکه بتونیم داده رو به جیسون تبدیل کنیم

// ساختار دیتابیس
struct AppState {
    db: Pool<Sqlite>,
}

// ساختار یک یادداشت (دقیقاً مثل جدول دیتابیس)
#[derive(Debug, Serialize, FromRow)]
struct Note {
    id: i64,
    title: String,
    content: Option<String>,
    // تاریخ رو فعلاً نمی‌گیریم تا پیچیده نشه
}

// --- دستور ۱: رم سیستم ---
#[tauri::command]
fn get_system_stats() -> String {
    let mut sys = System::new_all();
    sys.refresh_memory();
    let total_gb = sys.total_memory() / 1024 / 1024 / 1024;
    let used_gb = sys.used_memory() / 1024 / 1024 / 1024;
    format!("RAM: {} GB Used / {} GB Total", used_gb, total_gb)
}

// --- دستور ۲: ذخیره یادداشت ---
#[tauri::command]
async fn add_note(state: tauri::State<'_, AppState>, text: String) -> Result<String, String> {
    let query = "INSERT INTO notes (title, content) VALUES ('Note', $1)";
    sqlx::query(query)
        .bind(text)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    Ok("Saved!".to_string())
}

// --- دستور ۳: گرفتن لیست یادداشت‌ها (جدید) ---
#[tauri::command]
async fn get_notes(state: tauri::State<'_, AppState>) -> Result<Vec<Note>, String> {
    // همه یادداشت‌ها رو بگیر و بر اساس جدیدترین مرتب کن
    let notes = sqlx::query_as::<_, Note>("SELECT id, title, content FROM notes ORDER BY id DESC")
        .fetch_all(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(notes)
}

// --- دستور ۴: حذف یادداشت ---
#[tauri::command]
async fn delete_note(state: tauri::State<'_, AppState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM notes WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

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

    sqlx::query("CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )").execute(&db_pool).await.expect("Failed to create table");

    tauri::Builder::default()
        .manage(AppState { db: db_pool }) 
        // دستور get_notes رو اینجا اضافه کردیم 👇
        .invoke_handler(tauri::generate_handler![get_system_stats, add_note, get_notes, delete_note])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}