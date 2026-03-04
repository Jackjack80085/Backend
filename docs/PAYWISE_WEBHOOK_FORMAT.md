# Paywise Webhook Format

## Expected Webhook Payload

```json
{
  "payload": "base64_encrypted_data",
  "signature": "hmac_signature"
}
```

Signature header is usually provided as `X-Paywise-Signature: sha256=<hex>`.

## Decrypted Payload Structure

```json
{
  "senderId": "our_transaction_id",
  "transactionId": "paywise_txn_id",
  "status": "SUCCESS" | "FAILED" | "PENDING",
  "amount": "1000.00",
  "paymentMethod": "UPI",
  "failureReason": "Optional failure message",
  "timestamp": "2026-02-15T10:30:00Z"
}
```

## Status Mapping

- SUCCESS, COMPLETED, SETTLED → SUCCESS
- FAILED, DECLINED, REJECTED → FAILED
- Others → PENDING

## Notes

- Webhook payload `payload` (or `data`) is AES-256-CBC encrypted and must be decrypted with the API key (key) and secret (IV).
- Verify HMAC signature when provided before decrypting.
- Respond with HTTP 200 quickly and process heavy work asynchronously.
