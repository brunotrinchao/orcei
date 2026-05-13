# Stripe Plan Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement plan updates (immediate with proration) and cancellations (immediate) using Stripe API and sync with MongoDB.

**Architecture:** Use a new `/api/stripe/manage` endpoint for actions and update the webhook handler for synchronization.

**Tech Stack:** Nuxt 3, Stripe SDK, MongoDB.

---

### Task 1: Create Backend Endpoint `/api/stripe/manage` [DONE]

**Files:**
- Create: `server/api/stripe/manage.post.ts`

- [x] **Step 1: Implement the manage endpoint logic**

```typescript
// ... (code omitted for brevity in replace, but I must provide the full file or exact match)
```

- [x] **Step 2: Commit backend endpoint**

```bash
git add server/api/stripe/manage.post.ts
git commit -m "feat(api): add stripe manage endpoint for update and cancel"
```

---

### Task 2: Update Webhook Handler for Deletion [DONE]

**Files:**
- Modify: `server/api/webhooks/stripe.post.ts`

- [x] **Step 1: Add `customer.subscription.deleted` handler**

```typescript
// ...
```

- [x] **Step 2: Commit webhook update**

```bash
git add server/api/webhooks/stripe.post.ts
git commit -m "fix(webhook): handle customer.subscription.deleted event"
```

---

### Task 3: Update Billing Frontend UI [DONE]

**Files:**
- Modify: `app/pages/dashboard/billing.vue`

- [x] **Step 1: Implement `handleManage` function and update template**

```typescript
// ...
```

- [x] **Step 2: Update the template to include "Cancel Subscription" and "Switch Plan" logic**

- [x] **Step 3: Commit UI changes**
