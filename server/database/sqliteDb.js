import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedFullCreatorDatabase } from './seedCreatorDatabase.js';
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
        authenticity_score INTEGER,
        fake_follower_pct INTEGER,
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

    // 14. Creator Memory & Episodic Intelligence Table
    db.run(`
      CREATE TABLE IF NOT EXISTS creator_memories (
        id TEXT PRIMARY KEY,
        creator_id TEXT,
        creator_email TEXT,
        creator_name TEXT,
        memory_category TEXT,
        memory_key TEXT NOT NULL,
        memory_value TEXT NOT NULL,
        confidence REAL DEFAULT 1.0,
        source_deal_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    `);

    // 15. Creator Memory & Persistent Relationship Graph Table (Solves "Cold Start")
    db.run(`
      CREATE TABLE IF NOT EXISTS creator_memory (
        id                             TEXT PRIMARY KEY,
        creator_handle                 TEXT UNIQUE NOT NULL,
        creator_name                   TEXT,
        total_campaigns_completed      INTEGER DEFAULT 0,
        historical_lowest_agreed_price INTEGER,
        avg_response_time_hours        REAL DEFAULT 4.0,
        content_quality_score          INTEGER DEFAULT 95,
        comment_sentiment_score        REAL DEFAULT 0.92,
        brand_safety_rating            INTEGER DEFAULT 98,
        preferred_niche                TEXT,
        relationship_notes             TEXT,
        updated_at                     DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 16. VideoIntel SDK Indexed Videos Table (Our VideoDB Alternative)
    db.run(`
      CREATE TABLE IF NOT EXISTS indexed_videos (
        id TEXT PRIMARY KEY,
        video_url TEXT NOT NULL,
        title TEXT,
        creator_id TEXT,
        creator_name TEXT,
        campaign_id TEXT,
        deal_id TEXT,
        duration_seconds INTEGER DEFAULT 60,
        platform TEXT DEFAULT 'Instagram',
        status TEXT DEFAULT 'INDEXED',
        transcript_text TEXT,
        summary_text TEXT,
        scenes_json TEXT,
        visual_frames_json TEXT,
        sponsorship_segments_json TEXT,
        audit_report_json TEXT,
        compliance_score INTEGER DEFAULT 95,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration guards for existing databases
    db.run(`ALTER TABLE indexed_videos ADD COLUMN summary_text TEXT`, () => {});
    db.run(`ALTER TABLE indexed_videos ADD COLUMN visual_frames_json TEXT`, () => {});
    db.run(`ALTER TABLE indexed_videos ADD COLUMN sponsorship_segments_json TEXT`, () => {});

    // 17. VideoIntel Transcript Chunks Table (Timestamped perception layer)
    db.run(`
      CREATE TABLE IF NOT EXISTS video_transcript_chunks (
        id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL,
        start_time TEXT,
        end_time TEXT,
        start_seconds REAL,
        end_seconds REAL,
        speaker TEXT DEFAULT 'Creator',
        text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(video_id) REFERENCES indexed_videos(id) ON DELETE CASCADE
      )
    `);

    // 18. VideoIntel Video Scenes & Visual Elements Table
    db.run(`
      CREATE TABLE IF NOT EXISTS video_scenes (
        id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL,
        start_time TEXT,
        end_time TEXT,
        start_seconds REAL,
        end_seconds REAL,
        scene_type TEXT,
        visual_description TEXT,
        detected_elements_json TEXT,
        ocr_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(video_id) REFERENCES indexed_videos(id) ON DELETE CASCADE
      )
    `);

    // 19. Creator KYC & Indian Tax Banking Details Table
    db.run(`
      CREATE TABLE IF NOT EXISTS creator_kyc (
        id TEXT PRIMARY KEY,
        creator_id TEXT UNIQUE NOT NULL,
        legal_name TEXT NOT NULL,
        pan_number TEXT NOT NULL,
        pan_type TEXT DEFAULT 'Individual (P)',
        pan_status TEXT DEFAULT 'VERIFIED',
        gstin TEXT,
        gstin_status TEXT DEFAULT 'NOT_APPLICABLE',
        payout_method TEXT DEFAULT 'UPI',
        bank_account_name TEXT,
        bank_account_number TEXT,
        bank_ifsc TEXT,
        bank_name TEXT,
        upi_id TEXT,
        upi_status TEXT DEFAULT 'VERIFIED',
        tds_section TEXT DEFAULT '194J',
        tds_rate REAL DEFAULT 10.0,
        kyc_status TEXT DEFAULT 'VERIFIED',
        verification_notes TEXT,
        verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(creator_id) REFERENCES creators(id)
      )
    `);

    // 20. Immutable Payout Ledger & Section 194 Form 16A Table
    db.run(`
      CREATE TABLE IF NOT EXISTS payout_ledger (
        id TEXT PRIMARY KEY,
        deal_id TEXT NOT NULL,
        campaign_id TEXT,
        creator_id TEXT NOT NULL,
        creator_name TEXT,
        gross_amount INTEGER NOT NULL,
        tds_section TEXT DEFAULT '194J',
        tds_rate REAL DEFAULT 10.0,
        tds_amount INTEGER NOT NULL,
        net_amount INTEGER NOT NULL,
        payout_method TEXT DEFAULT 'UPI',
        beneficiary_details_json TEXT,
        razorpay_payout_id TEXT,
        receipt_ref TEXT NOT NULL,
        form_16a_voucher_id TEXT,
        status TEXT DEFAULT 'SUCCESS',
        executed_by TEXT DEFAULT 'Payment Agent / HITL',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 21. Shareable Branded Client Closeout Reports Table
    db.run(`
      CREATE TABLE IF NOT EXISTS closeout_reports (
        id TEXT PRIMARY KEY,
        campaign_id TEXT UNIQUE NOT NULL,
        organization_id TEXT,
        share_token TEXT UNIQUE NOT NULL,
        report_title TEXT NOT NULL,
        brand_name TEXT,
        executive_summary_json TEXT,
        financial_audit_json TEXT,
        content_compliance_json TEXT,
        attribution_roas_json TEXT,
        is_public INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      // Run safe DB schema migrations
      db.run(`ALTER TABLE campaigns ADD COLUMN organization_id TEXT`, () => {});
      db.run(`ALTER TABLE deals ADD COLUMN organization_id TEXT`, () => {});
      db.run(`ALTER TABLE organizations ADD COLUMN google_refresh_token TEXT`, () => {});
      db.run(`ALTER TABLE creators ADD COLUMN memory_summary TEXT`, () => {});
      db.run(`ALTER TABLE creators ADD COLUMN authenticity_score INTEGER`, () => {});
      db.run(`ALTER TABLE creators ADD COLUMN fake_follower_pct INTEGER`, () => {});
      db.run(`ALTER TABLE creator_kyc ADD COLUMN pan_type TEXT DEFAULT 'Individual (P)'`, () => {});
      db.run(`ALTER TABLE creator_kyc ADD COLUMN tds_section TEXT DEFAULT '194J'`, () => {});
      db.run(`ALTER TABLE creator_kyc ADD COLUMN tds_rate REAL DEFAULT 10.0`, () => {});
      isInitialized = true;
      seedDefaultAuthAndOrganization().catch(err => console.error('Auth seeding error:', err));
      seedFullCreatorDatabase().catch(err => console.error('Creator seeding error:', err));
      seedKycPresets().catch(err => console.error('KYC preset seeding error:', err));
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

    // --- CREATOR DATABASE INDEXES (required for 100K+ scale) ---
    // Single-column covering indexes for the most common filter dimensions
    db.run(`CREATE INDEX IF NOT EXISTS idx_creators_niche      ON creators(niche)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_creators_platform   ON creators(platform)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_creators_followers  ON creators(followers_raw DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_creators_location   ON creators(location)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_creators_language   ON creators(language)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_creators_rating     ON creators(rating DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_creators_price      ON creators(price_per_post)`);
    // Composite index for the most common combined query: niche + platform + followers
    db.run(`CREATE INDEX IF NOT EXISTS idx_creators_niche_platform_followers ON creators(niche, platform, followers_raw DESC)`);
    // Composite index for budget-filtered searches: price range + niche
    db.run(`CREATE INDEX IF NOT EXISTS idx_creators_price_niche ON creators(price_per_post, niche)`);

    // FTS5 Full-Text Search Virtual Table for natural language search across 100K+ creators
    // Allows fast MATCH queries on name, handle, bio, niche, location
    db.run(`
      CREATE VIRTUAL TABLE IF NOT EXISTS creators_fts USING fts5(
        creator_id UNINDEXED,
        name,
        handle,
        bio,
        niche,
        location,
        language,
        content='creators',
        content_rowid='rowid'
      )
    `);

    // Triggers to keep FTS index in sync with creators table
    db.run(`
      CREATE TRIGGER IF NOT EXISTS creators_fts_insert AFTER INSERT ON creators BEGIN
        INSERT INTO creators_fts(rowid, creator_id, name, handle, bio, niche, location, language)
        VALUES (new.rowid, new.id, new.name, new.handle, new.bio, new.niche, new.location, new.language);
      END
    `);
    db.run(`
      CREATE TRIGGER IF NOT EXISTS creators_fts_delete AFTER DELETE ON creators BEGIN
        INSERT INTO creators_fts(creators_fts, rowid, creator_id, name, handle, bio, niche, location, language)
        VALUES ('delete', old.rowid, old.id, old.name, old.handle, old.bio, old.niche, old.location, old.language);
      END
    `);
    db.run(`
      CREATE TRIGGER IF NOT EXISTS creators_fts_update AFTER UPDATE ON creators BEGIN
        INSERT INTO creators_fts(creators_fts, rowid, creator_id, name, handle, bio, niche, location, language)
        VALUES ('delete', old.rowid, old.id, old.name, old.handle, old.bio, old.niche, old.location, old.language);
        INSERT INTO creators_fts(rowid, creator_id, name, handle, bio, niche, location, language)
        VALUES (new.rowid, new.id, new.name, new.handle, new.bio, new.niche, new.location, new.language);
      END
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

    // Seed 3 Default Brand Campaigns
    const c1 = await getDbRow("SELECT id FROM campaigns WHERE id = 'camp_01'");
    if (!c1) {
      await runDb(`
        INSERT INTO campaigns (id, brand_name, product_name, max_budget_per_creator, target_reach_min, mandatory_phrases, promo_code, guidelines, organization_id, status)
        VALUES ('camp_01', 'boAt Lifestyle', 'boAt Airdopes Pro Max 500', 50000, 100000, 'Use code SAVER20 for 20% off', 'SAVER20', 'Highlight 60h playtime and Active Noise Cancellation.', 'org_boat_01', 'ACTIVE')
      `);
    }

    const c2 = await getDbRow("SELECT id FROM campaigns WHERE id = 'camp_02'");
    if (!c2) {
      await runDb(`
        INSERT INTO campaigns (id, brand_name, product_name, max_budget_per_creator, target_reach_min, mandatory_phrases, promo_code, guidelines, organization_id, status)
        VALUES ('camp_02', 'Mamaearth', 'Onion Hair Oil Natural Growth', 35000, 75000, 'Toxins-free natural hair care with code MAMAGROW15', 'MAMAGROW15', 'Focus on 100% natural ingredients and dermatologically tested benefits.', 'org_boat_01', 'ACTIVE')
      `);
    }

    const c3 = await getDbRow("SELECT id FROM campaigns WHERE id = 'camp_03'");
    if (!c3) {
      await runDb(`
        INSERT INTO campaigns (id, brand_name, product_name, max_budget_per_creator, target_reach_min, mandatory_phrases, promo_code, guidelines, organization_id, status)
        VALUES ('camp_03', 'Cult.fit', 'Cultpass Elite Annual Pass', 75000, 200000, 'Transform your fitness with code CULTVIP25', 'CULTVIP25', 'Showcase gym workouts, group classes, and live trainer sessions.', 'org_boat_01', 'ACTIVE')
      `);
    }
  } catch (err) {
    console.error("Error seeding default auth & organization:", err);
  }
}

async function seedKycPresets() {
  try {
    const kycSeeds = [
      {
        id: 'kyc_fittuber',
        creator_id: 'cr_yt_fittuber',
        legal_name: 'Vivek Mittal',
        pan_number: 'AABPM1234F',
        pan_type: 'Individual (P)',
        pan_status: 'VERIFIED',
        gstin: '07AABPM1234F1Z5',
        gstin_status: 'ACTIVE_VERIFIED',
        payout_method: 'UPI',
        bank_account_name: 'Vivek Mittal Fitness Enterprise',
        bank_account_number: '50200012345678',
        bank_ifsc: 'HDFC0000123',
        bank_name: 'HDFC Bank Ltd',
        upi_id: 'vivek@upi',
        upi_status: 'VERIFIED',
        tds_section: '194J',
        tds_rate: 10.0,
        kyc_status: 'VERIFIED',
        verification_notes: 'Automated CBDT PAN-Aadhaar Link & Bank Penny Drop Verified'
      },
      {
        id: 'kyc_ranveer',
        creator_id: 'cr_01',
        legal_name: 'Ranveer Allahbadia',
        pan_number: 'ABCPA5678K',
        pan_type: 'Individual (P)',
        pan_status: 'VERIFIED',
        gstin: '27ABCPA5678K1Z9',
        gstin_status: 'ACTIVE_VERIFIED',
        payout_method: 'BANK_ACCOUNT',
        bank_account_name: 'Monk Entertainment LLP',
        bank_account_number: '001105001234',
        bank_ifsc: 'ICIC0000011',
        bank_name: 'ICICI Bank Ltd',
        upi_id: 'ranveer@okhdfcbank',
        upi_status: 'VERIFIED',
        tds_section: '194J',
        tds_rate: 10.0,
        kyc_status: 'VERIFIED',
        verification_notes: 'Corporate Media Entity KYC Verified via NSDL'
      },
      {
        id: 'kyc_yashwanth',
        creator_id: 'cr_yashwanth_01',
        legal_name: 'Yashwanth Creator Lab',
        pan_number: 'XYZPY9876Q',
        pan_type: 'Individual (P)',
        pan_status: 'VERIFIED',
        gstin: '29XYZPY9876Q1Z3',
        gstin_status: 'ACTIVE_VERIFIED',
        payout_method: 'UPI',
        bank_account_name: 'Yashwanth',
        bank_account_number: '9180123456789',
        bank_ifsc: 'SBIN0001234',
        bank_name: 'State Bank of India',
        upi_id: 'yashwanth@ybl',
        upi_status: 'VERIFIED',
        tds_section: '194J',
        tds_rate: 10.0,
        kyc_status: 'VERIFIED',
        verification_notes: 'Real Gmail Collab Account KYC Approved'
      }
    ];

    for (const kyc of kycSeeds) {
      const existing = await getDbRow('SELECT id FROM creator_kyc WHERE creator_id = ?', [kyc.creator_id]);
      if (!existing) {
        await runDb(
          `INSERT INTO creator_kyc (
            id, creator_id, legal_name, pan_number, pan_type, pan_status, gstin, gstin_status,
            payout_method, bank_account_name, bank_account_number, bank_ifsc, bank_name,
            upi_id, upi_status, tds_section, tds_rate, kyc_status, verification_notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            kyc.id, kyc.creator_id, kyc.legal_name, kyc.pan_number, kyc.pan_type, kyc.pan_status,
            kyc.gstin, kyc.gstin_status, kyc.payout_method, kyc.bank_account_name, kyc.bank_account_number,
            kyc.bank_ifsc, kyc.bank_name, kyc.upi_id, kyc.upi_status, kyc.tds_section, kyc.tds_rate,
            kyc.kyc_status, kyc.verification_notes
          ]
        );
      }
    }
  } catch (err) {
    console.error('Error seeding KYC presets:', err);
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
