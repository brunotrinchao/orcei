# Orcei Phase 2: Operação & Logística Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement sequential budget numbering, a fully functional Agenda with FullCalendar, and secure, tokenized client links.

**Architecture:** Atomic sequence generation in MongoDB for budget codes. CRUD for Events with Proposal linking. Token-based validation for public access.

**Tech Stack:** FullCalendar, MongoDB, Nuxt 3, Lucide.

---

### Task 1: Sequential Budget Numbering

**Files:**
- Modify: `server/models/Proposal.ts`
- Modify: `server/services/ProposalService.ts`

- [ ] **Step 1: Update Proposal Model**
Add `sequenceNumber` (int) and `code` (string) fields.
- [ ] **Step 2: Implement Atomic Increment**
In `ProposalService.create`, use `findOneAndUpdate` on a new `Sequence` model or a helper to get the next number for the current user and year.
- [ ] **Step 3: Generate Code**
Format: `#ORC-2026-001`.
- [ ] **Step 4: Commit**
```bash
git add server/models/Proposal.ts server/services/ProposalService.ts
git commit -m "feat(proposals): implement sequential budget numbering #ORC-YEAR-SEQ"
```

---

### Task 2: Agenda Module (Model & API)

**Files:**
- Create: `server/models/Event.ts`
- Create: `server/services/EventService.ts`
- Create: `server/api/events/index.get.ts`
- Create: `server/api/events/index.post.ts`

- [ ] **Step 1: Create Event Model**
Fields: `profileId`, `title`, `description`, `start`, `end`, `proposalId` (optional), `color`.
- [ ] **Step 2: Create CRUD Services**
- [ ] **Step 3: Commit**
```bash
git add server/models/Event.ts server/services/EventService.ts server/api/events/*
git commit -m "feat(agenda): add Event model and basic CRUD API"
```

---

### Task 3: Agenda UI (FullCalendar)

**Files:**
- Modify: `package.json`
- Create: `app/pages/dashboard/agenda/index.vue`

- [ ] **Step 1: Install Dependencies**
`npm install @fullcalendar/vue3 @fullcalendar/daygrid @fullcalendar/interaction @fullcalendar/timegrid`
- [ ] **Step 2: Create Calendar View**
Implement the dashboard/agenda page with Portuguese locale.
- [ ] **Step 3: Implement Event Modal**
Allow creating/editing events and linking to an existing "Orçamento".
- [ ] **Step 4: Commit**
```bash
git add app/pages/dashboard/agenda/index.vue package.json
git commit -m "feat(agenda): implement FullCalendar UI and event management"
```

---

### Task 4: Private Links & Token Validation

**Files:**
- Modify: `server/models/Proposal.ts`
- Modify: `server/api/proposals/public/[slug].get.ts`
- Modify: `app/pages/p/[slug].vue`

- [ ] **Step 1: Add Token to Proposal**
Generate a unique token on creation.
- [ ] **Step 2: Update API to Validate Token**
Ensure public GET only works with the correct token (as query param).
- [ ] **Step 3: Update UI for WhatsApp & Footer**
Add "Falar no WhatsApp" button and company details in the public page footer.
- [ ] **Step 4: Commit**
```bash
git add server/models/Proposal.ts app/pages/p/[slug].vue server/api/proposals/public/[slug].get.ts
git commit -m "feat(security): implement tokenized private links and whatsapp integration"
```
