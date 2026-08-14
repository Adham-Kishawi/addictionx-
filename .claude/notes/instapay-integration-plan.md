# InstaPay Payment Integration Plan

**Date:** 2026-08-14
**Status:** Pending Implementation
**Priority:** High (After Security Fixes)

## Overview

Walid chose **InstaPay** instead of Paymob for payment integration. InstaPay is the Egyptian Central Bank's instant payment system - faster and simpler than traditional payment gateways.

## How It Works

1. User selects "InstaPay" at checkout
2. System shows store's InstaPay number
3. User transfers amount via their bank app
4. User uploads payment receipt or enters Transaction Reference
5. Admin reviews and confirms payment from dashboard
6. Order status: PENDING → PAID → PROCESSING

## Implementation Steps

### 1. Add Payment Method (30 min)

```prisma
enum PaymentMethod {
  CASH_ON_DELIVERY
  INSTAPAY  // NEW
  CARD
  WALLET
}
```

### 2. Payment Proof Upload (2-3 hours)

- New model `PaymentProof`:
  - `orderId` (FK to Order)
  - `imageUrl` (receipt screenshot)
  - `transactionRef` (optional reference number)
  - `status` (PENDING | VERIFIED | REJECTED)
  - `verifiedBy` (admin user ID)
  - `verifiedAt`

### 3. Admin Payment Verification (2-3 hours)

- New admin page: `/admin/payments` or section in orders
- Show pending payments with receipt images
- Approve/Reject buttons
- On approve: update Transaction.status → PAID

### 4. Store InstaPay Settings (1 hour)

- Add to `StoreSetting`:
  - `instapay_number` (store's InstaPay ID)
  - `instapay_name` (account holder name)
- Show on checkout page when user selects InstaPay

## Advantages

✅ **Very fast** - transfers in seconds
✅ **No SDK fees** - no Paymob needed
✅ **Secure** - guaranteed by Central Bank of Egypt
✅ **Simple** - users already have InstaPay in their bank apps

## Trade-offs

⚠️ **Manual verification** - admin must review each payment
⚠️ **Not instant** - may take minutes until admin sees it
⚠️ **Trust required** - user must actually transfer

## Estimated Time

**Total: 1 day (6-8 hours work)**

## Next Steps (After Security Fixes)

1. Add `INSTAPAY` to schema
2. Create `PaymentProof` model
3. Update checkout page to show InstaPay number
4. Build admin verification page

---

## Related Issues

- Must implement rate limiting FIRST (security)
- Must fix XSS + CSP before payment features
- Cloudinary migration recommended before handling receipt images
