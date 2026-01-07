#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rand::Rng; // برای تولید عدد تصادفی
use serde::Serialize;
use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePoolOptions, FromRow, Pool, Sqlite};
use sysinfo::System;

// --- ساختارها (Structs) ---

// نگهداری اتصال دیتابیس در حافظه
struct AppState {
    db: Pool<Sqlite>,
}

// ساختار یادداشت برای ارسال به فرانت‌اند
#[derive(Debug, Serialize, FromRow)]
struct Note {
    id: i64,
    title: String,
    content: Option<String>,
}

// --- دستورات (Commands) ---

// 1. دریافت وضعیت سیستم (رم)
#[tauri::command]
fn get_system_stats() -> String {
    let mut sys = System::new_all();
    sys.refresh_memory();
    let total_gb = sys.total_memory() / 1024 / 1024 / 1024;
    let used_gb = sys.used_memory() / 1024 / 1024 / 1024;
    format!("RAM: {} GB Used / {} GB Total", used_gb, total_gb)
}

// 2. ذخیره یادداشت جدید
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

// 3. گرفتن لیست یادداشت‌ها
#[tauri::command]
async fn get_notes(state: tauri::State<'_, AppState>) -> Result<Vec<Note>, String> {
    let notes = sqlx::query_as::<_, Note>("SELECT id, title, content FROM notes ORDER BY id DESC")
        .fetch_all(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    Ok(notes)
}

// 4. حذف یادداشت
#[tauri::command]
async fn delete_note(state: tauri::State<'_, AppState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM notes WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

// 5. تولید رمز عبور امن (Secure Password Generator)
#[tauri::command]
fn generate_password(length: usize, has_numbers: bool, has_symbols: bool) -> String {
    // حروف پایه (انگلیسی بزرگ و کوچک)
    let mut charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".to_string();

    // اضافه کردن اعداد اگر کاربر بخواهد
    if has_numbers {
        charset.push_str("0123456789");
    }

    // اضافه کردن نمادها اگر کاربر بخواهد
    if has_symbols {
        charset.push_str("!@#$%^&*()_+-=[]{}|;:,.<>?");
    }

    // استفاده از موتور تولید عدد تصادفی امن (ThreadRng)
    let mut rng = rand::thread_rng();
    
    // انتخاب کاراکترها به صورت تصادفی و ساختن رشته نهایی
    let password: String = (0..length)
        .map(|_| {
            let idx = rng.gen_range(0..charset.len());
            charset.chars().nth(idx).unwrap()
        })
        .collect();

    password
}

// --- نقطه شروع برنامه (Main) ---
#[tokio::main]
async fn main() {
    const DB_URL: &str = "sqlite://app.db";

    // 1. ساخت دیتابیس اگر وجود نداشت
    if !Sqlite::database_exists(DB_URL).await.unwrap_or(false) {
        Sqlite::create_database(DB_URL).await.unwrap();
    }

    // 2. اتصال به دیتابیس
    let db_pool = SqlitePoolOptions::new()
        .connect(DB_URL)
        .await
        .expect("Failed to connect to database");

    // 3. ساخت جدول اگر وجود نداشت
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )",
    )
    .execute(&db_pool)
    .await
    .expect("Failed to create table");

    // 4. اجرای برنامه
    tauri::Builder::default()
        .manage(AppState { db: db_pool })
        // ثبت تمام دستورات در اینجا 👇
        .invoke_handler(tauri::generate_handler![
            get_system_stats,
            add_note,
            get_notes,
            delete_note,
            generate_password
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}