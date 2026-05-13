# Design Spec: Stripe Plan Management (Update & Cancel)

Implement the ability for users to update their active subscription plans and cancel them directly from the billing dashboard.

## Overview

- **Update Plan**: Users can switch between 'starter' and 'premium' tiers. Updates are immediate with proration (Stripe default).
- **Cancel Plan**: Users can cancel their active subscription. Cancellation is immediate.
- **UI Changes**: Add "Cancel Subscription" button and update plan selection logic in `billing.vue`.
- **Backend Changes**: New `/api/stripe/manage` endpoint to handle update/cancel logic.
- **Webhooks**: Handle `customer.subscription.deleted` to sync profile state.

## Approaches

### 1. New `/api/stripe/manage` endpoint (Recommended)
Consolidate plan management logic in a single endpoint that handles both updates and cancellations. This keeps the existing `checkout.post.ts` focused on new acquisitions.

### 2. Modify `checkout.post.ts`
Overload the checkout endpoint to detect existing subscriptions. Less clean, harder to maintain.

## Selected Approach: New endpoint `/api/stripe/manage`

### Data Flow
1. User clicks "Change Plan" or "Cancel" in `billing.vue`.
2. Frontend calls `POST /api/stripe/manage` with `action: 'update' | 'cancel'` and `tier` (for update).
3. Backend:
   - Fetches profile and `stripeSubscriptionId`.
   - If `cancel`: calls `stripe.subscriptions.cancel(subscriptionId)`.
   - If `update`: calls `stripe.subscriptions.update(subscriptionId, { items: [{ id: subItem.id, price: newPriceId }], proration_behavior: 'create_prorations' })`.
4. Webhook `customer.subscription.updated` or `customer.subscription.deleted` updates the database.

## UI Design

- **Active Plan**: Display "Current Plan" label and "Cancel Subscription" button below it.
- **Other Plans**: If a plan is active, buttons for other tiers change to "Switch to [Plan]".
- **Free Tier**: No cancel button (it's the default).

## Backend Design

### New Endpoint: `server/api/stripe/manage.post.ts`
- **Body**: `{ action: 'update' | 'cancel', tier?: 'starter' | 'premium' }`
- **Auth**: Requires authenticated user session.
- **Validation**: Ensure user has an active `stripeSubscriptionId` before performing actions.

### Webhook: `server/api/webhooks/stripe.post.ts`
- Add handler for `customer.subscription.deleted`:
  - Find profile by `stripeCustomerId`.
  - Reset `subscriptionPlan` to `'free'`.
  - Reset `stripeSubscriptionId` to `null`.
  - (Optional) Reset `creditsBalance` to default (1).

## Success Criteria
- User can upgrade/downgrade between paid plans instantly.
- User can cancel a plan, immediately losing access to paid features (reverting to 'free').
- Database state (subscriptionPlan, stripeSubscriptionId) is correctly synced via webhooks.
