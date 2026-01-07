#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rand::Rng;
use serde::Serialize;
use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePoolOptions, FromRow, Pool, Sqlite};
use sysinfo::System;
// ابزار جدید رمزنگاری 👇
use magic_crypt::{new_magic_crypt, MagicCryptTrait}; 

struct AppState {
    db: Pool<Sqlite>,
}

// --- کلید طلایی رمزنگاری ---
// فعلاً این رو ثابت می‌ذاریم. بعداً می‌تونی این رو از ورودی کاربر بگیری.
const MASTER_KEY: &str = "super_secret_key_1234"; 

// --- ساختارها ---
#[derive(Debug, Serialize, FromRow)]
struct Note {
    id: i64,
    title: String,
    content: Option<String>,
}

#[derive(Debug, Serialize, FromRow)]
struct PasswordEntry {
    id: i64,
    service: String,
    username: String,
    password: String, 
}

// --- دستورات ---

#[tauri::command]
fn get_system_stats() -> String {
    let mut sys = System::new_all();
    sys.refresh_memory();
    let total_gb = sys.total_memory() / 1024 / 1024 / 1024;
    let used_gb = sys.used_memory() / 1024 / 1024 / 1024;
    format!("RAM: {} GB Used / {} GB Total", used_gb, total_gb)
}

#[tauri::command]
async fn add_note(state: tauri::State<'_, AppState>, text: String) -> Result<String, String> {
    sqlx::query("INSERT INTO notes (title, content) VALUES ('Note', $1)")
        .bind(text)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    Ok("Saved!".to_string())
}

#[tauri::command]
async fn get_notes(state: tauri::State<'_, AppState>) -> Result<Vec<Note>, String> {
    let notes = sqlx::query_as::<_, Note>("SELECT id, title, content FROM notes ORDER BY id DESC")
        .fetch_all(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    Ok(notes)
}

#[tauri::command]
async fn delete_note(state: tauri::State<'_, AppState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM notes WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn generate_password(length: usize, has_numbers: bool, has_symbols: bool) -> String {
    let mut charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".to_string();
    if has_numbers { charset.push_str("0123456789"); }
    if has_symbols { charset.push_str("!@#$%^&*()_+-=[]{}|;:,.<>?"); }
    let mut rng = rand::thread_rng();
    (0..length).map(|_| {
        let idx = rng.gen_range(0..charset.len());
        charset.chars().nth(idx).unwrap()
    }).collect()
}

// --- بخش‌های تغییر یافته (رمزنگاری) ---

#[tauri::command]
async fn add_password_entry(
    state: tauri::State<'_, AppState>,
    service: String,
    username: String,
    password: String,
) -> Result<String, String> {
    // 1. ساخت دستگاه رمزنگاری
    let mc = new_magic_crypt!(MASTER_KEY, 256);
    
    // 2. تبدیل پسورد ساده به متن رمز شده (Base64)
    let encrypted_password = mc.encrypt_str_to_base64(password);

    // 3. ذخیره متن رمز شده در دیتابیس
    sqlx::query("INSERT INTO passwords (service, username, password) VALUES ($1, $2, $3)")
        .bind(service)
        .bind(username)
        .bind(encrypted_password) // اینجا پسورد رمز شده رو می‌فرستیم
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    Ok("Entry Saved Encrypted".to_string())
}

#[tauri::command]
async fn get_password_entries(state: tauri::State<'_, AppState>) -> Result<Vec<PasswordEntry>, String> {
    // 1. گرفتن داده‌های خام (که رمز شده هستن)
    let raw_entries = sqlx::query_as::<_, PasswordEntry>("SELECT id, service, username, password FROM passwords ORDER BY id DESC")
        .fetch_all(&state.db)
        .await
        .map_err(|e| e.to_string())?;

    // 2. ساخت دستگاه رمزگشایی
    let mc = new_magic_crypt!(MASTER_KEY, 256);

    // 3. رمزگشایی تک تک آیتم‌ها
    let decrypted_entries = raw_entries.into_iter().map(|mut entry| {
        // تلاش برای رمزگشایی. اگر نشد، همون متن خراب رو نشون بده (تا برنامه کرش نکنه)
        match mc.decrypt_base64_to_string(&entry.password) {
            Ok(decrypted) => entry.password = decrypted,
            Err(_) => entry.password = "Decryption Failed!".to_string(), 
        }
        entry
    }).collect();

    Ok(decrypted_entries)
}

#[tauri::command]
async fn delete_password_entry(state: tauri::State<'_, AppState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM passwords WHERE id = $1")
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
    let db_pool = SqlitePoolOptions::new().connect(DB_URL).await.expect("DB Connect Failed");

    sqlx::query("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, title TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)")
        .execute(&db_pool).await.unwrap();

    sqlx::query("CREATE TABLE IF NOT EXISTS passwords (
        id INTEGER PRIMARY KEY, 
        service TEXT NOT NULL, 
        username TEXT, 
        password TEXT NOT NULL
    )").execute(&db_pool).await.unwrap();

    tauri::Builder::default()
        .manage(AppState { db: db_pool })
        .invoke_handler(tauri::generate_handler![
            get_system_stats, add_note, get_notes, delete_note, generate_password,
            add_password_entry, get_password_entries, delete_password_entry
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}