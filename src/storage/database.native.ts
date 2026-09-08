import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "battery-intelligence.db";

export async function getDatabase() {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS experimental_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      trial_id TEXT NOT NULL,
      system TEXT NOT NULL,
      condition TEXT NOT NULL,

      app_name TEXT NOT NULL,

      block INTEGER NOT NULL,
      repetition INTEGER NOT NULL,

      battery_before REAL NOT NULL,
      battery_after REAL NOT NULL,

      duration_minutes REAL NOT NULL,

      battery_delta REAL NOT NULL,
      battery_drain_rate REAL NOT NULL,

      ux_impact REAL,
      user_acceptance INTEGER,

      recorded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      action TEXT PRIMARY KEY NOT NULL,
      accepted_count INTEGER NOT NULL DEFAULT 0,
      rejected_count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS behaviour_observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_name TEXT NOT NULL,
      category TEXT NOT NULL,
      session_duration_minutes REAL NOT NULL,
      interaction_intensity TEXT NOT NULL,
      screen_dependency REAL NOT NULL,
      audio_dependency REAL NOT NULL,
      network_dependency REAL NOT NULL,
      typical_session_duration_minutes REAL NOT NULL,
      preferred_brightness REAL NOT NULL,
      usage_context TEXT NOT NULL,
      recorded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS intervention_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      battery_level REAL NOT NULL,
      intervention_action TEXT NOT NULL,
      estimated_battery_saving REAL NOT NULL,
      estimated_ux_impact REAL NOT NULL,
      confidence REAL NOT NULL,
      user_decision TEXT NOT NULL,
      recorded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS experiment_sessions (
      session_id TEXT PRIMARY KEY NOT NULL,
      trial_id TEXT NOT NULL,
      system TEXT NOT NULL,
      started_at TEXT NOT NULL,
      app_name TEXT NOT NULL,
      battery_level_at_start REAL NOT NULL,
      selected_action TEXT NOT NULL,
      condition TEXT NOT NULL DEFAULT 'intervention',
      user_decision TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS intervention_outcomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      battery_level_before REAL NOT NULL,
      battery_level_after REAL,
      energy_saving REAL,
      ux_impact REAL,
      user_acceptance INTEGER,
      measured_duration_minutes REAL,
      recorded_at TEXT NOT NULL,
      FOREIGN KEY (
        session_id
      )
      REFERENCES experiment_sessions(session_id)
    );
  `);

  return db;
}
