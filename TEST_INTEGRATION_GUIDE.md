# Payment API Integration Test Guide

## Overview

The `test-integration.html` file is a **simulation of a 3rd-party gaming platform** that integrates with your Paycher payment APIs. It demonstrates how a merchant's customers would initiate payments through your platform.

## Quick Start

### 1. Start the Backend Server

```bash
cd "c:\Users\Kishan B M\Documents\pay"
npx ts-node src/server.ts
```

The server runs on `http://localhost:5000`

### 2. Open the Integration Test Page

Simply open `test-integration.html` in your browser:
- File path: `c:\Users\Kishan B M\Documents\pay\test-integration.html`
- Or: Double-click the file from Windows Explorer

### 3. Configure Your Partner Credentials

To use the integration test, you need:
- **Partner API Key** - From your partner dashboard (`/api/v1/partner/api-credentials`)
- **Partner API Secret** - From your partner dashboard (shown once during creation)
- **Backend URL** - Default: `http://localhost:5000`

#### How to get Partner Credentials:

1. **Login to your merchant dashboard** (`http://localhost:3000`)
   - Email: `testpartner1@example.com` (or invite a new partner)
   - Password: `TestPassword123` (or use the password set during registration)

2. **Go to "API Gateway" tab** and copy:
   - API Key (under "API Infrastructure")
   - API Secret (click "Show" to reveal, or copy button)

3. **Paste into the HTML form**:
   - Fill in the "Partner API Key" field
   - Fill in the "Partner API Secret" field

### 4. Test the Connection

Click the **"Test Connection"** button to verify:
- Backend is reachable
- API is healthy
- Response appears in the "API Response" box

### 5. Initiate a Payment

1. **Select a game** by clicking one of the game cards (₹500-₹1500)
   - OR manually enter a custom amount in "Custom Amount"

2. **Enter your email** in the "Your Email" field

3. Click **"Pay Now"** button

### 6. Review the API Log

The "Integration Log" (bottom right) shows:
- All API calls being made
- Request/response timestamps
- Success/error messages
- Full API response data

## How It Works

### Architecture

```
┌─────────────────────┐
│ Gaming Platform     │ (test-integration.html - YOU ARE HERE)
│ (3rd Party)         │
└──────────┬──────────┘
           │ API Call
           │ POST /api/v1/payments/initiate
           │ Headers:
           │   - X-API-Key: (your-api-key)
           │   - X-Timestamp: (unix-timestamp)
           │   - X-Signature: (hmac-sha256)
           ▼
┌─────────────────────┐
│ Paycher Gateway     │ (Your Platform)
│ Backend             │
│ (Node.js + Express) │
└──────────┬──────────┘
           │ Validates signature
           │ Creates transaction
           │ Routes to Paywise
           ▼
┌─────────────────────┐
│ Paywise Gateway     │ (Real payment provider)
│ (Sandbox/Live)      │
└─────────────────────┘
```

### API Request Format

When you click "Pay Now", the HTML page sends:

```json
POST http://localhost:5000/api/v1/payments/initiate
Headers:
  X-API-Key: "your-api-key-here"
  X-Timestamp: "1693472400000"
  X-Signature: "hmac-sha256-hash"
  Content-Type: "application/json"

Body:
{
  "amount": 500.00,
  "currency": "INR",
  "userReference": "game_1693472400000",
  "idempotencyKey": "idempotent_1693472400000_0.123",
  "userEmail": "player@email.com"
}
```

### API Response

Success response:
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_abc123...",
    "status": "PENDING",
    "amount": 500,
    "currency": "INR",
    "userReference": "game_1693472400000",
    "expiresAt": "2026-03-03T19:00:00.000Z"
  }
}
```

Error response:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_SIGNATURE",
    "message": "Invalid API signature"
  }
}
```

## Testing Scenarios

### Scenario 1: Successful Payment Initiation
- ✅ API Key and Secret configured
- ✅ Amount between ₹100 and ₹100,000
- ✅ Valid email provided
- **Expected**: Payment initiated successfully, receive transaction ID

### Scenario 2: Invalid API Key
- ❌ Wrong API Key provided
- **Expected**: Error response with "INVALID_KEY" or "UNAUTHORIZED"

