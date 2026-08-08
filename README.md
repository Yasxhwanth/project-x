# Project X — Autonomous Creator Marketing Operating System

[![IBM Carbon Design System](https://img.shields.io/badge/UI-IBM%20Carbon%20Design%20System-0f62fe?style=flat-square)](https://carbondesignsystem.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-42be65?style=flat-square)](https://nodejs.org/)
[![Vite + React](https://img.shields.io/badge/Frontend-Vite%20%7C%20React%2018-61dafb?style=flat-square)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.style=flat-square)](LICENSE)

> An AI-native autonomous execution system and control plane for Indian D2C Brands & Influencer Marketing Agencies to run end-to-end creator campaigns—from brief creation to multimodal VideoDB compliance audits, Shopify order attribution, and Razorpay UPI payouts.

---

## 🚀 Key Architectural Layers

```text
                                PROJECT X
                                    │
                            CONTROL PLANE
                                    │
             ┌──────────────────────┴──────────────────────┐
             │                                             │
       AI AGENTS                                    HUMAN GOVERNANCE
             │                                             │
   ┌─────────┼─────────┐                            Approval Queue
   │         │         │                            Risk Classifier
Discovery Negotiation Optimization                  Audit Trail
   │         │         │
   └─────────┼─────────┘
             │
       STATE MACHINE
             │
DISCOVER ──► BRIEF ──► INVITE ──► NEGOTIATE ──► CONTENT ──► AUDIT ──► PAY ──► ATTRIBUTE
```

### 1. Layer 1: Creator Discovery & Intelligence
- **Live Search & Scrapers**: Cheerio HTML parser for live YouTube channel discovery, Meta Graph API integration for Instagram business profiles, and pre-seeded database of 50+ Indian D2C creators.
- **Audience Metrics**: Standardized K & M reach formatting, engagement rates, price-per-post estimates, and creator data provenance.

### 2. Layer 2: Campaign Hub & Hinglish AI Email Negotiator
- **Campaign Brief Manager**: Define budget ceilings in INR (₹), micro/mid/macro creator mix, mandatory spoken keyphrases, and affiliate promo codes.
- **Hinglish AI Negotiator**: Powered by **Google Gemini API** with 10% Section 194J TDS tax withholding calculations.

### 3. Layer 3: Multimodal VideoDB Audit & Shopify Order Attribution
- **VideoDB Video Audit**: Multimodal speech-to-text transcript search verifying spoken keyphrases, affiliate promo codes, and visual product presence.
- **Shopify Order Attribution**: Webhook ingestion matching promo codes and UTM parameters to creator deals, computing verified GMV revenue and per-creator ROAS (e.g. **7.89x ROAS**).

### 4. Layer 4: Autonomous Control Plane & Governance
- **Event-Driven Bus**: Persistent outbox event dispatcher (`outboxDispatcher.js`) processing state transitions asynchronously.
- **Human Risk Gate**: Escalation queue pausing high-risk rate increases or unverified payouts for 1-click human admin authorization.
- **Razorpay Instant UPI Payouts**: Idempotent payment execution with 10% TDS deductions and instant settlement.

---

## 🎨 UI & Aesthetics (IBM Carbon Design System)

Built strictly adhering to the **IBM Carbon Design System (Gray 100 Dark Theme `cds--g100`)**:
- Dark Mode Tokens: `#161616` background, `#262626` layer-01 tiles, `#0f62fe` primary action blue, `#42be65` success green.
- Layout: Fixed vertical `SideNav`, responsive 16-column `@carbon/react` Grid, and native Carbon `Table` components.
- Navigation: Top header organization settings modal (`OrgSettingsModal.jsx`) and Welcome Launchpad (`WelcomeLaunchpad.jsx`).

---

## 🛠️ Quick Start & Local Setup

### Prerequisites
- Node.js v18+ 
- npm v9+

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Yasxhwanth/project-x.git
cd project-x

# Install root, client, and server dependencies
npm install
npm --prefix client install
npm --prefix server install
```

### 2. Environment Setup (Optional)
Copy the example environment file:
```bash
cp server/.env.example server/.env
```
*(Optional: Add `GEMINI_API_KEY`, `VIDEODB_API_KEY`, or `GMAIL_USER` / `GMAIL_APP_PASSWORD` for live API calls. If unconfigured, the system runs cleanly in transparent simulation mode).*

### 3. Run Application
Run both backend Express server and frontend Vite dev server concurrently with one command:
```bash
npm run start:all
```

- **Frontend Client**: `http://localhost:3000` (or `http://localhost:3002`)
- **Backend Express Server**: `http://localhost:5001`

---

## 📦 Deployment Guide

### Deploying on Render.com (Recommended)
Render supports persistent Node.js web services, outbox background dispatchers, and disk storage.

1. Go to [Render.com](https://render.com) and select **New → Blueprint**.
2. Connect your GitHub repository `Yasxhwanth/project-x`.
3. Render will automatically detect `render.yaml` and deploy the service.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/creators` | Search creators by reach, budget, or niche |
| `POST` | `/api/campaigns` | Create and activate a new brand campaign |
| `POST` | `/api/deals/:id/negotiate` | Submit creator response to Gemini AI negotiator |
| `POST` | `/api/deals/:id/verify-video` | Run VideoDB multimodal audio/transcript audit |
| `POST` | `/api/deals/:id/payout` | Execute Razorpay UPI payout (requires `PAYMENT_APPROVED` status) |
| `POST` | `/api/conversions/webhook` | Ingest Shopify / WooCommerce order webhook |
| `GET` | `/api/campaigns/:id/attribution` | Fetch GMV revenue & per-creator ROAS breakdown |
| `GET` | `/api/agents/escalations` | Query human risk classifier escalation queue |

---

## 📄 License
MIT License. Built for Indian D2C Brands, Agencies, and Creators.
