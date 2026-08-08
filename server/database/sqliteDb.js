import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedInstagramCreatorsDatabase } from './seedInstagramCreators.js';
import { seedE2EScenario } from '../data/e2eScenarioSeed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'creatorconnect.db');

let isInitialized = false;

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open SQLite database:', err);
  } else {
    initDatabaseSchema();
  }
});

function initDatabaseSchema() {
  db.serialize(() => {
    // 1. Organizations Table with Email & AI Settings
    db.run(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        plan TEXT DEFAULT 'Enterprise',
        api_key TEXT UNIQUE,
        sender_email TEXT DEFAULT 'collabs@boat-lifestyle.com',
        sender_name TEXT DEFAULT 'boAt Marketing AI',
        gmail_api_key TEXT,
        smtp_host TEXT DEFAULT 'smtp.gmail.com',
        smtp_port INTEGER DEFAULT 587,
        smtp_user TEXT,
        smtp_pass TEXT,
        ai_tone TEXT DEFAULT 'Hinglish Casual & Professional',
        auto_reply_enabled INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'Brand Manager',
        organization_id TEXT,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(organization_id) REFERENCES organizations(id)
      )
    `);

    // 3. Creators Table
    db.run(`
      CREATE TABLE IF NOT EXISTS creators (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        handle TEXT UNIQUE NOT NULL,
        platform TEXT NOT NULL,
        niche TEXT,
        followers_raw INTEGER,
        reach_text TEXT,
        avg_views INTEGER,
        engagement_rate TEXT,
        price_per_post INTEGER,
        min_price INTEGER,
        email TEXT,
        avatar TEXT,
        rating REAL,
        location TEXT,
        language TEXT,
        recent_videos_json TEXT,
        bio TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Campaigns Table
    db.run(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        brand_name TEXT NOT NULL,
        product_name TEXT NOT NULL,
        max_budget_per_creator INTEGER,
        target_reach_min INTEGER,
        mandatory_phrases TEXT,
        promo_code TEXT,
        guidelines TEXT,
        organization_id TEXT,
        status TEXT DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Deals Table
    db.run(`
      CREATE TABLE IF NOT EXISTS deals (
        id TEXT PRIMARY KEY,
        campaign_id TEXT,
        creator_id TEXT,
        creator_name TEXT,
        creator_email TEXT,
        creator_avatar TEXT,
        platform TEXT,
        offered_price INTEGER,
        current_agreed_price INTEGER,
        status TEXT,
        video_url TEXT,
        email_thread_json TEXT,
        video_analysis_json TEXT,
        payout_json TEXT,
        organization_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. State Machine Audit Logs Table
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        deal_id TEXT,
        campaign_id TEXT,
        stage_from TEXT,
        stage_to TEXT,
        trigger_event TEXT NOT NULL,
        actor_agent TEXT NOT NULL,
        rationale TEXT,
        human_approved INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Human Escalation Approval Queue Table
    db.run(`
      CREATE TABLE IF NOT EXISTS escalation_queue (
        id TEXT PRIMARY KEY,
        deal_id TEXT NOT NULL,
        creator_name TEXT,
        reason TEXT NOT NULL,
        requested_rate INTEGER,
        max_allowed_rate INTEGER,
        status TEXT DEFAULT 'PENDING',
        actor_agent TEXT DEFAULT 'Negotiation Agent',
        risk_level TEXT DEFAULT 'HIGH',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Outbox Events Table (written atomically with state changes, dispatched async)
    db.run(`
      CREATE TABLE IF NOT EXISTS outbox_events (
        id           TEXT PRIMARY KEY,
        event_name   TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status       TEXT DEFAULT 'PENDING',
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        dispatched_at DATETIME
      )
    `);

    // 9. Agent Runs Table (structured record of every autonomous operation)
    db.run(`
      CREATE TABLE IF NOT EXISTS agent_runs (
        id               TEXT PRIMARY KEY,
        agent_name       TEXT NOT NULL,
        campaign_id      TEXT,
        deal_id          TEXT,
        input_json       TEXT,
        reasoning        TEXT,
        tools_used       TEXT,
        actions_taken    TEXT,
        policy_evaluated TEXT,
        result           TEXT,
        confidence       REAL,
        human_approved   INTEGER DEFAULT 0,
        human_actor      TEXT,
        created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 10. Creator Data Provenance Table
    db.run(`
      CREATE TABLE IF NOT EXISTS creator_data_provenance (
        id           TEXT PRIMARY KEY,
        creator_id   TEXT NOT NULL,
        attribute    TEXT NOT NULL,
        value        TEXT NOT NULL,
        source       TEXT NOT NULL,
        confidence   TEXT NOT NULL,
        collected_at DATETIME NOT NULL,
        expires_at   DATETIME
      )
    `);

    // 11. Idempotency Keys Table (prevent double-execution)
    db.run(`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        key          TEXT PRIMARY KEY,
        action_type  TEXT NOT NULL,
        deal_id      TEXT,
        result_json  TEXT,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 12. Dead Letter Queue (failed agent actions after retries exhausted)
    db.run(`
      CREATE TABLE IF NOT EXISTS dead_letter_queue (
        id           TEXT PRIMARY KEY,
        agent_name   TEXT NOT NULL,
        action_type  TEXT NOT NULL,
        deal_id      TEXT,
        payload_json TEXT,
        error        TEXT NOT NULL,
        retry_count  INTEGER DEFAULT 0,
        max_retries  INTEGER DEFAULT 3,
        status       TEXT DEFAULT 'PENDING',
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 13. Order Conversions & ROAS Attribution Table
    db.run(`
      CREATE TABLE IF NOT EXISTS conversions (
        id                TEXT PRIMARY KEY,
        campaign_id       TEXT NOT NULL,
        deal_id           TEXT NOT NULL,
        creator_id        TEXT NOT NULL,
        creator_name      TEXT,
        order_id          TEXT UNIQUE NOT NULL,
        promo_code        TEXT,
        utm_source        TEXT,
        utm_medium        TEXT,
        utm_campaign      TEXT,
        order_value       REAL NOT NULL,
        commission_amount REAL DEFAULT 0,
        customer_email    TEXT,
        store_provider    TEXT DEFAULT 'SHOPIFY_WEBHOOK',
        converted_at      DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 14. OTP Verification Table (6-digit email & mobile login OTPs)
    db.run(`
      CREATE TABLE IF NOT EXISTS otps (
        id           TEXT PRIMARY KEY,
        email        TEXT NOT NULL,
        code         TEXT NOT NULL,
        expires_at   DATETIME NOT NULL,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      // Run safe DB schema migrations
      db.run(`ALTER TABLE campaigns ADD COLUMN organization_id TEXT`, () => {});
      isInitialized = true;
      seedDefaultAuthAndOrganization().catch(err => console.error("Auth seeding error:", err));
      seedInstagramCreatorsDatabase().catch(err => console.error("Creator seeding error:", err));
      // Seed after a short delay to allow auth+creators to finish first
      setTimeout(() => {
        seedE2EScenario().catch(err => console.error("E2E scenario seeding error:", err));
      }, 3000);
    });

    // Provider secrets are intentionally kept separate from the organization record so
    // they can be returned as connection status without exposing the secret to the UI.
    db.run(`
      CREATE TABLE IF NOT EXISTS organization_integrations (
        organization_id TEXT NOT NULL,
        integration_key TEXT NOT NULL,
        secret_value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (organization_id, integration_key),
        FOREIGN KEY(organization_id) REFERENCES organizations(id)
      )
    `);
  });
}

async function seedDefaultAuthAndOrganization() {
  try {
    const orgExisting = await getDbRow("SELECT id FROM organizations WHERE slug = 'boat-lifestyle'");
    if (!orgExisting) {
      await runDb(`
        INSERT INTO organizations (id, name, slug, plan, api_key, sender_email, sender_name, ai_tone, auto_reply_enabled)
        VALUES ('org_boat_01', 'boAt Lifestyle', 'boat-lifestyle', 'Enterprise Plan', 'cc_live_boat_8f9a2b', 'collabs@boat-lifestyle.com', 'boAt Marketing AI', 'Hinglish Casual & Professional', 1)
      `);
    }

    const userExisting = await getDbRow("SELECT id FROM users WHERE email = 'admin@boat-lifestyle.com'");
    if (!userExisting) {
      await runDb(`
        INSERT INTO users (id, name, email, password_hash, role, organization_id, avatar)
        VALUES (
          'user_aman_gupta',
          'Aman Gupta',
          'admin@boat-lifestyle.com',
          'password123',
          'CMO & Brand Admin',
          'org_boat_01',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
        )
      `);
    }
  } catch (err) {
    console.error("Error seeding default auth & organization:", err);
  }
}

function ensureDbReady() {
  if (isInitialized) return Promise.resolve();
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (isInitialized) {
        clearInterval(interval);
        resolve();
      }
    }, 20);
  });
}

export async function queryDb(sql, params = []) {
  await ensureDbReady();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export async function getDbRow(sql, params = []) {
  await ensureDbReady();
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export async function runDb(sql, params = []) {
  await ensureDbReady();
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export async function getIntegrationSecret(organizationId, integrationKey) {
  const row = await getDbRow(
    'SELECT secret_value FROM organization_integrations WHERE organization_id = ? AND integration_key = ?',
    [organizationId, integrationKey]
  );
  return row?.secret_value || '';
}

export default db;