### Scenario 3: Invalid Signature
- ❌ Wrong API Secret (signature won't match)
- **Expected**: Error response with "INVALID_SIGNATURE"

### Scenario 4: Amount Out of Range
- ❌ Amount < ₹100 or > ₹100,000
- **Expected**: Validation error on client side

### Scenario 5: Network Error
- ❌ Backend server not running
- **Expected**: Connection error in the log

## Understanding the Log Output

Each log entry shows:
- **[HH:MM:SS]** - Timestamp of the event
- **Type indicator** - `[info]`, `[success]`, or `[error]`
- **Message** - What happened

Examples:
```
[14:30:45] Selected: Dragon Raid (₹1000)
[14:30:50] Testing connection to backend...
[14:30:50] ✓ Backend is healthy
[14:30:55] Initiating payment...
[14:30:55] Amount: ₹1000
[14:30:55] User: player@email.com
[14:30:55] Sending request to http://localhost:5000/api/v1/payments/initiate
[14:30:56] Response status: 200
[14:30:56] ✓ Payment initiated successfully!
```

## Important Notes

### For Production Use

This is a **test/demo page**. For real integration:

1. **Signature Verification**
   - Currently uses Base64 for demo
   - Should use proper HMAC-SHA256
   - Use libraries like `crypto-js` in production

2. **API Secret Security**
   - NEVER send API Secret in requests (it's for signing only)
   - NEVER expose it in frontend code
   - Always sign on your backend server

3. **Real Payment Flow**
   - This initiates a payment but doesn't complete it
   - Real flow would include:
     - Payment gateway redirect
     - Customer enters payment details
     - Webhook callback with payment result
     - Settlement to merchant account

### Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Connection Failed" | Backend not running | Start: `npx ts-node src/server.ts` |
| "INVALID_SIGNATURE" | Wrong API Secret | Copy exact secret from partner dashboard |
| "UNAUTHORIZED" | Wrong API Key | Copy exact API key from partner dashboard |
| Empty response | CORS issue | Ensure backend is on `localhost:5000` |
| No log entries | JavaScript disabled | Enable JavaScript in browser |

## Next Steps After Testing

### 1. Verify in Merchant Dashboard
After a successful payment initiation:
- Login to merchant portal
- Check "Ledger" tab for the new transaction
- Verify amount and status

### 2. Check Admin Dashboard
As an admin:
- View all transactions
- Monitor platform stats
- Process settlements

### 3. Implement in Real Platform
Once verified working:
- Copy the API signature logic to your gaming platform
- Implement webhook handling for payment updates
- Store transaction IDs for reconciliation
- Handle payment success/failure flows

## Testing with Multiple Partners

To test with different partners:

1. **Create a new partner** via admin dashboard
2. **Complete KYC** process
3. **Copy their API credentials**
4. **Paste into the HTML form**
5. **Repeat the payment flow**

Each partner has:
- Unique API Key & Secret
- Own wallet and earnings
- Separate transaction records

## Code Reference

The HTML page includes:

- **Frontend Code** (JavaScript)
  - Payment initiation logic
  - Signature generation (demo)
  - Error handling
  - Logging system

- **Styling** (CSS)
  - Responsive design
  - Gaming platform aesthetics
  - Dark-mode log viewer
  - Real-time status indicators

- **API Integration**
  - Direct HTTP POST requests
  - Custom header injection
  - Response parsing
  - Error display

You can view/modify the source by:
```bash
notepad "c:\Users\Kishan B M\Documents\pay\test-integration.html"
```

Or right-click → "Open with" → Your editor

## Support

For issues with:
- **Backend not responding**: Check server logs (`/tmp/server.log`)
- **API errors**: Review the "API Response" box for error details
- **Missing credentials**: Ensure you're logged into merchant dashboard
- **Database issues**: Verify PostgreSQL is running

---

**Happy Testing! 🚀**

Now you can verify that:
1. ✅ Partner APIs are working correctly
2. ✅ Payment initiation flow is complete
3. ✅ Signature verification works
4. ✅ Transactions are recorded in the database
5. ✅ Admin can view and manage transactions
