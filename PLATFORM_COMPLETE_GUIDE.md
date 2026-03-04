# NexusPay / Paycher — Complete Platform Guide
### Full End-to-End Technical & Business Documentation

---

## 1. WHAT IS THIS PLATFORM?

NexusPay (Paycher) is a **B2B Payment Aggregator / Orchestration Platform**.

Think of it like Razorpay or PayU but built privately.
The platform sits **in the middle** between:

```
YOUR END CUSTOMERS (users who pay)
        ↕
  PARTNER BUSINESSES  (e.g., gaming apps, e-commerce sites, SaaS tools)
        ↕
     PAYCHER (this platform — the middleman)
        ↕
  PAYWISE (the actual payment gateway that processes UPI/Card/Netbanking)
        ↕
  REAL BANK NETWORK (NPCI, UPI rails, card networks)
```

**Partners** are businesses that integrate Paycher's API into their own products.
When their users pay, the money flows through Paywise, Paycher takes a commission, and the remainder is credited to the partner's wallet.

---

## 2. WHO ARE THE ACTORS?

| Actor | Who They Are | What They Can Do |
|-------|-------------|-----------------|
| **Admin (Super Admin)** | You (Paycher team) | Invite partners, approve KYC, process settlements, view all data |
| **Partner** | A business (e.g., gaming platform, e-commerce) | Integrate API, initiate payments, request withdrawal of their earnings |
| **End User** | The partner's customer | Pays via UPI/Card through Paywise's payment page |
| **Paywise** | Payment gateway (like Razorpay's backend) | Processes actual money movement, sends webhooks, settles to Paycher's bank |

---

## 3. THE COMPLETE BUSINESS FLOW

### Phase A: Partner Onboarding

```
1. Admin invites partner by email
       ↓
2. Partner receives email, clicks invite link, registers account (password)
       ↓
3. Partner uploads KYC documents (PAN, GST, Bank proof, Business registration)
       ↓
4. Admin reviews KYC → APPROVES
       ↓
5. System automatically:
   - Issues API Key + API Secret to the partner
   - Creates partner wallet (balance = ₹0)
   - Activates partner account
```

### Phase B: Partner Integration (Development)

```
6. Partner logs into dashboard
       ↓
7. Partner copies their API Key & API Secret from dashboard
       ↓
8. Partner's developer integrates Paycher API into their backend/frontend
   (See Section 6 for exact code)
       ↓
9. Partner is live — their users can now pay through Paycher
```

### Phase C: Payment Flow (Every Transaction)

```
10. End user clicks "Pay ₹500" on partner's website/app
        ↓
11. Partner's backend calls:
    POST /api/v1/payments/initiate
    (with API Key + HMAC Signature + amount)
        ↓
12. Paycher creates a Transaction record (status: PENDING)
        ↓
13. Paycher calls Paywise API to create a payment session
        ↓
14. Paywise returns a payment URL
    (e.g., https://sandbox.merchant.paywize.in/pay/xyz123)
        ↓
15. Paycher returns the payment URL to the partner
        ↓
16. Partner redirects/embeds the payment URL for the end user
        ↓
17. End user pays via UPI / Card / Netbanking on Paywise's page
        ↓
18. Paywise processes the payment through actual bank rails
        ↓
19. Paywise POSTs a webhook to:
    POST /webhooks/paywise
    (encrypted payload + HMAC signature)
        ↓
20. Paycher decrypts + verifies the webhook
        ↓
21. Paycher atomically:
    - Marks Transaction as SUCCESS
    - Credits partner wallet: ₹amount × (1 - commissionRate)
    - Credits platform wallet: ₹amount × commissionRate
    - Creates ledger entries for both
        ↓
22. Paycher sends a webhook to the PARTNER's webhook URL
    (notifying them: "payment for order XYZ succeeded")
```

### Phase D: Partner Withdrawal (Settlement)

```
23. Partner's wallet accumulates earnings over time
        ↓
24. Partner clicks "Withdraw Funds" in their dashboard
        ↓
25. Partner enters withdrawal amount + confirms their bank account
        ↓
26. Paycher creates a Settlement record (status: PENDING)
        ↓
27. Admin sees the settlement in their dashboard
        ↓
28. Admin clicks "Accept & Start Processing" → status becomes PROCESSING
        ↓
29. Admin manually transfers money from Paycher's Paywise account
    to the partner's bank account via NEFT/IMPS
        ↓
30. Admin enters the UTR/bank reference number
        ↓
31. Admin clicks "Mark as Completed" → status becomes COMPLETED
        ↓
32. Partner receives email confirmation with UTR
        ↓
    (If transfer fails → Admin marks FAILED → funds refunded to partner wallet)
```

### Phase E: Paywise Settles to Paycher's Bank

```
33. Paywise collects all payments made by end users
        ↓
34. Paywise periodically settles the accumulated amount to
    Paycher's linked bank account (minus Paywise's own fees)
        ↓
35. Paywise POSTs a settlement webhook to:
    POST /webhooks/paywise-settlement
        ↓
36. Paycher records it as a CREDIT on the platform wallet ledger
        ↓
37. Admin can see this in Wallet → "Paywise Payouts" tab
```

---

## 4. MONEY FLOW (WITH NUMBERS)

**Example: End user pays ₹1,000 to a gaming partner (2% commission rate)**

```
END USER pays ₹1,000
         ↓
PAYWISE receives ₹1,000 (holds it temporarily)
         ↓
WEBHOOK fires → Paycher processes:
  ├── Partner wallet gets credited: ₹980  (₹1,000 × 98%)
  └── Platform wallet gets credited: ₹20  (₹1,000 × 2%)
         ↓
PAYWISE settles to Paycher's bank account:
  After X days, Paywise transfers the collected total to Paycher's bank
  (₹1,000 minus Paywise's processing fee, e.g. ₹1,000 - ₹23 = ₹977)
         ↓
PARTNER requests withdrawal of ₹980 from their wallet:
  Paycher deducts a small settlement fee (e.g. ₹5)
  Partner receives: ₹975 to their bank account
         ↓
PAYCHER's real earnings:
  Commission from this transaction: ₹20
  Settlement fee charged to partner: ₹5
  Minus Paywise fee paid: ₹23
  Net platform profit: ₹20 + ₹5 - ₹23 = ₹2
```

---

## 5. SYSTEM ARCHITECTURE (TECHNICAL)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│         D:\Documents\Shukrana-enterprises-\                  │
│                                                              │
│  Admin Portal:          Merchant Portal:                     │
│  ├── Control (KYC)      ├── Payin (payment history)         │
│  ├── Wallet             ├── Payout (settlements)            │
│  ├── Payin              └── Business (wallet + API keys)    │
│  └── Merchants                                              │
└─────────────────────────────────────────────────────────────┘
                           ↕ HTTP (axios, JWT auth)
┌─────────────────────────────────────────────────────────────┐
│                BACKEND (Node.js + Express + TypeScript)      │
│          c:\Users\Kishan B M\Documents\pay\src\             │
│                                                              │
│  Routes:                Services:                           │
│  /auth/admin            adminAuth.service.ts                │
│  /auth/partner          payment.service.ts                  │
│  /api/v1/payments       settlementService.ts                │
│  /api/v1/settlements    settlementProcessingService.ts      │
│  /api/v1/partners       paywise.service.ts                  │
│  /webhooks/paywise      partnerWebhook.service.ts           │
│  /webhooks/paywise-settlement                               │
│  /admin/reports/*       Middleware:                         │
│  /partner/reports/*     requireAdmin.ts                     │
│                         authenticatePartner.ts              │
└─────────────────────────────────────────────────────────────┘
                           ↕ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL)                           │
│                                                              │
│  Tables:                                                     │
│  ├── partners           (partner accounts + KYC status)     │
│  ├── admins             (admin accounts)                     │
│  ├── Wallet             (balances: PARTNER + PLATFORM)      │
│  ├── WalletTransaction  (ledger of every credit/debit)      │
│  ├── Transaction        (every payment attempt)              │
│  ├── Settlement         (every withdrawal request)           │
│  ├── KYCDocument        (uploaded documents)                │
│  ├── WebhookLog         (outbound webhook delivery log)     │
│  └── AuditLog           (admin + system action history)     │
└─────────────────────────────────────────────────────────────┘
                           ↕ REST API (AES encrypted)
┌─────────────────────────────────────────────────────────────┐
│                    PAYWISE (External Gateway)                │
│                https://sandbox.merchant.paywize.in/api/     │
│                                                              │
│  ├── POST /token        (get access token)                  │
│  ├── POST /collection   (create payment session)            │
│  └── GET  /collection/:id (check status)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. PARTNER INTEGRATION — HOW A 3RD PARTY INTEGRATES

### Step 1: Get Credentials

After KYC approval, the partner gets from their dashboard:
- `API Key` — public identifier (safe to use in server-to-server calls)
- `API Secret` — private signing key (NEVER expose in frontend/mobile)

### Step 2: Authentication Protocol

Every API call must include **3 headers**:

```
X-API-Key:   <your_api_key>
X-Timestamp: <unix_timestamp_seconds>   e.g., 1709500000
X-Signature: <hmac_sha256_hex>
```

**How to compute the signature:**
```
canonical_string = timestamp + METHOD + path + raw_body_json

signature = HMAC-SHA256(
  key    = api_secret,
  message = canonical_string
)
```

**Example in Node.js:**
```javascript
const crypto = require('crypto');

function signRequest(apiSecret, method, path, body) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyString = JSON.stringify(body);
  const canonical = `${timestamp}${method}${path}${bodyString}`;
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(canonical)
    .digest('hex');
  return { timestamp, signature, bodyString };
}
```

**Example in Python:**
```python
import hmac, hashlib, time, json

def sign_request(api_secret, method, path, body):
    timestamp = str(int(time.time()))
    body_string = json.dumps(body, separators=(',', ':'))
    canonical = f"{timestamp}{method}{path}{body_string}"
    signature = hmac.new(
        api_secret.encode(),
        canonical.encode(),
        hashlib.sha256
    ).hexdigest()
    return timestamp, signature
```

**Security rules:**
- Timestamp must be within 5 minutes of server time (anti-replay)
- Never send signature from frontend (attacker can see secret)
- All payment calls must come from partner's **backend server**

### Step 3: Initiate a Payment

**Endpoint:** `POST /api/v1/payments/initiate`

**Request:**
```json
{
  "amount": 500,
  "currency": "INR",
  "userReference": "ORDER_12345",
  "idempotencyKey": "unique-uuid-per-request",
  "paymentMethod": "UPI",
  "userEmail": "user@example.com",
  "callbackUrl": "https://yoursite.com/payment/callback"
}
```

**Headers:**
```
Content-Type: application/json
X-API-Key: pk_live_abc123...
X-Timestamp: 1709500000
X-Signature: 8f3a9b2c...
```

**Response (success):**
```json
{
  "success": true,
  "data": {
    "transactionId": "uuid-of-transaction",
    "paymentUrl": "https://sandbox.merchant.paywize.in/pay/xyz",
    "amount": 500,
    "commission": 10,
    "netAmount": 490,
    "status": "PENDING",
    "expiresAt": "2026-03-04T13:30:00Z"
  }
}
```

**What to do with the response:**
- Redirect the user to `paymentUrl` OR embed it in an iframe/webview
- Save the `transactionId` to track this payment in your DB
- Poll `GET /api/v1/payments/{transactionId}/status` if needed

### Step 4: Receive Payment Result via Webhook

When payment completes, Paycher POSTs to your `webhookUrl`:

**Headers sent to your endpoint:**
```
X-Paycher-Signature: <hmac_sha256>
X-Paycher-Event: payment.success   (or payment.failed)
Content-Type: application/json
```

**Payload:**
```json
{
  "event": "payment.success",
  "transactionId": "uuid-of-transaction",
  "partnerId": "your-partner-id",
  "amount": 500,
  "netAmount": 490,
  "commission": 10,
  "status": "SUCCESS",
  "userReference": "ORDER_12345",
  "paymentMethod": "UPI",
  "completedAt": "2026-03-04T12:00:00Z"
}
```

**How to verify the webhook (in your server):**
```javascript
const crypto = require('crypto');

function verifyWebhook(secret, rawBody, signatureHeader) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)  // raw request body as string
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader)
  );
}

// Express example:
app.post('/payment/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-paycher-signature'];
  if (!verifyWebhook(WEBHOOK_SECRET, req.body.toString(), sig)) {
    return res.status(401).send('Invalid signature');
  }
  const payload = JSON.parse(req.body);
  if (payload.event === 'payment.success') {
    // Fulfill the order for payload.userReference
    await db.orders.update(payload.userReference, { status: 'PAID' });
  }
  res.status(200).send('OK');
});
```

**Critical rule:** Always respond with HTTP 200 quickly. Process async. Paycher retries 3 times with exponential backoff if you return non-200.

### Step 5: Check Payment Status (Optional)

If webhook is delayed, you can poll:
```
GET /api/v1/payments/{transactionId}/status
Headers: X-API-Key, X-Timestamp, X-Signature
```

---

## 7. THE TEST INTEGRATION HTML FILE

**File:** `c:\Users\Kishan B M\Documents\pay\test-integration.html`

This file simulates what a 3rd party partner's website would look like.
It is a **self-contained single HTML file** — no framework, no npm, just vanilla JS.

### What it shows

It mimics a **Gaming Hub** website with 4 games (Treasure Quest, Dragon Raid, Cyber Race, Space War), each with a price. This is literally what any partner business would build on their side.

### What it does technically

```
1. USER ENTERS AMOUNT + EMAIL
        ↓
2. SIGNATURE COMPUTED (Web Crypto API in browser):
   - Gets timestamp (seconds)
   - Builds body JSON
   - Computes HMAC-SHA256(secret, timestamp + "POST" + path + body)
   - All in the browser using crypto.subtle (no library needed)
        ↓
3. SENDS POST /api/v1/payments/initiate with:
   - X-API-Key header
   - X-Timestamp header
   - X-Signature header
   - JSON body
        ↓
4. RECEIVES paymentUrl from Paycher backend
        ↓
5. SHOWS SUCCESS with:
   - "Simulate Payment Success" button → calls POST /dev/complete-payment/:id
   - "Simulate Payment Failure" button → calls POST /dev/fail-payment/:id
        ↓
6. DEV ENDPOINTS bypass Paywise (sandbox only):
   - /dev/complete-payment/:id directly calls completePayment()
   - Atomically credits partner + platform wallets
   - This is what Paywise would do via real webhook in production
```

### Why the dev simulation endpoints exist

In production, the payment URL would go to Paywise's real page.
The user would pay via UPI → Paywise sends a webhook → Paycher credits wallets.

But in sandbox/dev, we can't make real UPI payments, so:
- `POST /dev/complete-payment/:id` — manually triggers `completePayment()`
- `POST /dev/fail-payment/:id` — manually triggers `failPayment()`

These are only available when `NODE_ENV !== 'production'`.

### Why a 3rd party would integrate

A partner integrates because:
1. **They don't want to deal with Paywise directly** — Paycher handles encryption, token refresh, webhook decryption
2. **They get a wallet** — earnings are tracked automatically, they can withdraw anytime
3. **One API** — instead of integrating multiple gateways, they use Paycher's single API
4. **Compliance** — Paycher handles KYC compliance, the partner just builds their product

---

## 8. COMPLETE API REFERENCE

### Auth Routes (no authentication needed)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/admin/login` | Admin login → returns JWT |
| POST | `/auth/partner/login` | Partner login → returns JWT |
| POST | `/auth/partner/register` | Partner registration (via invite token) |

### Partner API Routes (API Key + Signature auth)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/payments/initiate` | Initiate a payment, get back paymentUrl |
| GET | `/api/v1/payments/:id/status` | Get transaction status |
| GET | `/api/v1/payments/:id/check-status` | Force-check status from Paywise |

### Partner Dashboard Routes (JWT auth)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/settlements` | Request a withdrawal |
| GET | `/partner/reports/earnings` | Wallet balance + earnings summary |
| GET | `/partner/reports/transactions` | Transaction history |
| GET | `/partner/reports/settlements` | Settlement (withdrawal) history |

### Admin Routes (JWT auth, SUPER_ADMIN role)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/reports/platform-stats` | Platform dashboard stats |
| GET | `/admin/reports/transactions` | All transactions across all partners |
| GET | `/admin/reports/settlements` | All settlement requests |
| GET | `/admin/reports/paywise-settlements` | Paywise bank payout log |
| GET | `/admin/reports/ledger` | Full platform ledger |
| GET | `/admin/reports/reconciliation` | Wallet vs ledger reconciliation |
| POST | `/api/v1/settlements/:id/process` | Mark settlement as PROCESSING |
| POST | `/api/v1/settlements/:id/complete` | Mark settlement as COMPLETED (with UTR) |
| POST | `/api/v1/settlements/:id/fail` | Mark settlement as FAILED (refunds wallet) |

### Webhook Routes (no auth — signature verified internally)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/paywise` | Paywise payment status webhooks |
| POST | `/webhooks/paywise-settlement` | Paywise bank settlement webhooks |

### Dev-Only Routes
| Method | Path | Description |
|--------|------|-------------|
| POST | `/dev/complete-payment/:id` | Simulate payment success (no Paywise needed) |
| POST | `/dev/fail-payment/:id` | Simulate payment failure |

---

## 9. KEY DATABASE MODELS

### Wallet
```
id        — UUID
type      — PLATFORM | PARTNER
partnerId — links to partner (null for PLATFORM wallet)
balance   — current balance (Decimal, 15,2)
currency  — INR
```

There is **exactly 1 PLATFORM wallet** for all of Paycher.
There is **1 PARTNER wallet per partner**.

### WalletTransaction (the ledger)
```
id                   — UUID
walletId             — which wallet
amount               — how much
type                 — CREDIT | DEBIT
reason               — PAYMENT | COMMISSION | SETTLEMENT | REFUND | ADJUSTMENT
relatedTransactionId — links to a payment Transaction
relatedSettlementId  — links to a Settlement
paywiseTxnId         — Paywise's own reference (unique — used for idempotency)
description          — human readable
```

Every time money moves, a WalletTransaction is created. The wallet balance is always the sum of all its ledger entries.

### Transaction
```
id             — UUID (sent as order_id to Paywise as senderId)
partnerId      — which partner initiated this
amount         — gross amount the user paid
commission     — Paycher's cut
netAmount      — what goes to partner wallet (amount - commission)
status         — PENDING | SUCCESS | FAILED | REFUNDED
paymentUrl     — the Paywise URL shared with end user
paywiseTxnId   — Paywise's transaction ID (from webhook)
userReference  — partner's own order ID
idempotencyKey — prevents duplicate transactions
```

### Settlement
```
id              — UUID
partnerId       — who requested withdrawal
walletId        — from which wallet
amount          — requested amount
fee             — Paycher's settlement fee
netAmount       — amount - fee
totalDeducted   — amount deducted from wallet (= amount, fee is separate)
status          — PENDING | PROCESSING | COMPLETED | FAILED
bankAccountSnapshot — partner's bank details at time of request (JSON)
processedBy     — admin who accepted it
completedBy     — admin who marked it complete
bankReferenceId — UTR from the bank transfer
failureReason   — if FAILED, why
```

---

## 10. SECURITY DESIGN

| Layer | Mechanism |
|-------|-----------|
| Admin access | JWT signed with `JWT_SECRET`, role must be `ADMIN` or `SUPER_ADMIN` |
| Partner dashboard | JWT signed with `JWT_SECRET`, contains `partnerId` |
| Partner API calls | API Key + HMAC-SHA256 signature + 5-minute timestamp window |
| Paywise webhooks | HMAC-SHA256 with `PAYWIZE_WEBHOOK_SECRET` + AES decryption of payload |
| Paywise settlement webhooks | HMAC-SHA256 with `PAYWIZE_WEBHOOK_SECRET` |
| Partner outbound webhooks | HMAC-SHA256 with partner-specific key, sent as `X-Paycher-Signature` |
| Idempotency | `paywiseTxnId` unique constraint prevents double-crediting |
| Rate limiting | 500 req/min per IP on webhook endpoints |

---

## 11. SETTLEMENT FEE LOGIC

When a partner requests withdrawal:
- `amount` = what they want to withdraw (e.g., ₹980)
- `fee` = calculated by the system (based on `partner.settlementFeeRate` or a default)
- `netAmount` = amount - fee (what actually lands in their bank)
- `totalDeducted` = amount deducted from partner's wallet (the full requested amount)

The `fee` goes to Paycher as revenue from the settlement service.

---

## 12. WALLET RECONCILIATION

The platform has a reconciliation endpoint (`GET /admin/reports/reconciliation`) that:
1. For every wallet, sums up all WalletTransaction records (the ledger)
2. Compares the sum to `wallet.balance`
3. Reports:
   - `OK` — balance matches ledger sum
   - `MISMATCH` — difference under ₹1 (rounding issue)
   - `CRITICAL` — significant discrepancy (data integrity problem)

This is a financial safety check that should be run daily.

---

## 13. ENVIRONMENT VARIABLES (Backend)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/paycher

# Auth
JWT_SECRET=<64_char_random_hex>
JWT_EXPIRES_IN=24h

# App
PORT=5000
NODE_ENV=development
APP_URL=http://localhost:5000

# Paywise credentials (sandbox)
PAYWIZE_API_KEY=<32_char_key>
PAYWIZE_SECRET_KEY=<16_char_key>  ← used as AES IV for encryption
PAYWIZE_MERCHANT_VPA=<your_vpa>@merchant
PAYWIZE_WEBHOOK_SECRET=<hmac_secret>
PAYWIZE_BASE_URL=https://sandbox.merchant.paywize.in/api/

# Email (for settlement notifications)
EMAIL_USER=<smtp_email>
EMAIL_PASS=<smtp_password>

# Dev mode
MOCK_PAYWISE=true  ← set to true to bypass real Paywise API calls
```

---

## 14. HOW TO TEST END-TO-END (Sandbox)

### Full flow test using the HTML file:

**Prerequisites:**
- Backend running on `http://localhost:5000`
- PostgreSQL running with migrations applied
- Platform wallet seeded (type=PLATFORM)
- At least one partner with KYC approved and API credentials

**Steps:**

1. Open `test-integration.html` in a browser (just double-click the file)
2. In the API Configuration panel, enter:
   - Partner API Key (from partner dashboard → Business tab)
   - Partner API Secret (same location)
   - Backend URL: `http://localhost:5000`
3. Click **Test Connection** — should show "✓ Connected to Backend"
4. Click a game card (e.g., Treasure Quest ₹500) OR enter custom amount
5. Enter any email address
6. Click **Pay Now**
7. If successful, you'll see:
   - Transaction ID
   - Amount / Commission / Net breakdown
   - Two buttons: "Simulate Payment Success" and "Simulate Payment Failure"
8. Click **Simulate Payment Success**
9. Verify results:
   - Partner dashboard → Payin tab → shows the ₹500 transaction as SUCCESS
   - Partner dashboard → Business tab → wallet balance increased by ₹490 (₹500 - 2%)
   - Admin dashboard → Wallet → Platform Wallet balance increased by ₹10 (2% commission)
   - Admin dashboard → Wallet → All Transactions → shows the transaction

### Settlement flow test:

10. As merchant: click "Withdraw Funds" (Payout tab)
11. Enter withdrawal amount (must be ≤ wallet balance)
12. Confirm bank account → Submit
13. As admin: go to Wallet → Settlements tab
14. Click on the settlement → "Accept & Start Processing"
15. Enter any UTR number (e.g., `UTR202603040001`)
16. Click "Mark as Completed"
17. Verify: partner wallet balance reduced, settlement shows COMPLETED

### Paywise settlement webhook test:

```bash
# Simulate Paywise paying out to Paycher's bank
curl -X POST http://localhost:5000/webhooks/paywise-settlement \
  -H "Content-Type: application/json" \
  -H "X-Paywise-Signature: <hmac_of_body_with_webhook_secret>" \
  -d '{
    "settlementId": "PWTXN001",
    "amount": 9800,
    "bankReferenceId": "UTR2026030400001",
    "status": "SETTLED"
  }'
```

Then: Admin → Wallet → "Paywise Payouts" tab → shows the entry.

---

## 15. WHAT IS FULLY BUILT vs WHAT NEEDS REAL CREDENTIALS

| Feature | Status |
|---------|--------|
| Admin authentication (login/JWT) | ✅ Working |
| Partner authentication (login/JWT) | ✅ Working |
| Partner invitation flow | ✅ Working |
| KYC upload + admin review | ✅ Working |
| API key generation after KYC | ✅ Working |
| Payment initiation (API key auth) | ✅ Working |
| Paywise integration (token, AES, initiate) | ✅ Code written, needs real sandbox credentials |
| Payment webhook processing | ✅ Working |
| Wallet crediting (atomic) | ✅ Working |
| Partner wallet dashboard | ✅ Working |
| Settlement request | ✅ Working |
| Admin settlement processing | ✅ Working |
| Partner webhook notifications | ✅ Working |
| Platform stats dashboard | ✅ Working |
| Paywise settlement webhook | ✅ Working |
| Paywise payouts log (admin) | ✅ Working |
| Reconciliation report | ✅ Working |
| Real Paywise sandbox end-to-end | ⚠️ Needs real PAYWIZE_API_KEY credentials |
| Production deployment | ⚠️ Needs server, domain, SSL, real Paywise production keys |

---

*Generated: 2026-03-04*
*Platform: NexusPay / Paycher — B2B Payment API Platform*
