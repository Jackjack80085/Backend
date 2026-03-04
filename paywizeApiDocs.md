Getting Started 
Get started with Paywize APIs. Quick-start guide for integrating payouts, collections, and connected 
banking. 
Last updated: 2026-02-21 
Getting Started 
Welcome to the Paywize Platform! This guide will help you understand our payment infrastructure 
and get started with the right product for your needs. 
Platform Overview 
Paywize provides a complete payment infrastructure with three core products: 
Payout API 
Available 
Instant money transfers and disbursements 
View Payout Docs → 
Collection API 
Available 
Accept payments through multiple channels 
View Collection Docs → 
Connected Banking 
Available 
Real-time banking services 
View Connected Banking Docs → 
Quick Decision Guide 
Choose the right product based on your use case: 
Use Payout API When: 
Sending money to vendors, employees, or customers 
Processing refunds and cashbacks 
Bulk salary payments 
Marketplace seller payouts 
Insurance claim settlements 
Use Collection API When: 
Accepting payments from customers 
E-commerce payment processing 
Subscription billing 
Invoice payments 
Donation collection 
Use Connected Banking When: 
Verifying customer bank accounts 
KYC and compliance requirements 
Account balance verification 
Transaction history analysis 
Virtual Account Management (VAM) 
Prerequisites 
Before you start, ensure you have: 
Active Paywize Account: Sign up at dashboard.paywize.in 
API Credentials: Get your API key and secret key from the dashboard 
Development Environment: Set up your preferred programming environment 
Webhook Endpoint: Prepare an HTTPS endpoint for receiving notifications 
Integration Steps 
1. Account Setup 
Create Account: Visit our dashboard and create your merchant account 
Complete KYC: Submit required documents for verification 
Get API Credentials: Generate your API key and secret key from the dashboard 
2. Environment Setup 
Production Environment 
Base URL: https://merchant.paywize.in/api/ 
Dashboard: https://dashboard.paywize.in 
Sandbox Environment 
Base URL: https://sandbox.merchant.paywize.in/api/ 
Dashboard: https://sandbox-dashboard.paywize.in 
3. Authentication & Encryption 
All Paywize APIs use unified authentication and encryption: 
Authentication: JWT tokens with 5-minute expiry 
Encryption: AES-256-CBC encryption for all data 
Base URL: https://merchant.paywize.in/api/ 
Detailed Guides: 
Authentication Guide - Learn JWT token generation 
Encryption Guide - Learn AES-256-CBC implementation 
Quick Authentication Example 
import crypto from 'crypto'; 
// Encryption function (shared across all APIs) 
function encryptMerchantData(data, key, iv) { 
if (typeof data === 'object') { 
data = JSON.stringify(data); 
} 
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv); 
const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]); 
  return encrypted.toString('base64'); 
} 
 
// Generate access token 
async function generateAccessToken() { 
  const credentials = { 
    apiKey: 'your_32_char_api_key_here_123456', 
    secretKey: 'your_16_char_iv_12' 
  }; 
 
  const encryptedPayload = encryptMerchantData(credentials, API_KEY, SECRET_KEY); 
 
  const response = await fetch('https://merchant.paywize.in/api/v1/auth/clients/token', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ payload: encryptedPayload }) 
  }); 
 
  const result = await response.json(); 
  if (result.respCode === 2000) { 
    const decryptedData = decryptMerchantData(result.data, API_KEY, SECRET_KEY); 
    return JSON.parse(decryptedData).token; 
  } 
} 
4. Make Your First API Call 
Payout API Example 
 
// Step 1: Generate token 
const token = await generateAccessToken(); 
 
// Step 2: Initiate payout 
const payoutData = { 
sender_id: "unique_transaction_id", 
wallet_id: "PAYWIZE12345679", 
payment_mode: "IMPS", 
beneficiary_name: "John Doe", 
beneficiary_acc_number: "123456789012", 
beneficiary_ifsc: "HDFC0001234", 
amount: 1000, 
remarks: "Payment", 
callback_url: "https://your-website.com/webhook/payout" 
}; 
const encryptedPayload = encryptMerchantData(payoutData, API_KEY, SECRET_KEY); 
const response = await fetch('https://merchant.paywize.in/api/payout/v1/initiate', { 
method: 'POST', 
headers: { 
'Content-Type': 'application/json', 
'Authorization': `Bearer ${token}` 
}, 
body: JSON.stringify({ payload: encryptedPayload }) 
}); 
Collection API Example 
// Step 1: Generate token (same as above) 
const token = await generateAccessToken(); 
// Step 2: Initiate collection 
const collectionData = { 
senderId: "unique_sender_id", 
requestAmount: "500.00", 
vpa: "merchant@paywize", 
callbackUrl: "https://your-website.com/webhook/collection" 
}; 
const encryptedPayload = encryptMerchantData(collectionData, API_KEY, SECRET_KEY); 
const response = await fetch('https://merchant.paywize.in/api/collection/v1/initiate', { 
method: 'POST', 
headers: { 
'Content-Type': 'application/json', 
'Authorization': `Bearer ${token}` 
}, 
body: JSON.stringify({ payload: encryptedPayload }) 
}); 
Security Best Practices 
API Credentials: Never expose API secrets in client-side code 
HTTPS Only: Always use HTTPS for API requests 
Token Management: Implement proper token refresh logic (5-minute expiry) 
Encryption: Always encrypt request/response data using AES-256-CBC 
Webhook Security: Verify webhook signatures 
Error Handling: Implement proper error handling and retry logic 
Testing 
Sandbox Environment 
Use our sandbox environment for testing: 
Base URL: https://sandbox.merchant.paywize.in/api/ 
No real money: All transactions are simulated 
Test credentials: Use sandbox API credentials 
Test accounts: Use provided test bank accounts 
Test Bank Accounts 
// Test bank account (always successful) 
{ 
} 
account_number: "1234567890", 
ifsc: "TEST0001234", 
name: "Test Account" 
// Test bank account (always fails) 
{ 
} 
account_number: "9876543210", 
ifsc: "TEST0001234", 
name: "Test Fail Account" 
Webhooks 
Set up webhooks for real-time notifications: 
Per-transaction Setup: Provide callback_url in each API request 
HTTPS Endpoints: Ensure webhook URLs use HTTPS 
Signature Verification: Always verify webhook signatures 
Idempotency: Handle duplicate webhook deliveries 
Quick Response: Return 200 OK within 30 seconds 
Common Integration Patterns 
1. E-commerce Platform 
Use Collection API for customer payments 
Use Payout API for vendor settlements 
Use Connected Banking for verification 
2. Marketplace 
Use Collection API for buyer payments 
Use Payout API for seller payouts 
Use Connected Banking for seller onboarding 
3. Fintech Application 
Use all APIs for comprehensive financial services 
Start with Collection and Payout APIs 
Add Connected Banking for comprehensive financial services 
Error Handling 
Implement robust error handling: 
try { 
const response = await fetch(apiUrl, options); 
const data = await response.json(); 
if (data.respCode !== 2000) { 
throw new Error(`API Error ${data.respCode}: ${data.respMessage}`); 
} 
// Decrypt response data 
const decryptedData = decryptMerchantData(data.data, API_KEY, SECRET_KEY); 
return JSON.parse(decryptedData); 
} catch (error) { 
console.error('API call failed:', error); 
// Implement retry logic or fallback 
} 
Next Steps 
Get Started with Available APIs 
Payout API Quick Start - Start sending money instantly 
Collection API Quick Start - Start accepting payments 
Learn Core Concepts 
Authentication Guide - Master JWT token generation 
Encryption Guide - Implement AES-256-CBC encryption 
Explore More 
Connected Banking Overview - Multi-bank integration APIs 
Support 
Need help? We're here to assist: 
Technical Support: developer-support@paywize.in 
Business Queries: business@paywize.in 
Documentation Issues: docs@paywize.in 
Resources 
Developer Portal: https://developer.paywize.in 
Status Page: https://status.paywize.in 
Community Forum: https://community.paywize.in 
Rate Limits 
All APIs have rate limits to ensure fair usage: 
Token Generation: 10 requests per minute 
API Calls: 1000 requests per minute (varies by endpoint) 
Webhook Retries: 5 attempts with exponential backoff 
API Docs 
Payout API 
Initiate Payout 
POST 
/payout/v1/initiate 
Initiate Payout 
Initiate instant payouts via IMPS or NEFT using Paywize API. 
Last updated: 2026-02-21 
Initiate Payout 
Overview 
Initiate a payout transaction to transfer money to a beneficiary bank account. Supports IMPS, NEFT, 
and RTGS transfer modes with real-time status tracking. 
Quick Reference 
Attribute 
Method POST 
URL 
Details 
https://merchant.paywize.in/api/payout/v1/initiate 
Authentication Bearer token required 
Content-Type application/json 
Encryption 
Rate Limit 
Endpoint 
AES-256-CBC required 
100 requests/minute 
Authentication Required: Bearer token 
Authentication 
This endpoint requires a valid JWT Bearer token. Learn how to generate tokens: Authentication 
Guide → 
Request Headers 
Content-Type: application/json 
Authorization: Bearer <jwt_token> 
Request Body 
The request body must contain encrypted data using AES-256-CBC encryption: 
{ 
"payload": "0oA+t8GGuDZ0FrEbhM9bZ2pxTDZasdasdasasdjqwuhenqwj^7y=" 
} 
Learn about encryption: Encryption Guide → 
 
Required Fields (Before Encryption) 
Field Required Type Description 
sender_id Yes String Unique ID for each merchant (Max 36 characters) 
wallet_id Yes String Unique ID for each merchant. Example: PAYWIZE12345679 / 
8109039352 
amount Yes Number The amount in rupees. Provide up to two decimals for paise. 
Example: 5.00 
payment_mode Yes String The payment mode. Accepted values: IMPS, NEFT and RTGS 
beneficiary_name Yes String The Name of the beneficiary. Max 40 characters long. 
Example: John Doe 
beneficiary_ifsc Yes String The IFSC code of the beneficiary. Must be 11 characters long. 
Example: SBIN0000300 
beneficiary_acc_number Yes String The account number of the beneficiary. Example: 
00001234567890 
remarks Yes String The remarks for the payout. Example: vendor (maximum 10 
characters) 
callback_url Yes String Webhook URL for status notifications 
Sample Request (Before Encryption) 
 
{ 
  "sender_id": "unique_transaction_id", 
  "wallet_id": "PAYWIZE12345679", 
  "payment_mode": "IMPS", 
  "beneficiary": { 
        "beneficiary_name": "Jane Doe", 
        "beneficiary_ifsc": "HDFC0123456", 
        "beneficiary_acc_number": "123456789012" 
}, 
  "amount":"1000.00", 
  "remarks": "Payment", 
  "callback_url": "https://your-website.com/webhook/payout" 
} 
Response 
Success Response (200 OK) 
 
{ 
  "resp_code": 2000, 
  "resp_message": "Payout request created successfully", 
  "data": "U2FsdGVkX1+XYZ789......encrypted_response_here" 
} 
Decrypted Response Data 
 
{ 
  "transaction_id": "TXN123456", 
  "sender_id": "PAYOUT123456", 
  "wallet_id": "PAYWIZE12345679", 
  "amount": "100.00", 
  "payment_mode": "IMPS", 
  "remarks": "Vendorpay", 
  "status": "INITIATED", 
  "status_message": "Payment initiated", 
  "beneficiary": { 
    "beneficiary_name": "Jane Doe", 
    "beneficiary_acc_number": "123456789012", 
    "beneficiary_ifsc": "HDFC0123456" 
  }, 
  "timestamps": { 
    "created_at": "2025-11-05T12:30:15Z", 
    "updated_at": "2025-11-05T12:30:15Z" 
  } 
} 
Response Fields 
Field 
Type Description 
transaction_id String Paywize generated unique transaction ID 
sender_id 
wallet_id 
String Merchant provided unique sender ID 
String Merchant wallet ID 
amount String Transfer amount 
payment_mode String Payment mode used (IMPS, NEFT, RTGS) 
remarks 
String Transfer remarks/description 
status String Current transaction status (INITIATED, PROCESSING, SUCCESS, FAILED, REFUNDED) 
status_message String Descriptive message about the current status 
beneficiary 
Object Beneficiary information object 
beneficiary.beneficiary_name String Beneficiary account holder name 
beneficiary.beneficiary_acc_number 
beneficiary.beneficiary_ifsc 
String Beneficiary account number 
String Beneficiary bank IFSC code 
timestamps 
Object Transaction timestamp information 
timestamps.created_at String Transaction creation timestamp (ISO 8601 format) 
timestamps.updated_at String Last update timestamp (ISO 8601 format) 
Error Responses 
Success Response 
Code Message 
2000 Payout request created successfully 
Client Error Responses 
Code Message 
Description 
4000 Bad Request, Please provide payload in the request 
4000 Insufficient Balance in the wallet 
Missing payload in request body 
Wallet balance is insufficient for this transaction 
4024 RTGS payment mode is not supported for this wallet_id. Please choose a valid payment 
method RTGS Service not enabled 
4025 RTGS transactions can only be processed for amounts of ₹2,00,000 
amount for RTGS is ₹2,00,000 
Code Message 
Description 
Minimun supported 
4001 Unauthorized - Invalid or expired token JWT token is invalid, expired, or missing 
Code Message 
Description 
4003 No commercial configuration found for this merchant/payment mode Payment mode not 
configured for merchant 
4003 Transaction limit exceeded. Please try with a lower amount 
daily/transaction limits 
Code Message 
Description 
4023 Missing or Invalid Wallet ID 
Amount exceeds 
Provided wallet_id is invalid or not found 
Code Message 
Field 
4002 The amount is required amount 
4002 payment mode is required 
payment_mode 
4002 The wallet id is required wallet_id 
4002 The beneficiary ifsc is required beneficiary_ifsc 
4002 The beneficiary account number is required 
4002 The beneficiary name is required 
beneficiary_acc_number 
beneficiary_name 
4002 The remarks must be a string remarks 
4002 The sender ID must be a string sender_id 
4002 The sender ID must not exceed 38 characters sender_id 
4002 Invalid or Duplicate Sender ID sender_id 
4003 Transaction amount below the minimum limit amount 
4013 Daily Limit reached 
Server Error Responses 
Code Message 
amount 
Description 
5000 Internal Server Error Unexpected server error occurred 
Transfer Mode Limits 
Mode Min Amount Max Amount Processing Time 
IMPS ₹1 
NEFT ₹1 
₹5,00,000 
₹10,00,000 
RTGS ₹2,00,000 
Instant 
30 min - 2 hours 
₹10,00,00,000 30 min - 2 hours 
Implementation Examples 
JavaScript 
import crypto from 'crypto'; 
function encryptMerchantData(data, key, iv) { 
  if (typeof data === 'object') { 
    data = JSON.stringify(data); 
  } 
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv); 
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]); 
  return encrypted.toString('base64'); 
} 
 
function decryptMerchantData(data, key, iv) { 
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv); 
  const decrypted = Buffer.concat([ 
    decipher.update(Buffer.from(data, 'base64')), 
    decipher.final() 
  ]); 
  return decrypted.toString('utf8'); 
} 
 
async function initiatePayout(token, apiKey, secretKey) { 
  const payoutData = { 
    sender_id: "unique_transaction_id", 
    wallet_id: "PAYWIZE12345679", 
    payment_mode: "IMPS", 
    beneficiary_name: "John Doe", 
    beneficiary_acc_number: "123456789012", 
    beneficiary_ifsc: "HDFC0001234", 
    amount: 1000, 
    remarks: "Payment", 
    callback_url: "https://your-website.com/webhook/payout" 
  }; 
 
  const encryptedPayload = encryptMerchantData(payoutData, apiKey, secretKey); 
 
  const response = await fetch('https://merchant.paywize.in/api/payout/v1/initiate', { 
    method: 'POST', 
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    }, 
    body: JSON.stringify({ 
      payload: encryptedPayload 
    }) 
  }); 
 
  const result = await response.json(); 
 
  if (result.resp_code === 2000) { 
    const decryptedData = decryptMerchantData(result.data, apiKey, secretKey); 
    return JSON.parse(decryptedData); 
  } else { 
    throw new Error(`API Error ${result.resp_code}: ${result.resp_message}`); 
  } 
} 
 
// Usage 
try { 
  const payoutResult = await initiatePayout(jwtToken, apiKey, secretKey); 
  console.log('Payout initiated:', payoutResult); 
  console.log('Transaction ID:', payoutResult.transaction_id); 
  console.log('Sender ID:', payoutResult.sender_id); 
} catch (error) { 
  console.error('Payout initiation failed:', error.message); 
} 
Python 
 
import requests 
import json 
from encryption_utils import encrypt_merchant_data, decrypt_merchant_data 
 
def initiate_payout(token, api_key, secret_key): 
    payout_data = { 
        "sender_id": "unique_transaction_id", 
        "wallet_id": "PAYWIZE12345679", 
        "payment_mode": "IMPS", 
       "beneficiary": { 
        "beneficiary_name": "Jane Doe", 
        "beneficiary_ifsc": "HDFC0123456", 
        "beneficiary_acc_number": "123456789012" 
      }, 
        "amount": "1000.00", 
        "remarks": "Payment", 
        "callback_url": "https://your-website.com/webhook/payout" 
    } 
 
    encrypted_payload = encrypt_merchant_data( 
        json.dumps(payout_data), 
        api_key, 
        secret_key 
    ) 
 
    response = requests.post( 
        'https://merchant.paywize.in/api/payout/v1/initiate', 
        headers={ 
            'Content-Type': 'application/json', 
            'Authorization': f'Bearer {token}' 
        }, 
        json={'payload': encrypted_payload} 
    ) 
 
    result = response.json() 
 
    if result['resp_code'] == 2000: 
        decrypted_data = decrypt_merchant_data(result['data'], api_key, secret_key) 
        return json.loads(decrypted_data) 
    else: 
        raise Exception(f"API Error {result['resp_code']}: {result['resp_message']}") 
 
# Usage 
try: 
    payout_result = initiate_payout(jwt_token, api_key, secret_key) 
    print('Payout initiated:', payout_result) 
    print('Transaction ID:', payout_result['transaction_id']) 
    print('Sender ID:', payout_result['sender_id']) 
except Exception as error: 
    print('Payout initiation failed:', str(error)) 
PHP 
 
<?php 
 
require_once 'PaywizeEncryption.php'; 
 
function initiatePayout($token, $apiKey, $secretKey) { 
    $payoutData = [ 
        'sender_id' => 'unique_transaction_id', 
        'wallet_id' => 'PAYWIZE12345679', 
        'payment_mode' => 'IMPS', 
        'beneficiary_name' => 'John Doe', 
        'beneficiary_acc_number' => '123456789012', 
        'beneficiary_ifsc' => 'HDFC0001234', 
        'amount' => 1000, 
        'remarks' => 'Payment', 
        'callback_url' => 'https://your-website.com/webhook/payout' 
    ]; 
 
    $encryptedPayload = PaywizeEncryption::encryptMerchantData($payoutData, $apiKey, 
$secretKey); 
 
    $ch = curl_init(); 
    curl_setopt($ch, CURLOPT_URL, 'https://merchant.paywize.in/api/payout/v1/initiate'); 
    curl_setopt($ch, CURLOPT_POST, 1); 
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['payload' => $encryptedPayload])); 
    curl_setopt($ch, CURLOPT_HTTPHEADER, [ 
        'Content-Type: application/json', 
        'Authorization: Bearer ' . $token 
    ]); 
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); 
 
    $response = curl_exec($ch); 
    curl_close($ch); 
 
    $result = json_decode($response, true); 
 
    if ($result['resp_code'] == 2000) { 
        $decryptedData = PaywizeEncryption::decryptMerchantData($result['data'], $apiKey, 
$secretKey); 
        return json_decode($decryptedData, true); 
} else { 
throw new Exception("API Error {$result['resp_code']}: {$result['resp_message']}"); 
} 
} 
// Usage 
try { 
$payoutResult = initiatePayout($jwtToken, $apiKey, $secretKey); 
echo "Payout initiated: " . json_encode($payoutResult) . "\n"; 
echo "Transaction ID: " . $payoutResult['transaction_id'] . "\n"; 
echo "Status: " . $payoutResult['status'] . "\n"; 
} catch (Exception $error) { 
echo "Payout initiation failed: " . $error->getMessage() . "\n"; 
} 
?> 
Best Practices 
Unique Reference IDs: Always use unique sender_id to avoid duplicates 
Amount Format: Use numeric format for amount field 
Beneficiary Verification: Verify beneficiary details before initiating payouts 
Transfer Mode Selection: Choose appropriate transfer mode based on amount and urgency 
Callback URL: Ensure webhook endpoint is accessible and responds within 30 seconds 
Error Handling: Implement proper error handling for all response codes 
Balance Check: Check wallet balance before initiating large payouts 
Rate Limiting: Respect API rate limits and implement exponential backoff 
Next Steps 
Check Transaction Status 
Check Wallet Balance 
Implement Webhooks 
Learn about Authentication 
Learn about Encryption 
API Docs 
Payout API 
Transaction Status 
POST 
/payout/v1/status 
Transaction Status 
Check real-time payout transaction status via Paywize API. 
Last updated: 2026-02-21 
Transaction Status 
Overview 
Check the current status of a payout transaction using either the transaction ID or sender ID. This 
endpoint provides real-time transaction status and detailed information. 
Quick Reference 
Attribute 
Method GET 
URL 
Details 
https://merchant.paywize.in/api/payout/v1/status 
Authentication Bearer token required 
Content-Type application/json 
Encryption 
Rate Limit 
Endpoint 
Response data is AES-256-CBC encrypted 
200 requests/minute 
Authentication Required: Bearer token 
Authentication 
This endpoint requires a valid JWT Bearer token. Learn how to generate tokens: Authentication 
Guide → 
Request Headers 
Content-Type: application/json 
Authorization: Bearer <jwt_token> 
Query Parameters 
You must provide either transaction_id or sender_id (at least one is required): 
Parameter 
Required 
transaction_id Optional 
sender_id 
Optional 
Type Description 
String Transaction ID (IRN) returned from initiate payout 
String Unique sender ID provided during payout initiation 
Note: Either transaction_id OR sender_id must be provided (at least one is required). 
Sample Requests 
Using Transaction ID 
GET https://merchant.paywize.in/api/payout/v1/status?transaction_id=PAY123456789 
Using Sender ID 
GET https://merchant.paywize.in/api/payout/v1/status?sender_id=unique_transaction_id 
Response 
Success Response (200 OK) 
{ 
"resp_code": 2000, 
"resp_message": "Transaction fetched successfully", 
  "data": "U2FsdGVkX1+XYZ789...encrypted_response_here" 
} 
Decrypted Response Data 
 
{ 
  "transaction_id": "PAY123456789", 
  "sender_id": "unique_transaction_id", 
  "wallet_id": "virtual_account_number", 
  "amount": "1000.00", 
  "payment_mode": "IMPS", 
  "remarks": "Payment", 
  "status": "SUCCESS", 
  "status_message": "Payment completed successfully", 
  "utr_number": "415612345678", 
  "beneficiary": { 
    "beneficiary_name": "John Doe", 
    "beneficiary_acc_number": "123456789012", 
    "beneficiary_ifsc": "HDFC0001234" 
  }, 
  "timestamps": { 
    "created_at": "2025-11-05T12:30:15Z", 
    "updated_at": "2025-11-05T12:35:22Z" 
  } 
} 
Response Fields 
Field Type Description 
transaction_id String Paywize generated unique transaction ID 
sender_id String Merchant provided unique sender ID 
wallet_id String Merchant wallet ID 
amount String Transfer amount 
payment_mode String Payment mode used (IMPS, NEFT, RTGS) 
remarks 
String Transfer description 
status String Current transaction status (INITIATED, PROCESSING, SUCCESS, FAILED, REFUNDED) 
status_message String Descriptive message about the current status 
utr_number 
beneficiary 
String Unique Transaction Reference number from bank 
Object Beneficiary information object 
beneficiary.beneficiary_name String Beneficiary account holder name 
beneficiary.beneficiary_acc_number 
beneficiary.beneficiary_ifsc 
String Beneficiary account number 
String Beneficiary bank IFSC code 
timestamps 
Object Transaction timestamp information 
timestamps.created_at String Transaction creation timestamp (ISO 8601 format) 
timestamps.updated_at String Last update timestamp (ISO 8601 format) 
Transaction Status Values 
Status Code 
INITIATED 
Description 
Status Message Examples 
Transaction has been initiated "Payment initiated", "Transaction created 
successfully" 
PROCESSING Transaction is being processed "Payment in progress", "Processing with bank" 
SUCCESS 
Transaction completed successfully 
"Amount transferred successfully" 
FAILED Transaction failed 
"Payment completed successfully", 
"Payment failed", "Insufficient balance", "Invalid beneficiary details" 
REFUNDED 
reversed" 
Transaction amount refunded "Amount refunded to wallet", "Transaction 
Note: Status codes are accessed via status and status messages via status_message in the response 
object. 
Error Responses 
Success Response 
Code Message 
2000 Transaction fetched successfully 
Client Error Responses 
Code Message 
Description 
4101 Missing TxnId or senderId 
Either transaction_id or sender_id parameter is required 
4102 Only provide transaction_id or sender_id not both 
Either transaction_id or sender_id 
only one parameter is required 
Code Message Description 
4001 Unauthorized – invalid or expired token JWT token is invalid, expired, or missing 
Code Message Description 
4103 Transaction not found No transaction found with provided transaction_id or sender_id 
Implementation Examples 
JavaScript 
 
import crypto from 'crypto'; 
 
function decryptMerchantData(data, key, iv) { 
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv); 
  const decrypted = Buffer.concat([ 
    decipher.update(Buffer.from(data, 'base64')), 
    decipher.final() 
  ]); 
  return decrypted.toString('utf8'); 
} 
 
async function checkPayoutStatus(token, transactionId = null, senderId = null, apiKey, secretKey) { 
  // Validate parameters 
  if (!transactionId && !senderId) { 
    throw new Error('Either transaction_id or sender_id is required'); 
  } 
  if (transactionId && senderId) { 
    throw new Error('Provide either transaction_id or sender_id, not both'); 
  } 
 
  // Build query parameter 
  const queryParam = transactionId ? `transaction_id=${transactionId}` : `sender_id=${senderId}`; 
  const url = `https://merchant.paywize.in/api/payout/v1/status?${queryParam}`; 
 
  const response = await fetch(url, { 
    method: 'GET', 
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    } 
  }); 
 
  const result = await response.json(); 
 
  if (result.resp_code === 2000) { 
    const decryptedData = decryptMerchantData(result.data, apiKey, secretKey); 
    return JSON.parse(decryptedData); 
  } else { 
    throw new Error(`API Error ${result.resp_code}: ${result.resp_message}`); 
  } 
} 
 
// Usage examples 
try { 
  // Check by transaction ID 
  const statusByTxnId = await checkPayoutStatus(jwtToken, 'PAY123456789', null, apiKey, secretKey); 
  console.log('Status by transaction_id:', statusByTxnId); 
 
  // Check by sender ID 
  const statusBySenderId = await checkPayoutStatus(jwtToken, null, 'unique_transaction_id', apiKey, 
secretKey); 
  console.log('Status by sender_id:', statusBySenderId); 
 
} catch (error) { 
  console.error('Status check failed:', error.message); 
} 
Python 
 
import requests 
import json 
from encryption_utils import decrypt_merchant_data 
 
def check_payout_status(token, api_key, secret_key, transaction_id=None, sender_id=None): 
    # Validate parameters 
    if not transaction_id and not sender_id: 
        raise ValueError('Either transaction_id or sender_id is required') 
    if transaction_id and sender_id: 
        raise ValueError('Provide either transaction_id or sender_id, not both') 
 
    # Build query parameter 
    query_param = f'transaction_id={transaction_id}' if transaction_id else f'sender_id={sender_id}' 
    url = f'https://merchant.paywize.in/api/payout/v1/status?{query_param}' 
 
    response = requests.get( 
        url, 
        headers={ 
            'Content-Type': 'application/json', 
            'Authorization': f'Bearer {token}' 
        } 
    ) 
 
    result = response.json() 
 
    if result['resp_code'] == 2000: 
        decrypted_data = decrypt_merchant_data(result['data'], api_key, secret_key) 
        return json.loads(decrypted_data) 
    else: 
        raise Exception(f"API Error {result['resp_code']}: {result['resp_message']}") 
 
# Usage examples 
try: 
    # Check by transaction ID 
    status_by_txn_id = check_payout_status(jwt_token, api_key, secret_key, 
transaction_id='PAY123456789') 
    print('Status by transaction_id:', status_by_txn_id) 
 
    # Check by sender ID 
    status_by_sender_id = check_payout_status(jwt_token, api_key, secret_key, 
sender_id='unique_transaction_id') 
    print('Status by sender_id:', status_by_sender_id) 
 
except Exception as error: 
    print('Status check failed:', str(error)) 
PHP 
 
<?php 
 
require_once 'PaywizeEncryption.php'; 
 
function checkPayoutStatus($token, $apiKey, $secretKey, $transactionId = null, $senderId = null) { 
    // Validate parameters 
    if (!$transactionId && !$senderId) { 
        throw new InvalidArgumentException('Either transaction_id or sender_id is required'); 
    } 
    if ($transactionId && $senderId) { 
        throw new InvalidArgumentException('Provide either transaction_id or sender_id, not both'); 
    } 
 
    // Build query parameter 
    $queryParam = $transactionId ? "transaction_id=$transactionId" : "sender_id=$senderId"; 
    $url = "https://merchant.paywize.in/api/payout/v1/status?$queryParam"; 
 
    $ch = curl_init(); 
    curl_setopt($ch, CURLOPT_URL, $url); 
    curl_setopt($ch, CURLOPT_HTTPGET, 1); 
    curl_setopt($ch, CURLOPT_HTTPHEADER, [ 
        'Content-Type: application/json', 
        'Authorization: Bearer ' . $token 
    ]); 
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); 
 
    $response = curl_exec($ch); 
    curl_close($ch); 
 
    $result = json_decode($response, true); 
 
    if ($result['resp_code'] == 2000) { 
        $decryptedData = PaywizeEncryption::decryptMerchantData($result['data'], $apiKey, 
$secretKey); 
        return json_decode($decryptedData, true); 
    } else { 
        throw new Exception("API Error {$result['resp_code']}: {$result['resp_message']}"); 
    } 
} 
 
// Usage examples 
try { 
    // Check by transaction ID 
    $statusByTxnId = checkPayoutStatus($jwtToken, $apiKey, $secretKey, 'PAY123456789'); 
    echo "Status by transaction_id: " . json_encode($statusByTxnId) . "\n"; 
 
    // Check by sender ID 
    $statusBySenderId = checkPayoutStatus($jwtToken, $apiKey, $secretKey, null, 
'unique_transaction_id'); 
    echo "Status by sender_id: " . json_encode($statusBySenderId) . "\n"; 
 
} catch (Exception $error) { 
    echo "Status check failed: " . $error->getMessage() . "\n"; 
} 
 
?> 
cURL Example 
 
# Check status by transaction ID 
curl -X GET "https://merchant.paywize.in/api/payout/v1/status?transaction_id=PAY123456789" \ 
  -H "Content-Type: application/json" \ 
  -H "Authorization: Bearer YOUR_JWT_TOKEN" 
 
# Check status by sender ID 
curl -X GET "https://merchant.paywize.in/api/payout/v1/status?sender_id=unique_transaction_id" \ 
  -H "Content-Type: application/json" \ 
  -H "Authorization: Bearer YOUR_JWT_TOKEN" 
Status Flow 
 
graph TD 
    A[INITIATED] --> B[PROCESSING] 
    B --> C[SUCCESS] 
    B --> D[FAILED] 
    B --> E[PENDING] 
    E --> C 
E --> D 
D --> F[REFUNDED] 
Best Practices 
Parameter Validation: Always validate that either txn_id or client_ref_id is provided, but not both 
Error Handling: Implement proper error handling for all possible response codes 
Token Management: Ensure your JWT token is valid and refresh if expired 
Polling Strategy: For real-time updates, consider implementing webhooks instead of frequent polling 
Data Decryption: Always decrypt response data to access actual transaction details 
Logging: Log API requests for debugging but never log decrypted sensitive data 
Status Interpretation: Handle all possible status values in your application logic 
API Docs 
Payout API 
Wallet Balance 
POST 
/payout/v1/balance 
Wallet Balance 
Query your Paywize wallet balance in real-time via API. 
Last updated: 2026-02-21 
Wallet Balance 
Overview 
Check your current wallet balance to ensure sufficient funds before initiating payouts. This endpoint 
provides real-time balance information. 
Quick Reference 
Attribute 
Method GET 
Details 
URL 
https://merchant.paywize.in/api/payout/v1/balance 
Authentication Bearer token required 
Content-Type application/json 
Response Format 
Rate Limit 
Direct JSON (not encrypted) 
500 requests/minute 
Endpoint 
Authentication Required: Bearer token 
Authentication 
This endpoint requires a valid JWT Bearer token. Learn how to generate tokens: Authentication 
Guide → 
Request Headers 
Content-Type: application/json 
Authorization: Bearer <jwt_token> 
Query Parameters 
Parameter 
wallet_id 
Required 
Yes 
Type Description 
String Merchant virtual account number 
Sample Request 
GET https://merchant.paywize.in/api/payout/v1/balance?wallet_id=PAYWIZE12345679 
Response 
Success Response (200 OK) 
{ 
"resp_code": 2000, 
"resp_message": "Wallet balance fetched successfully", 
"data": { 
"available_balance": "50000.00", 
"updated_at": "2025-11-05T12:30:15Z" 
  } 
} 
Note: This endpoint returns the balance data directly (not encrypted), showing the available balance. 
 
Response Fields 
Field Description 
available_balance Available wallet balance 
updated_at Last update timestamp for the balance (ISO 8601 format) 
Error Responses 
Success Response 
Code Message 
2000 Wallet balance fetched successfully 
Client Error Responses 
Code Message Description 
4022 Bad request, wallet_id is required Missing wallet_id query parameter 
Code Message Description 
4044 Wallet not found Provided wallet_id does not exist or is invalid 
Server Error Responses 
Code Message Description 
5000 Internal server error Unexpected server error occurred 
Implementation Examples 
JavaScript 
 
async function checkWalletBalance(token, walletId) { 
  const response = await 
fetch(`https://merchant.paywize.in/api/payout/v1/balance?wallet_id=${walletId}`, { 
    method: 'GET', 
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    } 
  }); 
 
  const result = await response.json(); 
 
  if (result.resp_code === 2000) { 
    return result.data; 
  } else { 
    throw new Error(`API Error ${result.resp_code}: ${result.resp_message}`); 
  } 
} 
 
// Usage 
try { 
  const walletBalance = await checkWalletBalance(jwtToken, 'PAYWIZE12345679'); 
  console.log('Wallet Balance:', walletBalance); 
  console.log('Available Balance: ₹', walletBalance.available_balance); 
 
  // Check if sufficient balance for a transaction 
  const transactionAmount = 1000.00; 
  if (parseFloat(walletBalance.available_balance) >= transactionAmount) { 
    console.log('✅ Sufficient balance for transaction'); 
  } else { 
    console.log('❌ Insufficient balance for transaction'); 
  } 
} catch (error) { 
  console.error('Balance check failed:', error.message); 
} 
Python 
 
import requests 
import json 
from encryption_utils import decrypt_merchant_data 
 
def check_wallet_balance(token, wallet_id): 
    response = requests.get( 
        f'https://merchant.paywize.in/api/payout/v1/balance?wallet_id={wallet_id}', 
        headers={ 
            'Content-Type': 'application/json', 
            'Authorization': f'Bearer {token}' 
        } 
    ) 
 
    result = response.json() 
 
    if result['resp_code'] == 2000: 
        return result['data'] 
    else: 
        raise Exception(f"API Error {result['resp_code']}: {result['resp_message']}") 
 
# Usage 
try: 
    wallet_balance = check_wallet_balance(jwt_token, 'PAYWIZE12345679') 
    print('Wallet Balance:', wallet_balance) 
    print(f"Available Balance: ₹{wallet_balance['available_balance']}") 
    print(f"Updated At: {wallet_balance['updated_at']}") 
 
    # Check if sufficient balance for a transaction 
    transaction_amount = 1000.00 
    if float(wallet_balance['available_balance']) >= transaction_amount: 
        print('✅ Sufficient balance for transaction') 
    else: 
        print('❌ Insufficient balance for transaction') 
except Exception as error: 
    print('Balance check failed:', str(error)) 
PHP 
 
<?php 
 
require_once 'PaywizeEncryption.php'; 
 
function checkWalletBalance($token, $walletId) { 
    $ch = curl_init(); 
    curl_setopt($ch, CURLOPT_URL, 
"https://merchant.paywize.in/api/payout/v1/balance?wallet_id=$walletId"); 
    curl_setopt($ch, CURLOPT_HTTPGET, 1); 
    curl_setopt($ch, CURLOPT_HTTPHEADER, [ 
        'Content-Type: application/json', 
        'Authorization: Bearer ' . $token 
    ]); 
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); 
 
    $response = curl_exec($ch); 
    curl_close($ch); 
 
    $result = json_decode($response, true); 
 
    if ($result['resp_code'] == 2000) { 
        return $result['data']; 
    } else { 
        throw new Exception("API Error {$result['resp_code']}: {$result['resp_message']}"); 
    } 
} 
 
// Usage 
try { 
    $walletBalance = checkWalletBalance($jwtToken, 'PAYWIZE12345679'); 
    echo "Wallet Balance: " . json_encode($walletBalance) . "\n"; 
    echo "Available Balance: ₹{$walletBalance['available_balance']}\n"; 
    echo "Updated At: {$walletBalance['updated_at']}\n"; 
 
    // Check if sufficient balance for a transaction 
    $transactionAmount = 1000.00; 
    if ((float)$walletBalance['available_balance'] >= $transactionAmount) { 
        echo "✅ Sufficient balance for transaction\n"; 
    } else { 
        echo "❌ Insufficient balance for transaction\n"; 
    } 
} catch (Exception $error) { 
    echo "Balance check failed: " . $error->getMessage() . "\n"; 
} 
 
?> 
cURL Example 
 
curl -X GET "https://merchant.paywize.in/api/payout/v1/balance?wallet_id=PAYWIZE12345679" \ 
  -H "Content-Type: application/json" \ 
  -H "Authorization: Bearer YOUR_JWT_TOKEN" 
Balance Types 
Available Balance 
Definition: Balance available for immediate transactions 
Use Case: Check this before initiating payouts 
Calculation: Total balance minus blocked balance 
Blocked Balance 
Definition: Balance reserved for pending transactions 
Use Case: Monitor pending transaction amounts 
Duration: Released when transactions complete or fail 
Total Balance 
Definition: Sum of available and blocked balance 
Use Case: Overall wallet balance monitoring 
Calculation: Available balance + blocked balance 
Balance Validation 
Pre-transaction Check 
 
async function validateSufficientBalance(token, transactionAmount, apiKey, secretKey) { 
  try { 
    const walletBalance = await checkWalletBalance(token, apiKey, secretKey); 
    const availableBalance = parseFloat(walletBalance.available_balance); 
 
    if (availableBalance >= transactionAmount) { 
      return { 
        sufficient: true, 
        available: availableBalance, 
        required: transactionAmount, 
        excess: availableBalance - transactionAmount 
      }; 
    } else { 
      return { 
        sufficient: false, 
        available: availableBalance, 
        required: transactionAmount, 
        shortfall: transactionAmount - availableBalance 
      }; 
    } 
  } catch (error) { 
    throw new Error(`Balance validation failed: ${error.message}`); 
  } 
} 
 
// Usage 
const validationResult = await validateSufficientBalance(jwtToken, 1000.00, apiKey, secretKey); 
 
if (validationResult.sufficient) { 
  console.log(`✅ Sufficient balance. Excess: ₹${validationResult.excess}`); 
  // Proceed with transaction 
} else { 
  console.log(`❌ Insufficient balance. Shortfall: ₹${validationResult.shortfall}`); 
  // Request balance top-up or reduce transaction amount 
} 
Balance Monitoring 
Real-time Balance Alerts 
 
class WalletMonitor { 
  constructor(token, apiKey, secretKey, minBalance = 1000) { 
    this.token = token; 
    this.apiKey = apiKey; 
    this.secretKey = secretKey; 
    this.minBalance = minBalance; 
  } 
 
  async monitorBalance() { 
    try { 
      const balance = await checkWalletBalance(this.token, this.apiKey, this.secretKey); 
      const availableBalance = parseFloat(balance.available_balance); 
 
      if (availableBalance < this.minBalance) { 
        this.sendLowBalanceAlert(availableBalance); 
} 
return balance; 
} catch (error) { 
console.error('Balance monitoring failed:', error.message); 
} 
} 
sendLowBalanceAlert(currentBalance) { 
console.log(` 
LOW BALANCE ALERT: Current balance ₹${currentBalance} is below minimum 
threshold ₹${this.minBalance}`); 
// Send email, SMS, or push notification 
} 
} 
// Usage 
const monitor = new WalletMonitor(jwtToken, apiKey, secretKey, 5000); 
const balance = await monitor.monitorBalance(); 
Best Practices 
Pre-transaction Validation: Always check balance before initiating payouts 
Regular Monitoring: Monitor balance regularly to avoid transaction failures 
Low Balance Alerts: Set up alerts when balance falls below threshold 
Error Handling: Implement proper error handling for balance check failures 
Token Management: Ensure your JWT token is valid and refresh if expired 
Balance History: Track balance changes over time for better financial management 
Security: Never log decrypted balance information 
Balance Top-up 
To add funds to your wallet: 
Bank Transfer: Transfer funds to your designated Paywize account 
Online Banking: Use net banking for instant credit 
NEFT/RTGS: Use traditional bank transfer methods 
Cheque Deposit: Physical cheque deposits (T+1 processing) 
Contact support for wallet top-up assistance: 
Support Email: finance@paywize.in 
Phone: +91-XXXX-XXXXXX 
API Docs 
Payout API 
Webhooks 
Payout Webhooks 
Configure webhooks for real-time payout status notifications. 
Last updated: 2026-02-21 
Webhook Notifications 
Overview 
Paywize sends payout status updates to your webhook URL whenever a transaction status changes. 
This provides real-time notifications without the need for constant polling of the status endpoint. 
Webhook Configuration 
Webhooks are sent to the callback_url provided during payout initiation via the Payout Initiate API. 
Each payout can have its own webhook URL by specifying a different callback_url in the request. 
Required Field in Payout Request: 
{ 
"callback_url": "https://your-website.com/webhook/payout" 
} 
Webhook Delivery: Paywize will send status updates to the specified callback_url whenever the 
transaction status changes. 
Request Headers (From Paywize) 
When Paywize sends webhooks to your endpoint, the following headers are included: 
Content-Type: application/json 
User-Agent: PayWize-Webhook/1.0 
X-Paywize-Signature: sha256=signature_hash 
Webhook Payload 
Encrypted Payload Example 
{ 
"data": 
"Vv9KKQofE6eVVpVtWbEMlRUUeMpXnQ3T3OwD3I4iStD0u85Ntbgv35S6vY8rNb3v7mFW6j2s6gnKA
44saJwYOyj4rM1BWXo6TWPsNRpyz40Og1w" 
} 
Decrypted Payload Example 
{ 
"transaction_id": "PAY123456789", 
"sender_id": "unique_transaction_id", 
"wallet_id": "virtual_account_number", 
"amount": "1000.00", 
"payment_mode": "IMPS", 
"remarks": "Payment", 
"status": "SUCCESS", 
"status_message": "Payment completed successfully", 
"utr_number": "415612345678", 
"beneficiary": { 
"beneficiary_name": "John Doe", 
"beneficiary_acc_number": "123456789012", 
"beneficiary_ifsc": "HDFC0001234" 
}, 
"timestamps": { 
"created_at": "2025-11-05T12:30:15Z", 
"updated_at": "2025-11-05T12:35:22Z" 
} 
} 
Webhook Payload Fields 
Field 
Type Description 
transaction_id String Paywize generated unique transaction ID 
sender_id 
wallet_id 
String Merchant provided unique sender ID 
String Merchant wallet ID 
amount String Transfer amount 
payment_mode String Payment mode used (IMPS, NEFT, RTGS) 
remarks 
String Transfer description 
status String Current transaction status (INITIATED, PROCESSING, SUCCESS, FAILED, REFUNDED) 
status_message String Descriptive message about the current status 
utr_number 
beneficiary 
String Unique Transaction Reference number from bank 
Object Beneficiary information object 
beneficiary.beneficiary_name String Beneficiary account holder name 
beneficiary.beneficiary_acc_number 
beneficiary.beneficiary_ifsc 
String Beneficiary account number 
String Beneficiary bank IFSC code 
timestamps 
Object Transaction timestamp information 
timestamps.created_at String Transaction creation timestamp (ISO 8601 format) 
timestamps.updated_at String Last update timestamp (ISO 8601 format) 
Transaction Status Values 
Status Description 
When Webhook is Sent 
PROCESSING Transaction is being processed When payout enters processing 
SUCCESS 
Transaction completed successfully 
FAILED Transaction failed 
REFUNDED 
When payout fails 
When payout is successful 
Transaction amount refunded When payout is refunded 
Implementation Requirements 
Response Requirements 
Your webhook endpoint MUST: 
Respond with HTTP 200 status code 
Respond within 30 seconds 
Accept POST requests with JSON payload 
Decrypt the payload using your API credentials 
Retry Logic 
If your webhook endpoint fails to respond properly: 
Retry Attempts: Up to 3 times 
Retry Interval: Exponential backoff (1s, 2s, 4s) 
Timeout: 30 seconds per attempt 
Implementation Examples 
JavaScript/Node.js 
import express from 'express'; 
import crypto from 'crypto'; 
const app = express(); 
app.use(express.json()); 
// Decryption function 
function decryptMerchantData(data, key, iv) { 
const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv); 
const decrypted = Buffer.concat([ 
    decipher.update(Buffer.from(data, 'base64')), 
    decipher.final() 
  ]); 
  return decrypted.toString('utf8'); 
} 
 
// Webhook endpoint 
app.post('/webhook/paywize/payout', (req, res) => { 
  try { 
    const { data } = req.body; 
 
    if (!data) { 
      return res.status(400).json({ error: 'Missing webhook data' }); 
    } 
 
    // Decrypt the webhook payload 
    const decryptedData = decryptMerchantData(data, API_KEY, SECRET_KEY); 
    const payoutUpdate = JSON.parse(decryptedData); 
 
    console.log('Payout update received:', payoutUpdate); 
 
    // Process the payout update 
    processPayoutUpdate(payoutUpdate); 
 
    // Respond with 200 OK 
    res.status(200).json({ 
      status: 'success', 
      message: 'Webhook processed successfully' 
    }); 
 
  } catch (error) { 
    console.error('Webhook processing error:', error); 
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to process webhook' 
    }); 
  } 
}); 
 
function processPayoutUpdate(payoutData) { 
  const { txn_id, status, client_ref_id, utr, beneficiary } = payoutData; 
 
  switch (status) { 
    case 'SUCCESS': 
      console.log(`Payout ${txn_id} completed successfully with UTR: ${utr}`); 
      // Update your database, send confirmation emails, etc. 
      updatePayoutStatus(client_ref_id, 'completed', payoutData); 
      sendSuccessNotification(beneficiary, payoutData); 
      break; 
 
    case 'FAILED': 
      console.log(`Payout ${txn_id} failed`); 
      // Handle failed payout, notify user, credit back amount, etc. 
      updatePayoutStatus(client_ref_id, 'failed', payoutData); 
      handleFailedPayout(client_ref_id, payoutData); 
      break; 
 
    case 'PENDING': 
      console.log(`Payout ${txn_id} is pending review`); 
      // Handle pending status, notify admin for review 
      updatePayoutStatus(client_ref_id, 'pending', payoutData); 
      notifyAdminForReview(payoutData); 
      break; 
 
    case 'PROCESSING': 
      console.log(`Payout ${txn_id} is being processed`); 
      // Update status to processing 
      updatePayoutStatus(client_ref_id, 'processing', payoutData); 
      break; 
 
    case 'INITIATED': 
      console.log(`Payout ${txn_id} has been initiated`); 
      // Payout initiated successfully 
      updatePayoutStatus(client_ref_id, 'initiated', payoutData); 
      break; 
 
    case 'REFUNDED': 
      console.log(`Payout ${txn_id} has been refunded`); 
      // Handle refund, credit amount back to wallet 
      updatePayoutStatus(client_ref_id, 'refunded', payoutData); 
      processRefund(client_ref_id, payoutData); 
      break; 
 
    default: 
      console.log(`Unknown status ${status} for payout ${txn_id}`); 
  } 
} 
 
function updatePayoutStatus(clientRefId, status, payoutData) { 
  // Your database update logic here 
  console.log(`Updating payout ${clientRefId} to status: ${status}`); 
} 
 
function sendSuccessNotification(beneficiary, payoutData) { 
// Send email/SMS notification to beneficiary 
console.log(`Sending success notification to ${beneficiary.name}`); 
} 
function handleFailedPayout(clientRefId, payoutData) { 
// Handle failed payout - credit back to wallet, notify user 
console.log(`Handling failed payout for ${clientRefId}`); 
} 
function notifyAdminForReview(payoutData) { 
// Notify admin for manual review 
console.log(`Notifying admin for review of payout ${payoutData.txn_id}`); 
} 
function processRefund(clientRefId, payoutData) { 
// Process refund - credit amount back to user account 
console.log(`Processing refund for ${clientRefId}`); 
} 
app.listen(3000, () => { 
console.log('Webhook server listening on port 3000'); 
}); 
Python (Flask) 
from flask import Flask, request, jsonify 
import json 
from encryption_utils import decrypt_merchant_data 
app = Flask(__name__) 
@app.route('/webhook/paywize/payout', methods=['POST']) 
def handle_webhook(): 
    try: 
        data = request.json.get('data') 
 
        if not data: 
            return jsonify({'error': 'Missing webhook data'}), 400 
 
        # Decrypt the webhook payload 
        decrypted_data = decrypt_merchant_data(data, API_KEY, SECRET_KEY) 
        payout_update = json.loads(decrypted_data) 
 
        print('Payout update received:', payout_update) 
 
        # Process the payout update 
        process_payout_update(payout_update) 
 
        # Respond with 200 OK 
        return jsonify({ 
            'status': 'success', 
            'message': 'Webhook processed successfully' 
        }), 200 
 
    except Exception as error: 
        print('Webhook processing error:', str(error)) 
        return jsonify({ 
            'status': 'error', 
            'message': 'Failed to process webhook' 
        }), 500 
 
def process_payout_update(payout_data): 
    txn_id = payout_data.get('txn_id') 
    status = payout_data.get('status') 
    client_ref_id = payout_data.get('client_ref_id') 
    utr = payout_data.get('utr') 
 
    if status == 'SUCCESS': 
        print(f'Payout {txn_id} completed successfully with UTR: {utr}') 
        update_payout_status(client_ref_id, 'completed', payout_data) 
        send_success_notification(payout_data) 
 
    elif status == 'FAILED': 
        print(f'Payout {txn_id} failed') 
        update_payout_status(client_ref_id, 'failed', payout_data) 
        handle_failed_payout(client_ref_id, payout_data) 
 
    elif status == 'PENDING': 
        print(f'Payout {txn_id} is pending review') 
        update_payout_status(client_ref_id, 'pending', payout_data) 
        notify_admin_for_review(payout_data) 
 
    elif status == 'PROCESSING': 
        print(f'Payout {txn_id} is being processed') 
        update_payout_status(client_ref_id, 'processing', payout_data) 
 
    elif status == 'INITIATED': 
        print(f'Payout {txn_id} has been initiated') 
        update_payout_status(client_ref_id, 'initiated', payout_data) 
 
    elif status == 'REFUNDED': 
        print(f'Payout {txn_id} has been refunded') 
        update_payout_status(client_ref_id, 'refunded', payout_data) 
        process_refund(client_ref_id, payout_data) 
 
    else: 
        print(f'Unknown status {status} for payout {txn_id}') 
 
def update_payout_status(client_ref_id, status, payout_data): 
    # Your database update logic here 
    print(f'Updating payout {client_ref_id} to status: {status}') 
 
def send_success_notification(payout_data): 
    # Send notification logic 
    print(f'Sending success notification for {payout_data["txn_id"]}') 
 
def handle_failed_payout(client_ref_id, payout_data): 
    # Handle failed payout logic 
    print(f'Handling failed payout for {client_ref_id}') 
 
def notify_admin_for_review(payout_data): 
    # Notify admin logic 
    print(f'Notifying admin for review of payout {payout_data["txn_id"]}') 
 
def process_refund(client_ref_id, payout_data): 
    # Process refund logic 
    print(f'Processing refund for {client_ref_id}') 
 
if __name__ == '__main__': 
    app.run(host='0.0.0.0', port=3000, debug=True) 
PHP 
 
<?php 
 
require_once 'PaywizeEncryption.php'; 
 
// Get the webhook payload 
$input = file_get_contents('php://input'); 
$webhookData = json_decode($input, true); 
 
// Set content type 
header('Content-Type: application/json'); 
 
try { 
    if (!isset($webhookData['data'])) { 
        http_response_code(400); 
        echo json_encode(['error' => 'Missing webhook data']); 
        exit; 
    } 
 
    // Decrypt the webhook payload 
    $decryptedData = PaywizeEncryption::decryptMerchantData( 
        $webhookData['data'], 
        $apiKey, 
        $secretKey 
    ); 
 
    $payoutUpdate = json_decode($decryptedData, true); 
 
    error_log('Payout update received: ' . print_r($payoutUpdate, true)); 
 
    // Process the payout update 
    processPayoutUpdate($payoutUpdate); 
 
    // Respond with 200 OK 
    http_response_code(200); 
    echo json_encode([ 
        'status' => 'success', 
        'message' => 'Webhook processed successfully' 
    ]); 
 
} catch (Exception $error) { 
    error_log('Webhook processing error: ' . $error->getMessage()); 
    http_response_code(500); 
    echo json_encode([ 
        'status' => 'error', 
        'message' => 'Failed to process webhook' 
    ]); 
} 
 
function processPayoutUpdate($payoutData) { 
    $txnId = $payoutData['txn_id']; 
    $status = $payoutData['status']; 
    $clientRefId = $payoutData['client_ref_id']; 
    $utr = $payoutData['utr'] ?? null; 
 
    switch ($status) { 
        case 'SUCCESS': 
            error_log("Payout $txnId completed successfully with UTR: $utr"); 
            updatePayoutStatus($clientRefId, 'completed', $payoutData); 
            sendSuccessNotification($payoutData); 
            break; 
 
        case 'FAILED': 
            error_log("Payout $txnId failed"); 
            updatePayoutStatus($clientRefId, 'failed', $payoutData); 
            handleFailedPayout($clientRefId, $payoutData); 
            break; 
 
        case 'PENDING': 
            error_log("Payout $txnId is pending review"); 
            updatePayoutStatus($clientRefId, 'pending', $payoutData); 
            notifyAdminForReview($payoutData); 
            break; 
 
        case 'PROCESSING': 
            error_log("Payout $txnId is being processed"); 
            updatePayoutStatus($clientRefId, 'processing', $payoutData); 
            break; 
 
        case 'INITIATED': 
            error_log("Payout $txnId has been initiated"); 
            updatePayoutStatus($clientRefId, 'initiated', $payoutData); 
            break; 
 
        case 'REFUNDED': 
            error_log("Payout $txnId has been refunded"); 
            updatePayoutStatus($clientRefId, 'refunded', $payoutData); 
            processRefund($clientRefId, $payoutData); 
            break; 
 
        default: 
            error_log("Unknown status $status for payout $txnId"); 
    } 
} 
 
function updatePayoutStatus($clientRefId, $status, $payoutData) { 
    // Your database update logic here 
    error_log("Updating payout $clientRefId to status: $status"); 
} 
 
function sendSuccessNotification($payoutData) { 
    // Send notification logic 
    error_log("Sending success notification for {$payoutData['txn_id']}"); 
} 
 
function handleFailedPayout($clientRefId, $payoutData) { 
    // Handle failed payout logic 
    error_log("Handling failed payout for $clientRefId"); 
} 
 
function notifyAdminForReview($payoutData) { 
    // Notify admin logic 
    error_log("Notifying admin for review of payout {$payoutData['txn_id']}"); 
} 
 
function processRefund($clientRefId, $payoutData) { 
    // Process refund logic 
    error_log("Processing refund for $clientRefId"); 
} 
 
?> 
Security Considerations 
Data Encryption 
All webhook payloads are encrypted using AES-256-CBC encryption: 
 
Use your API Key as the encryption key 
Use your Secret Key as the initialization vector 
Decrypt payload using the same credentials used for API requests 
Learn about Encryption → 
IP Whitelisting 
Ensure your webhook endpoint accepts requests only from Paywize IP addresses. Contact support 
for the current IP whitelist. 
HTTPS Only 
Always use HTTPS for webhook URLs to ensure data security in transit. 
Testing Webhooks 
Local Development 
For local testing, use tools like: 
ngrok: ngrok http 3000 to expose local webhook endpoint 
webhook.site: For quick webhook testing 
Postman: To simulate webhook payloads 
Test Webhook Payload 
{ 
} 
"data": "test_encrypted_payout_payload_here" 
Best Practices 
Idempotency: Handle duplicate webhooks gracefully using txn_id or client_ref_id 
Error Handling: Always respond with proper HTTP status codes 
Logging: Log webhook events for debugging but never log decrypted sensitive data 
Database Updates: Use transactions when updating multiple database records 
Async Processing: For heavy processing, respond quickly and process asynchronously 
Monitoring: Monitor webhook endpoint uptime and response times 
Status-specific Logic: Implement different logic for each status type 
Backup Processing: Implement fallback status checking if webhooks fail 
Troubleshooting 
Common Issues 
Issue Solution 
Webhook not received Check URL configuration and server accessibility 
500 Internal Server Error 
Timeout 
Check server logs and fix code errors 
Ensure response time is under 30 seconds 
Duplicate processing 
Decryption failure 
Debug Webhook 
Implement idempotency using txn_id 
Verify API Key and Secret Key are correct 
app.post('/webhook/paywize/payout', (req, res) => { 
console.log('Headers:', req.headers); 
console.log('Body:', req.body); 
// Your webhook processing logic 
res.status(200).json({ received: true }); 
}); 
API Docs 
Collection API 
Initiate Payment 
POST 
/collection/v1/initiate 
Initiate Payment 
Create payment collection requests via UPI or intent. 
Last updated: 2026-02-21 
Initiate Payment 
Overview 
Creates a new UPI payment intent for collecting payments from customers. This endpoint generates 
payment links and UPI intent URLs that can be shared with customers for payment collection. 
Quick Reference 
Attribute 
Method POST 
URL 
Details 
https://merchant.paywize.in/api/collection/v1/initiate/ 
Authentication Bearer token required 
Content-Type application/json 
Encryption 
Rate Limit 
Endpoint 
AES-256-CBC required 
100 requests/minute 
Authentication Required: Bearer token 
Authentication 
This endpoint requires a valid JWT Bearer token. Learn how to generate tokens: Authentication 
Guide → 
Request Headers 
Content-Type: application/json 
Authorization: Bearer <jwt_token> 
Request Body 
The request body must contain encrypted data using AES-256-CBC encryption: 
{ 
"payload": "0oA+t8GGuDZ0FrEbhM9bZ2pxTDZasdasdasasdjqwuhenqwj^7y=" 
} 
Learn about encryption: Encryption Guide → 
Required Fields (Before Encryption) 
Field 
Required 
senderId 
txnType Yes 
Yes 
Type Description 
String Unique ID for each merchant (Max 36 characters) 
String Always "INTENT" 
vpa 
Yes 
channel Yes 
String Merchant VPA 
String "FINO" or "NSDL" 
requestAmount Yes 
callbackUrl 
remarks 
Yes 
No 
String Payment amount (2 decimals) 
String Merchant URL to receive status updates 
String 0-20 alphanumeric characters, no special characters allowed 
Sample Request (Before Encryption) 
{ 
} 
"senderId": "TXN123456", 
"txnType": "INTENT", 
"vpa": "merchant@paywize", 
"channel": "FINO", 
"requestAmount": "100.50", 
"remarks": "Payment123", 
"callbackUrl": "https://webhook.site/c567b1af-f4fe-4729-9211-7e251d80b864" 
Response 
Success Response (200 OK) 
{ 
"respCode": 2000, 
"respMessage": "Payment link generated", 
"data": 
"0oA+t8GGuDZ0FrEbhM9bZ2pxTDZTaHRWRW1tQnN0dWUxVC92Yi9WQW9SSFdlTk56Ri9EYmVWTm
VGNTF1R3FVSnFRVWJUaFpqbTk4RTZrandTa25keGNJen" 
} 
Decrypted Response Data 
{ 
"senderId": "SENDERID000345", 
"txnId": "CFCE140825000009", 
"intentUrl": 
"upi://pay?pa=merchant.primepe@nsdl&orgid=181046&purpose=00&catagory=&sign=", 
"paymentUrl": 
"https://merchant.paywize.in/api/collection/v1/payment/payment/bede3921eb1df6b6e", 
"status": "INITIATED", 
"statusMessage": "Payment link has been generated", 
"createdAt": "2025-08-16T07:46:45.277Z", 
"updatedAt": "2025-08-16T07:46:45.277Z" 
} 
Response Fields 
Field 
Description 
txnId Unique transaction ID provided by Paywize 
intentUrl 
paymentUrl 
UPI intent URL for direct payment 
Web payment page URL 
status Current transaction status 
statusMessage Detailed status description 
createdAt 
updatedAt 
Transaction creation timestamp 
Last update timestamp 
Error Responses 
Success Response 
Code Message 
2000 Payment link generated 
Client Error Responses 
Code Message 
Description 
4001 Invalid request format Request data format is incorrect 
4003 Invalid senderId SenderId format is incorrect 
4004 Missing or invalid amount format 
4005 Missing or invalid txnType 
Amount is missing or invalid 
txnType is missing or invalid 
4006 Missing or invalid Callback URL Callback URL is missing or invalid 
4007 VPA not Registered 
The provided VPA is not registered 
4010 Transaction amount above maximum limit 
4011 Transaction amount below minimum limit 
4012 SenderId already exists Duplicate senderId 
4013 Daily limit Reached 
Amount exceeds maximum allowed 
Amount is below minimum required 
Daily transaction limit exceeded 
4014 Decryption failed. Please check the encryption Encryption/decryption error 
4015 Commercials are not yet configured and activated or channel/vpa do not match
Configuration issue 
4016 No active settlement account found 
Code Message 
Description 
Settlement account not configured 
4008 Unauthorized – invalid or expired token JWT token is invalid, expired, or missing 
Server Error Responses 
Code Message 
Description 
5000 Internal Server Error Unexpected server error occurred 
Implementation Examples 
JavaScript 
import crypto from 'crypto'; 
// Encryption function 
function encryptMerchantData(data, key, iv) { 
if (typeof data === 'object') { 
data = JSON.stringify(data); 
} 
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv); 
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]); 
  return encrypted.toString('base64'); 
} 
 
// Decryption function 
function decryptMerchantData(data, key, iv) { 
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv); 
  const decrypted = Buffer.concat([ 
    decipher.update(Buffer.from(data, 'base64')), 
    decipher.final() 
  ]); 
  return decrypted.toString('utf8'); 
} 
 
async function initiatePayment(token, apiKey, secretKey) { 
  const paymentData = { 
    senderId: "TXN123456", 
    txnType: "INTENT", 
    vpa: "merchant@paywize", 
    channel: "FINO", 
    requestAmount: "100.50", 
    remarks: "Payment123", 
    callbackUrl: "https://your-webhook-url.com/callback" 
  }; 
 
  // Encrypt the payment data 
  const encryptedPayload = encryptMerchantData(paymentData, apiKey, secretKey); 
 
  const response = await fetch('https://merchant.paywize.in/api/collection/v1/initiate/', { 
    method: 'POST', 
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    }, 
    body: JSON.stringify({ 
      payload: encryptedPayload 
    }) 
  }); 
 
  const result = await response.json(); 
 
  if (result.respCode === 2000) { 
    // Decrypt the response data 
    const decryptedData = decryptMerchantData(result.data, apiKey, secretKey); 
    return JSON.parse(decryptedData); 
  } else { 
    throw new Error(`API Error ${result.respCode}: ${result.respMessage}`); 
  } 
} 
 
// Usage 
try { 
  const paymentResult = await initiatePayment(jwtToken, apiKey, secretKey); 
  console.log('Payment initiated:', paymentResult); 
  console.log('Payment URL:', paymentResult.paymentUrl); 
  console.log('UPI Intent:', paymentResult.intentUrl); 
} catch (error) { 
  console.error('Payment initiation failed:', error.message); 
} 
Python 
 
import requests 
import json 
from encryption_utils import encrypt_merchant_data, decrypt_merchant_data 
 
def initiate_payment(token, api_key, secret_key): 
    payment_data = { 
        "senderId": "TXN123456", 
        "txnType": "INTENT", 
        "vpa": "merchant@paywize", 
        "channel": "FINO", 
        "requestAmount": "100.50", 
        "remarks": "Payment123", 
        "callbackUrl": "https://your-webhook-url.com/callback" 
    } 
 
    # Encrypt the payment data 
    encrypted_payload = encrypt_merchant_data( 
        json.dumps(payment_data), 
        api_key, 
        secret_key 
    ) 
 
    response = requests.post( 
        'https://merchant.paywize.in/api/collection/v1/initiate/', 
        headers={ 
            'Content-Type': 'application/json', 
            'Authorization': f'Bearer {token}' 
        }, 
        json={'payload': encrypted_payload} 
    ) 
 
    result = response.json() 
 
    if result['respCode'] == 2000: 
        # Decrypt the response data 
        decrypted_data = decrypt_merchant_data(result['data'], api_key, secret_key) 
        return json.loads(decrypted_data) 
    else: 
        raise Exception(f"API Error {result['respCode']}: {result['respMessage']}") 
 
# Usage 
try: 
    payment_result = initiate_payment(jwt_token, api_key, secret_key) 
    print('Payment initiated:', payment_result) 
    print('Payment URL:', payment_result['paymentUrl']) 
    print('UPI Intent:', payment_result['intentUrl']) 
except Exception as error: 
    print('Payment initiation failed:', str(error)) 
PHP 
 
<?php 
 
require_once 'PaywizeEncryption.php'; 
 
function initiatePayment($token, $apiKey, $secretKey) { 
    $paymentData = [ 
        'senderId' => 'TXN123456', 
        'txnType' => 'INTENT', 
        'vpa' => 'merchant@paywize', 
        'channel' => 'FINO', 
        'requestAmount' => '100.50', 
        'remarks' => 'Payment123', 
        'callbackUrl' => 'https://your-webhook-url.com/callback' 
    ]; 
 
    // Encrypt the payment data 
    $encryptedPayload = PaywizeEncryption::encryptMerchantData($paymentData, $apiKey, 
$secretKey); 
 
    $ch = curl_init(); 
    curl_setopt($ch, CURLOPT_URL, 'https://merchant.paywize.in/api/collection/v1/initiate/'); 
    curl_setopt($ch, CURLOPT_POST, 1); 
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['payload' => $encryptedPayload])); 
    curl_setopt($ch, CURLOPT_HTTPHEADER, [ 
        'Content-Type: application/json', 
        'Authorization: Bearer ' . $token 
    ]); 
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); 
 
    $response = curl_exec($ch); 
    curl_close($ch); 
 
    $result = json_decode($response, true); 
 
    if ($result['respCode'] == 2000) { 
        // Decrypt the response data 
        $decryptedData = PaywizeEncryption::decryptMerchantData($result['data'], $apiKey, 
$secretKey); 
        return json_decode($decryptedData, true); 
    } else { 
        throw new Exception("API Error {$result['respCode']}: {$result['respMessage']}"); 
    } 
} 
 
// Usage 
try { 
$paymentResult = initiatePayment($jwtToken, $apiKey, $secretKey); 
echo "Payment initiated: " . json_encode($paymentResult) . "\n"; 
echo "Payment URL: " . $paymentResult['paymentUrl'] . "\n"; 
echo "UPI Intent: " . $paymentResult['intentUrl'] . "\n"; 
} catch (Exception $error) { 
echo "Payment initiation failed: " . $error->getMessage() . "\n"; 
} 
?> 
Best Practices 
Unique SenderId: Always use unique senderIds to avoid duplicates 
Amount Format: Use string format with 2 decimal places (e.g., "100.50") 
Callback URL: Ensure your webhook endpoint is accessible and responds within 30 seconds 
Error Handling: Always implement proper error handling for API responses 
Token Management: Cache tokens and refresh before expiry 
Logging: Log transaction details for debugging but never log sensitive data 
API Docs 
Collection API 
Payment Status 
POST 
/collection/v1/status 
Payment Status 
Check real-time payment collection status via Paywize API. 
Last updated: 2026-02-21 
Status Check 
Overview 
Check the current status of a payment transaction using either the transaction ID (txnId) or sender ID 
(senderId). This endpoint provides real-time transaction status and payment details. 
Quick Reference 
Attribute 
Method GET 
URL 
Details 
https://merchant.paywize.in/api/collection/v1/status 
Authentication Bearer token required 
Content-Type application/json 
Encryption 
Rate Limit 
Endpoint 
Response data is AES-256-CBC encrypted 
200 requests/minute 
Authentication Required: Bearer token 
Authentication 
This endpoint requires a valid JWT Bearer token. Learn how to generate tokens: Authentication 
Guide → 
Request Headers 
Content-Type: application/json 
Authorization: Bearer <jwt_token> 
Query Parameters 
You must provide either txnId or senderId (not both): 
Parameter 
Required 
txnId Optional 
Type Description 
String Unique transaction ID provided by Paywize 
senderId 
Optional 
String Unique sender ID provided by merchant 
Note: You must provide either txnId OR senderId, but not both. 
Sample Requests 
Using Transaction ID 
GET https://merchant.paywize.in/api/collection/v1/status?txnId=CFCE140825000009 
Using Sender ID 
GET https://merchant.paywize.in/api/collection/v1/status?senderId=SENDERID000345 
Response 
Success Response (200 OK) 
{ 
"respCode": 2000, 
"respMessage": "Transaction status fetched successfully", 
"data": 
"0oA+t8GGuDZ0FrEbhM9bZ2pxTDZTaHRWRW1tQnN0dWUxVC92Yi9WQW9SSFdlTk56Ri9EYmVWTm
VGNTF1R3FVSnFRVWJUaFpqbTk4RTZrandTa25ke" 
} 
Decrypted Response Data 
{ 
"senderId": "SENDERID00001", 
"txnId": "CFCE160825000001", 
"requestAmount": "100.00", 
"paymentMode": "Intent", 
"utr": "405812345678", 
"remarks": "test", 
"status": "SUCCESS", 
"statusMessage": "Payment completed successfully", 
"createdAt": "2025-08-16T07:46:45.277Z", 
"updatedAt": "2025-08-16T08:18:15.378Z" 
} 
Response Fields 
Field 
Description 
senderId 
Merchant provided unique sender ID 
txnId Paywize generated unique transaction ID 
requestAmount Payment amount requested 
paymentMode Payment method used (Intent, etc.) 
utr 
Unique Transaction Reference from bank 
remarks 
Payment remarks/description 
status Current transaction status 
statusMessage Detailed status description 
createdAt 
updatedAt 
Transaction creation timestamp 
Last update timestamp 
Transaction Status Values 
Status Description 
INITIATED 
SUCCESS 
Payment request created, awaiting customer action 
Payment completed successfully 
FAILED Payment failed 
PENDING 
Payment under review 
Error Responses 
Code Message 
Description 
2000 Transaction status fetched successfully Success 
4000 Either Transaction ID (txnId) or Sender ID (senderId) is required Missing required parameter 
4008 Unauthorized – invalid or expired token Token is invalid or expired 
4104 Transaction not found Transaction does not exist 
4103 Provide either senderId or txnId. Not both. 
Both parameters provided 
4105 Missing or invalid txnId format Invalid txnId format 
4107 Unauthorized: Transaction does not belong to this merchant 
5000 Internal server error 
Implementation Examples 
JavaScript 
Server error 
Access denied 
import crypto from 'crypto'; 
 
// Decryption function 
function decryptMerchantData(data, key, iv) { 
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv); 
  const decrypted = Buffer.concat([ 
    decipher.update(Buffer.from(data, 'base64')), 
    decipher.final() 
  ]); 
  return decrypted.toString('utf8'); 
} 
 
async function checkPaymentStatus(token, txnId = null, senderId = null, apiKey, secretKey) { 
  // Validate parameters 
  if (!txnId && !senderId) { 
    throw new Error('Either txnId or senderId is required'); 
  } 
  if (txnId && senderId) { 
    throw new Error('Provide either txnId or senderId, not both'); 
  } 
 
  // Build query parameter 
  const queryParam = txnId ? `txnId=${txnId}` : `senderId=${senderId}`; 
  const url = `https://merchant.paywize.in/api/collection/v1/status?${queryParam}`; 
 
  const response = await fetch(url, { 
    method: 'GET', 
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    } 
  }); 
 
  const result = await response.json(); 
 
  if (result.respCode === 2000) { 
    // Decrypt the response data 
    const decryptedData = decryptMerchantData(result.data, apiKey, secretKey); 
    return JSON.parse(decryptedData); 
  } else { 
    throw new Error(`API Error ${result.respCode}: ${result.respMessage}`); 
  } 
} 
 
// Usage examples 
try { 
  // Check by transaction ID 
  const statusByTxnId = await checkPaymentStatus(jwtToken, 'CFCE140825000009', null, apiKey, 
secretKey); 
  console.log('Status by txnId:', statusByTxnId); 
 
  // Check by sender ID 
  const statusBySenderId = await checkPaymentStatus(jwtToken, null, 'SENDERID000345', apiKey, 
secretKey); 
  console.log('Status by senderId:', statusBySenderId); 
 
} catch (error) { 
  console.error('Status check failed:', error.message); 
} 
Python 
 
import requests 
import json 
from encryption_utils import decrypt_merchant_data 
 
def check_payment_status(token, api_key, secret_key, txn_id=None, sender_id=None): 
    # Validate parameters 
    if not txn_id and not sender_id: 
        raise ValueError('Either txn_id or sender_id is required') 
    if txn_id and sender_id: 
        raise ValueError('Provide either txn_id or sender_id, not both') 
 
    # Build query parameter 
    query_param = f'txnId={txn_id}' if txn_id else f'senderId={sender_id}' 
    url = f'https://merchant.paywize.in/api/collection/v1/status?{query_param}' 
 
    response = requests.get( 
        url, 
        headers={ 
            'Content-Type': 'application/json', 
            'Authorization': f'Bearer {token}' 
        } 
    ) 
 
    result = response.json() 
 
    if result['respCode'] == 2000: 
        # Decrypt the response data 
        decrypted_data = decrypt_merchant_data(result['data'], api_key, secret_key) 
        return json.loads(decrypted_data) 
    else: 
        raise Exception(f"API Error {result['respCode']}: {result['respMessage']}") 
 
# Usage examples 
try: 
    # Check by transaction ID 
    status_by_txn_id = check_payment_status(jwt_token, api_key, secret_key, 
txn_id='CFCE140825000009') 
    print('Status by txnId:', status_by_txn_id) 
 
    # Check by sender ID 
    status_by_sender_id = check_payment_status(jwt_token, api_key, secret_key, 
sender_id='SENDERID000345') 
    print('Status by senderId:', status_by_sender_id) 
 
except Exception as error: 
    print('Status check failed:', str(error)) 
PHP 
 
<?php 
 
require_once 'PaywizeEncryption.php'; 
 
function checkPaymentStatus($token, $apiKey, $secretKey, $txnId = null, $senderId = null) { 
    // Validate parameters 
    if (!$txnId && !$senderId) { 
        throw new InvalidArgumentException('Either txnId or senderId is required'); 
    } 
    if ($txnId && $senderId) { 
        throw new InvalidArgumentException('Provide either txnId or senderId, not both'); 
    } 
 
    // Build query parameter 
    $queryParam = $txnId ? "txnId=$txnId" : "senderId=$senderId"; 
    $url = "https://merchant.paywize.in/api/collection/v1/status?$queryParam"; 
 
    $ch = curl_init(); 
    curl_setopt($ch, CURLOPT_URL, $url); 
    curl_setopt($ch, CURLOPT_HTTPGET, 1); 
    curl_setopt($ch, CURLOPT_HTTPHEADER, [ 
        'Content-Type: application/json', 
        'Authorization: Bearer ' . $token 
    ]); 
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); 
 
    $response = curl_exec($ch); 
    curl_close($ch); 
 
    $result = json_decode($response, true); 
 
    if ($result['respCode'] == 2000) { 
        // Decrypt the response data 
        $decryptedData = PaywizeEncryption::decryptMerchantData($result['data'], $apiKey, 
$secretKey); 
        return json_decode($decryptedData, true); 
    } else { 
        throw new Exception("API Error {$result['respCode']}: {$result['respMessage']}"); 
    } 
} 
 
// Usage examples 
try { 
    // Check by transaction ID 
    $statusByTxnId = checkPaymentStatus($jwtToken, $apiKey, $secretKey, 'CFCE140825000009'); 
    echo "Status by txnId: " . json_encode($statusByTxnId) . "\n"; 
 
    // Check by sender ID 
$statusBySenderId = checkPaymentStatus($jwtToken, $apiKey, $secretKey, null, 
'SENDERID000345'); 
echo "Status by senderId: " . json_encode($statusBySenderId) . "\n"; 
} catch (Exception $error) { 
echo "Status check failed: " . $error->getMessage() . "\n"; 
} 
?> 
cURL Example 
# Check status by transaction ID 
curl -X GET "https://merchant.paywize.in/api/collection/v1/status?txnId=CFCE140825000009" \ -H "Content-Type: application/json" \ -H "Authorization: Bearer YOUR_JWT_TOKEN" 
# Check status by sender ID 
curl -X GET "https://merchant.paywize.in/api/collection/v1/status?senderId=SENDERID000345" \ -H "Content-Type: application/json" \ -H "Authorization: Bearer YOUR_JWT_TOKEN" 
Best Practices 
Parameter Validation: Always validate that either txnId or senderId is provided, but not both 
Error Handling: Implement proper error handling for all possible response codes 
Token Management: Ensure your JWT token is valid and refresh if expired 
Polling Strategy: For real-time updates, consider implementing webhooks instead of frequent polling 
Data Decryption: Always decrypt response data to access actual transaction details 
Logging: Log API requests for debugging but never log decrypted sensitive data 
API Docs 
Collection API 
Webhooks 
Collection Webhooks 
Configure webhooks for real-time collection notifications. 
Last updated: 2026-02-21 
Webhook Notifications 
Overview 
Paywize sends payment status updates to your webhook URL whenever a payment status changes. 
This provides real-time notifications without the need for constant polling of the status endpoint. 
Webhook Endpoint 
POST https://merchant.paywize.in/api/collection/v1/webhook 
Description: Paywize sends payment status updates to the callbackUrl specified during payment 
initiation when payment status changes. 
Webhook Configuration 
Webhooks are automatically sent to the callbackUrl you provide when initiating a payment via the 
/collection/v1/initiate/ API. No separate configuration is needed. 
How It Works 
When you call /collection/v1/initiate/, include a callbackUrl in your request 
Paywize stores this URL for the specific payment transaction 
When the payment status changes, Paywize sends a webhook to your callbackUrl 
Your endpoint receives the encrypted webhook payload 
Example: 
// When initiating payment, specify your webhook URL 
const paymentData = { 
senderId: "TXN123456", 
txnType: "INTENT", 
requestAmount: "100.50", 
callbackUrl: "https://your-website.com/webhook/collection" // ← This URL receives webhooks 
}; 
Requirements 
Ensure your callbackUrl is: 
Accessible: From the internet (not localhost for production) 
Method: Configured to accept POST requests 
Response Time: Responds within 30 seconds with HTTP 200 
HTTPS: Uses secure HTTPS protocol (recommended) 
Request Headers (From Paywize) 
When Paywize sends webhooks to your endpoint, the following headers are included: 
Content-Type: application/json 
User-Agent: PayWize-Webhook/1.0 
Webhook Payload 
Encrypted Payload Example 
{ 
"data": 
"Vv9KKQofE6eVVpVtWbEMlRUUeMpXnQ3T3OwD3I4iStD0u85Ntbgv35S6vY8rNb3v7mFW6j2s6gnKA
44saJwYOyj4rM1BWXo6TWPsNRpyz40Og1w" 
} 
Decrypted Payload Example 
{ 
"senderId": "SENDERID00001", 
"txnId": "CFCE160825000001", 
"requestAmount": "100.00", 
"paymentMode": "Intent", 
"utr": "405812345678", 
"remarks": "test", 
"status": "SUCCESS", 
"statusMessage": "Payment completed successfully", 
"createdAt": "2025-08-16T07:46:45.277Z", 
"updatedAt": "2025-08-16T08:18:15.378Z" 
} 
Webhook Payload Fields 
Field 
Description 
senderId 
Merchant provided unique sender ID 
txnId Paywize generated unique transaction ID 
requestAmount Payment amount requested 
paymentMode Payment method used (Intent, etc.) 
utr 
Unique Transaction Reference from bank (available for successful payments) 
remarks 
Payment remarks/description 
status Current transaction status 
statusMessage Detailed status description 
createdAt 
updatedAt 
Transaction creation timestamp 
Last update timestamp 
Transaction Status Values 
Status Description 
INITIATED 
When Webhook is Sent 
Payment request created, awaiting customer action 
generated 
SUCCESS 
Payment completed successfully 
FAILED Payment failed When payment fails 
PENDING 
Payment under review When payment is under review 
Implementation Requirements 
Response Requirements 
When payment link is 
When payment is successful 
Your webhook endpoint MUST: 
Respond with HTTP 200 status code 
Respond within 30 seconds 
Accept POST requests with JSON payload 
Decrypt the payload using your API credentials 
Retry Logic 
If your webhook endpoint fails to respond properly: 
Retry Attempts: Up to 3 times 
Retry Interval: Exponential backoff (1s, 2s, 4s) 
Timeout: 30 seconds per attempt 
Implementation Examples 
JavaScript/Node.js 
import express from 'express'; 
import crypto from 'crypto'; 
const app = express(); 
app.use(express.json()); 
// Decryption function 
function decryptMerchantData(data, key, iv) { 
const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv); 
const decrypted = Buffer.concat([ 
decipher.update(Buffer.from(data, 'base64')), 
decipher.final() 
]); 
return decrypted.toString('utf8'); 
} 
// Webhook endpoint 
app.post('/webhook/paywize/collection', (req, res) => { 
  try { 
    const { data } = req.body; 
 
    if (!data) { 
      return res.status(400).json({ error: 'Missing webhook data' }); 
    } 
 
    // Decrypt the webhook payload 
    const decryptedData = decryptMerchantData(data, API_KEY, SECRET_KEY); 
    const paymentUpdate = JSON.parse(decryptedData); 
 
    console.log('Payment update received:', paymentUpdate); 
 
    // Process the payment update 
    processPaymentUpdate(paymentUpdate); 
 
    // Respond with 200 OK 
    res.status(200).json({ 
      status: 'success', 
      message: 'Webhook processed successfully' 
    }); 
 
  } catch (error) { 
    console.error('Webhook processing error:', error); 
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to process webhook' 
    }); 
  } 
}); 
 
function processPaymentUpdate(paymentData) { 
  const { txnId, status, senderId, utr } = paymentData; 
 
  switch (status) { 
    case 'SUCCESS': 
      console.log(`Payment ${txnId} completed successfully with UTR: ${utr}`); 
      // Update your database, send confirmation emails, etc. 
      updatePaymentStatus(senderId, 'completed', paymentData); 
      break; 
 
    case 'FAILED': 
      console.log(`Payment ${txnId} failed`); 
      // Handle failed payment, notify user, etc. 
      updatePaymentStatus(senderId, 'failed', paymentData); 
      break; 
 
    case 'PENDING': 
      console.log(`Payment ${txnId} is pending review`); 
      // Handle pending status 
      updatePaymentStatus(senderId, 'pending', paymentData); 
      break; 
 
    case 'INITIATED': 
      console.log(`Payment ${txnId} has been initiated`); 
      // Payment link generated, ready for customer 
      updatePaymentStatus(senderId, 'initiated', paymentData); 
      break; 
 
    default: 
      console.log(`Unknown status ${status} for payment ${txnId}`); 
  } 
} 
 
function updatePaymentStatus(senderId, status, paymentData) { 
  // Your database update logic here 
  console.log(`Updating payment ${senderId} to status: ${status}`); 
} 
 
app.listen(3000, () => { 
  console.log('Webhook server listening on port 3000'); 
}); 
Python (Flask) 
 
from flask import Flask, request, jsonify 
import json 
from encryption_utils import decrypt_merchant_data 
 
app = Flask(__name__) 
 
@app.route('/webhook/paywize/collection', methods=['POST']) 
def handle_webhook(): 
    try: 
        data = request.json.get('data') 
 
        if not data: 
            return jsonify({'error': 'Missing webhook data'}), 400 
 
        # Decrypt the webhook payload 
        decrypted_data = decrypt_merchant_data(data, API_KEY, SECRET_KEY) 
        payment_update = json.loads(decrypted_data) 
 
        print('Payment update received:', payment_update) 
 
        # Process the payment update 
        process_payment_update(payment_update) 
 
        # Respond with 200 OK 
        return jsonify({ 
            'status': 'success', 
            'message': 'Webhook processed successfully' 
        }), 200 
 
    except Exception as error: 
        print('Webhook processing error:', str(error)) 
        return jsonify({ 
            'status': 'error', 
            'message': 'Failed to process webhook' 
        }), 500 
 
def process_payment_update(payment_data): 
    txn_id = payment_data.get('txnId') 
    status = payment_data.get('status') 
    sender_id = payment_data.get('senderId') 
    utr = payment_data.get('utr') 
 
    if status == 'SUCCESS': 
        print(f'Payment {txn_id} completed successfully with UTR: {utr}') 
        # Update your database, send confirmation emails, etc. 
        update_payment_status(sender_id, 'completed', payment_data) 
 
    elif status == 'FAILED': 
        print(f'Payment {txn_id} failed') 
        # Handle failed payment, notify user, etc. 
        update_payment_status(sender_id, 'failed', payment_data) 
 
    elif status == 'PENDING': 
        print(f'Payment {txn_id} is pending review') 
        # Handle pending status 
        update_payment_status(sender_id, 'pending', payment_data) 
 
    elif status == 'INITIATED': 
        print(f'Payment {txn_id} has been initiated') 
        # Payment link generated, ready for customer 
        update_payment_status(sender_id, 'initiated', payment_data) 
 
    else: 
        print(f'Unknown status {status} for payment {txn_id}') 
 
def update_payment_status(sender_id, status, payment_data): 
    # Your database update logic here 
    print(f'Updating payment {sender_id} to status: {status}') 
 
if __name__ == '__main__': 
    app.run(host='0.0.0.0', port=3000, debug=True) 
PHP 
 
<?php 
 
require_once 'PaywizeEncryption.php'; 
 
// Get the webhook payload 
$input = file_get_contents('php://input'); 
$webhookData = json_decode($input, true); 
 
// Set content type 
header('Content-Type: application/json'); 
 
try { 
    if (!isset($webhookData['data'])) { 
        http_response_code(400); 
        echo json_encode(['error' => 'Missing webhook data']); 
        exit; 
    } 
 
    // Decrypt the webhook payload 
    $decryptedData = PaywizeEncryption::decryptMerchantData( 
        $webhookData['data'], 
        $apiKey, 
        $secretKey 
    ); 
 
    $paymentUpdate = json_decode($decryptedData, true); 
 
    error_log('Payment update received: ' . print_r($paymentUpdate, true)); 
 
    // Process the payment update 
    processPaymentUpdate($paymentUpdate); 
 
    // Respond with 200 OK 
    http_response_code(200); 
    echo json_encode([ 
        'status' => 'success', 
        'message' => 'Webhook processed successfully' 
    ]); 
 
} catch (Exception $error) { 
    error_log('Webhook processing error: ' . $error->getMessage()); 
    http_response_code(500); 
    echo json_encode([ 
        'status' => 'error', 
        'message' => 'Failed to process webhook' 
    ]); 
} 
 
function processPaymentUpdate($paymentData) { 
    $txnId = $paymentData['txnId']; 
    $status = $paymentData['status']; 
    $senderId = $paymentData['senderId']; 
    $utr = $paymentData['utr'] ?? null; 
 
    switch ($status) { 
        case 'SUCCESS': 
            error_log("Payment $txnId completed successfully with UTR: $utr"); 
            // Update your database, send confirmation emails, etc. 
            updatePaymentStatus($senderId, 'completed', $paymentData); 
            break; 
 
        case 'FAILED': 
            error_log("Payment $txnId failed"); 
            // Handle failed payment, notify user, etc. 
            updatePaymentStatus($senderId, 'failed', $paymentData); 
            break; 
 
        case 'PENDING': 
            error_log("Payment $txnId is pending review"); 
            // Handle pending status 
            updatePaymentStatus($senderId, 'pending', $paymentData); 
            break; 
 
        case 'INITIATED': 
            error_log("Payment $txnId has been initiated"); 
            // Payment link generated, ready for customer 
            updatePaymentStatus($senderId, 'initiated', $paymentData); 
            break; 
 
        default: 
            error_log("Unknown status $status for payment $txnId"); 
    } 
} 
 
function updatePaymentStatus($senderId, $status, $paymentData) { 
    // Your database update logic here 
    error_log("Updating payment $senderId to status: $status"); 
} 
 
?> 
Security Considerations 
Data Encryption 
All webhook payloads are encrypted using AES-256-CBC encryption: 
 
Use your API Key as the encryption key 
Use your Secret Key as the initialization vector 
Decrypt payload using the same credentials used for API requests 
Learn about Encryption → 
 
IP Whitelisting 
Ensure your webhook endpoint accepts requests only from Paywize IP addresses. Contact support 
for the current IP whitelist. 
HTTPS Only 
Always use HTTPS for webhook URLs to ensure data security in transit. 
Testing Webhooks 
Local Development 
For local testing, use tools like: 
ngrok: ngrok http 3000 to expose local webhook endpoint 
webhook.site: For quick webhook testing 
Postman: To simulate webhook payloads 
Test Webhook Payload 
{ 
} 
"data": "test_encrypted_payload_here" 
Webhook Verification 
Verify Webhook Authenticity 
function verifyWebhook(webhookData, apiKey, secretKey) { 
try { 
// Attempt to decrypt the payload 
const decryptedData = decryptMerchantData(webhookData.data, apiKey, secretKey); 
const paymentData = JSON.parse(decryptedData); 
// Verify required fields exist 
const requiredFields = ['txnId', 'senderId', 'status', 'statusMessage']; 
const isValid = requiredFields.every(field => paymentData.hasOwnProperty(field)); 
return isValid; 
} catch (error) { 
console.error('Webhook verification failed:', error); 
return false; 
} 
} 
Best Practices 
Idempotency: Handle duplicate webhooks gracefully using txnId or senderId 
Error Handling: Always respond with proper HTTP status codes 
Logging: Log webhook events for debugging but never log decrypted sensitive data 
Database Updates: Use transactions when updating multiple database records 
Async Processing: For heavy processing, respond quickly and process asynchronously 
Monitoring: Monitor webhook endpoint uptime and response times 
Backup Processing: Implement fallback status checking if webhooks fail 
Troubleshooting 
Common Issues 
Issue Solution 
Webhook not received Check URL configuration and server accessibility 
500 Internal Server Error 
Timeout 
Check server logs and fix code errors 
Ensure response time is under 30 seconds 
Duplicate processing 
Decryption failure 
Debug Webhook 
Implement idempotency using txnId 
Verify API Key and Secret Key are correct 
app.post('/webhook/paywize/collection', (req, res) => { 
console.log('Headers:', req.headers); 
console.log('Body:', req.body); 
// Your webhook processing logic 
res.status(200).json({ received: true }); 
}); 
API Docs 
Shared Resources 
Authentication 
Authentication 
Learn how to authenticate with Paywize APIs using JWT tokens. 
Last updated: 2026-02-21 
Authentication 
Overview 
All Paywize APIs use a unified authentication system that combines AES-256-CBC encryption with 
JWT Bearer tokens. This guide covers the authentication process used across all Paywize products 
including Collection API and Payout API. 
Quick Reference 
Attribute 
Token Type 
Details 
JWT Bearer Token 
Token Expiry 5 minutes 
Encryption 
Endpoint 
Rate Limit 
AES-256-CBC required 
POST merchant.paywize.in/api/v1/auth/clients/token 
100 requests/minute 
SecurityHTTPS only, IP whitelisting 
Security Measures 
Authentication: All requests require a Bearer token in the Authorization header 
Encryption: Request/response data encrypted using AES-256-CBC 
IP Whitelisting: Only approved merchant IPs can access APIs and receive callbacks 
TLS Enforcement: All endpoints are accessible only over HTTPS 
Rate Limiting: Transactions are controlled by both TPS and daily limits 
Input Validation: Every request payload is strictly validated before processing 
Token Generation 
Generate Access Token 
Description: This API endpoint generates a temporary JWT access token to authenticate all 
subsequent API requests. The request body must be AES-256-CBC encrypted and Base64 encoded. 
Tokens expire after 5 minutes and must be regenerated regularly. 
Request Headers 
Content-Type: application/json 
Request Body (Before Encryption) 
{ 
} 
"apiKey": "MshTymhj6llgEhzpJ5s0M9gI3soYz82h", 
"secretKey": "QI8zFZWX272Z0Unb" 
Request Body (After Encryption) 
{ 
} 
"payload": "0oA+t8GGuDZ0FrEbhM9bZ2pxTDZasdasdasasdjqwuhenqwj^7y=" 
Success Response (200 OK) 
{ 
"respCode": 2000, 
"respMessage": "Token generated successfully", 
"data": "nqiNrwBEk770qbQ3tyn1MY2QzYSa0N8qmGSp/W0AtOs8", 
"expiresIn": 300, 
"tokenType": "Bearer" 
} 
Decrypted Token Response 
{ 
} 
"token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWF2QT4fwpMeJf36POk6yJV_adQssw5c" 
Response Codes 
Success Response 
Code Message 
2000 Access Token generated 
Client Error Responses 
Code Message 
Description 
4001 Unauthorized access Invalid API key or secret key 
Using Bearer Tokens 
Once you have obtained a JWT token, include it in the Authorization header of all API requests: 
Authorization: Bearer 
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWF2QT4fwpMeJf36POk6yJV_adQssw5c 
Token Expiry 
Expiry Time: 5 minutes (300 seconds) 
Renewal: Generate new tokens before expiry 
Best Practice: Implement automatic token refresh in your application 
Implementation Example 
JavaScript 
// Generate access token 
async function generateAccessToken() { 
const credentials = { 
apiKey: "your_api_key", 
secretKey: "your_secret_key" 
}; 
 
  // Encrypt the credentials 
  const encryptedPayload = encryptMerchantData( 
    JSON.stringify(credentials), 
    API_KEY, 
    SECRET_KEY 
  ); 
 
  const response = await fetch('https://merchant.paywize.in/api/v1/auth/clients/token', { 
    method: 'POST', 
    headers: { 
      'Content-Type': 'application/json' 
    }, 
    body: JSON.stringify({ 
      payload: encryptedPayload 
    }) 
  }); 
 
  const result = await response.json(); 
 
  if (result.respCode === 2000) { 
    // Decrypt the token data 
    const decryptedData = decryptMerchantData(result.data, API_KEY, SECRET_KEY); 
    const tokenData = JSON.parse(decryptedData); 
    return tokenData.token; 
  } 
 
  throw new Error(result.respMessage); 
} 
 
// Use token in API calls 
async function makeAuthenticatedRequest(endpoint, data, token) { 
  const encryptedPayload = encryptMerchantData( 
    JSON.stringify(data), 
    API_KEY, 
    SECRET_KEY 
  ); 
 
  const response = await fetch(endpoint, { 
    method: 'POST', 
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    }, 
    body: JSON.stringify({ 
      payload: encryptedPayload 
    }) 
  }); 
 
  return response.json(); 
} 
Python 
 
import requests 
import json 
from encryption_utils import encrypt_merchant_data, decrypt_merchant_data 
 
def generate_access_token(api_key, secret_key): 
    credentials = { 
        "apiKey": api_key, 
        "secretKey": secret_key 
    } 
 
    # Encrypt the credentials 
    encrypted_payload = encrypt_merchant_data( 
        json.dumps(credentials), 
        api_key, 
        secret_key 
    ) 
 
    response = requests.post( 
        'https://merchant.paywize.in/api/v1/auth/clients/token', 
        headers={'Content-Type': 'application/json'}, 
        json={'payload': encrypted_payload} 
    ) 
 
    result = response.json() 
 
    if result['respCode'] == 2000: 
        # Decrypt the token data 
        decrypted_data = decrypt_merchant_data(result['data'], api_key, secret_key) 
        token_data = json.loads(decrypted_data) 
        return token_data['token'] 
 
    raise Exception(result['respMessage']) 
 
def make_authenticated_request(endpoint, data, token, api_key, secret_key): 
    encrypted_payload = encrypt_merchant_data( 
        json.dumps(data), 
        api_key, 
        secret_key 
    ) 
 
    response = requests.post( 
        endpoint, 
        headers={ 
            'Content-Type': 'application/json', 
            'Authorization': f'Bearer {token}' 
        }, 
        json={'payload': encrypted_payload} 
    ) 
 
    return response.json() 
Security Best Practices 
Store Credentials Securely: Never hardcode API keys in your source code 
Use Environment Variables: Store credentials in environment variables or secure configuration files 
Implement Token Caching: Cache tokens and refresh before expiry to avoid unnecessary API calls 
Handle Token Expiry: Implement automatic token refresh when receiving 401 Unauthorized 
responses 
Use HTTPS Only: All API communications must use HTTPS 
IP Whitelisting: Ensure your server IPs are whitelisted with Paywize 
Validate Responses: Always validate API responses and handle errors appropriately 
Error Handling 
Always implement proper error handling for authentication: 
 
 
async function authenticatedApiCall(endpoint, data) { 
  let token = await getStoredToken(); 
 
  try { 
    const response = await makeAuthenticatedRequest(endpoint, data, token); 
 
    if (response.respCode === 4008) { // Unauthorized 
      // Token expired, generate new one 
      token = await generateAccessToken(); 
      storeToken(token); 
      return await makeAuthenticatedRequest(endpoint, data, token); 
    } 
 
    return response; 
  } catch (error) { 
    console.error('API call failed:', error); 
    throw error; 
  } 
} 
 
 
 
API Docs 
Shared Resources 
Encryption 
Encryption 
Implement end-to-end encryption for Paywize API requests using AES-256-CBC. 
 
Last updated: 2026-02-21 
 
Encryption and Decryption 
Overview 
All Paywize APIs use AES-256-CBC encryption to secure sensitive data transmission. This guide 
provides implementation details for encrypting request data and decrypting response data across all 
Paywize products. 
 
Quick Reference 
Attribute Details 
Encryption Algorithm AES-256-CBC 
Key Source API Key (32 characters) 
IV Source 
Secret Key (16 characters) 
Encoding 
Base64 after encryption 
Data Format JSON before encryption 
Security Level Enterprise-grade 
Encryption Process 
Step-by-Step Encryption 
Prepare Data: Convert JSON object to string format 
AES-256-CBC Encryption: Encrypt using your API Key as encryption key 
Initialization Vector: Use your Secret Key as the IV 
Base64 Encoding: Encode encrypted data for safe transmission 
Implementation 
JavaScript 
import crypto from 'crypto'; 
// Encrypt merchant data 
export function encryptMerchantData(data, key, iv) { 
if (typeof data === 'object') { 
data = JSON.stringify(data); 
} 
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv); 
const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]); 
return encrypted.toString('base64'); 
} 
// Decrypt merchant data 
export function decryptMerchantData(data, key, iv) { 
const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv); 
const decrypted = Buffer.concat([ 
decipher.update(Buffer.from(data, 'base64')), 
decipher.final() 
]); 
return decrypted.toString('utf8'); 
} 
// Example usage 
const apiKey = 'your_32_char_api_key_here_123456'; 
const secretKey = 'your_16_char_iv_12'; 
// Encrypt request data 
const requestData = { 
senderId: "TXN123456", 
txnType: "INTENT", 
requestAmount: "100.50" 
}; 
const encryptedPayload = encryptMerchantData(requestData, apiKey, secretKey); 
console.log('Encrypted:', encryptedPayload); 
// Decrypt response data 
const decryptedResponse = decryptMerchantData(encryptedPayload, apiKey, secretKey); 
console.log('Decrypted:', JSON.parse(decryptedResponse)); 
Python 
import json 
import base64 
from Crypto.Cipher import AES 
from Crypto.Util.Padding import pad, unpad 
def encrypt_merchant_data(data, key, iv): 
""" 
    Encrypt data using AES-256-CBC 
 
    Args: 
        data: Data to encrypt (string or dict) 
        key: 32-byte encryption key 
        iv: 16-byte initialization vector 
 
    Returns: 
        Base64 encoded encrypted string 
    """ 
    if isinstance(data, dict): 
        data = json.dumps(data) 
 
    # Convert strings to bytes 
    key_bytes = key.encode('utf-8') 
    iv_bytes = iv.encode('utf-8') 
    data_bytes = data.encode('utf-8') 
 
    # Create cipher and encrypt 
    cipher = AES.new(key_bytes, AES.MODE_CBC, iv_bytes) 
    padded_data = pad(data_bytes, AES.block_size) 
    encrypted = cipher.encrypt(padded_data) 
 
    # Return base64 encoded result 
    return base64.b64encode(encrypted).decode('utf-8') 
 
def decrypt_merchant_data(encrypted_data, key, iv): 
    """ 
    Decrypt data using AES-256-CBC 
 
    Args: 
        encrypted_data: Base64 encoded encrypted string 
        key: 32-byte encryption key 
        iv: 16-byte initialization vector 
 
    Returns: 
        Decrypted string 
    """ 
    # Convert strings to bytes 
    key_bytes = key.encode('utf-8') 
    iv_bytes = iv.encode('utf-8') 
 
    # Decode base64 and decrypt 
    encrypted_bytes = base64.b64decode(encrypted_data) 
    cipher = AES.new(key_bytes, AES.MODE_CBC, iv_bytes) 
    decrypted_padded = cipher.decrypt(encrypted_bytes) 
    decrypted = unpad(decrypted_padded, AES.block_size) 
 
    return decrypted.decode('utf-8') 
 
# Example usage 
api_key = 'your_32_char_api_key_here_123456' 
secret_key = 'your_16_char_iv_12' 
 
# Encrypt request data 
request_data = { 
    "senderId": "TXN123456", 
    "txnType": "INTENT", 
    "requestAmount": "100.50" 
} 
 
encrypted_payload = encrypt_merchant_data(request_data, api_key, secret_key) 
print(f"Encrypted: {encrypted_payload}") 
 
# Decrypt response data 
decrypted_response = decrypt_merchant_data(encrypted_payload, api_key, secret_key) 
print(f"Decrypted: {json.loads(decrypted_response)}") 
PHP 
 
<?php 
 
class PaywizeEncryption { 
 
    /** 
     * Encrypt data using AES-256-CBC 
     */ 
    public static function encryptMerchantData($data, $key, $iv) { 
        if (is_array($data) || is_object($data)) { 
            $data = json_encode($data); 
        } 
 
        $encrypted = openssl_encrypt( 
            $data, 
            'AES-256-CBC', 
            $key, 
            OPENSSL_RAW_DATA, 
            $iv 
        ); 
 
        return base64_encode($encrypted); 
    } 
 
    /** 
     * Decrypt data using AES-256-CBC 
     */ 
    public static function decryptMerchantData($encryptedData, $key, $iv) { 
        $data = base64_decode($encryptedData); 
 
        $decrypted = openssl_decrypt( 
            $data, 
            'AES-256-CBC', 
            $key, 
            OPENSSL_RAW_DATA, 
            $iv 
        ); 
 
        return $decrypted; 
    } 
} 
 
// Example usage 
$apiKey = 'your_32_char_api_key_here_123456'; 
$secretKey = 'your_16_char_iv_12'; 
 
// Encrypt request data 
$requestData = [ 
    'senderId' => 'TXN123456', 
    'txnType' => 'INTENT', 
    'requestAmount' => '100.50' 
]; 
 
$encryptedPayload = PaywizeEncryption::encryptMerchantData($requestData, $apiKey, 
$secretKey); 
echo "Encrypted: " . $encryptedPayload . "\n"; 
 
// Decrypt response data 
$decryptedResponse = PaywizeEncryption::decryptMerchantData($encryptedPayload, $apiKey, 
$secretKey); 
echo "Decrypted: " . $decryptedResponse . "\n"; 
 
?> 
Java 
 
import javax.crypto.Cipher; 
import javax.crypto.spec.IvParameterSpec; 
import javax.crypto.spec.SecretKeySpec; 
import java.util.Base64; 
import java.nio.charset.StandardCharsets; 
 
public class PaywizeEncryption { 
 
    private static final String ALGORITHM = "AES/CBC/PKCS5Padding"; 
    private static final String KEY_ALGORITHM = "AES"; 
 
    /** 
     * Encrypt data using AES-256-CBC 
     */ 
    public static String encryptMerchantData(String data, String key, String iv) 
            throws Exception { 
 
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), 
KEY_ALGORITHM); 
        IvParameterSpec ivSpec = new IvParameterSpec(iv.getBytes(StandardCharsets.UTF_8)); 
 
        Cipher cipher = Cipher.getInstance(ALGORITHM); 
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec); 
 
        byte[] encrypted = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8)); 
        return Base64.getEncoder().encodeToString(encrypted); 
    } 
 
    /** 
     * Decrypt data using AES-256-CBC 
     */ 
    public static String decryptMerchantData(String encryptedData, String key, String iv) 
            throws Exception { 
 
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), 
KEY_ALGORITHM); 
        IvParameterSpec ivSpec = new IvParameterSpec(iv.getBytes(StandardCharsets.UTF_8)); 
 
        Cipher cipher = Cipher.getInstance(ALGORITHM); 
        cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec); 
 
        byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(encryptedData)); 
        return new String(decrypted, StandardCharsets.UTF_8); 
    } 
 
    // Example usage 
    public static void main(String[] args) throws Exception { 
        String apiKey = "your_32_char_api_key_here_123456"; 
        String secretKey = "your_16_char_iv_12"; 
 
        // Encrypt request data 
        String requestData = 
"{\"senderId\":\"TXN123456\",\"txnType\":\"INTENT\",\"requestAmount\":\"100.50\"}"; 
        String encryptedPayload = encryptMerchantData(requestData, apiKey, secretKey); 
        System.out.println("Encrypted: " + encryptedPayload); 
// Decrypt response data 
String decryptedResponse = decryptMerchantData(encryptedPayload, apiKey, secretKey); 
System.out.println("Decrypted: " + decryptedResponse); 
} 
} 
Key Requirements 
API Key (Encryption Key) 
Length: 32 characters (256 bits) 
Usage: Used as the AES encryption key 
Security: Keep this confidential and never expose in client-side code 
Secret Key (Initialization Vector) 
Length: 16 characters (128 bits) 
Usage: Used as the Initialization Vector (IV) for CBC mode 
Security: Keep this confidential and never expose in client-side code 
Request/Response Flow 
1. Encrypting Request Data 
// Original request data 
const requestData = { 
senderId: "TXN123456", 
txnType: "INTENT", 
requestAmount: "100.50" 
}; 
// Encrypt the data 
const encryptedPayload = encryptMerchantData(requestData, apiKey, secretKey); 
// Send encrypted payload 
const apiRequest = { 
payload: encryptedPayload 
}; 
2. Decrypting Response Data 
// API response contains encrypted data 
const apiResponse = { 
respCode: 2000, 
respMessage: "Success", 
data: "encrypted_base64_string_here" 
}; 
// Decrypt the response data 
const decryptedData = decryptMerchantData(apiResponse.data, apiKey, secretKey); 
const responseData = JSON.parse(decryptedData); 
Error Handling 
Common Encryption Errors 
Error Code 
Message 
Solution 
4014 Decryption failed. Please check the encryption Verify API Key and Secret Key are correct 
4001 Invalid request format Ensure data is properly encrypted and Base64 encoded 
Debugging Tips 
Verify Key Lengths: Ensure API Key is 32 characters and Secret Key is 16 characters 
Check Character Encoding: Use UTF-8 encoding for all string operations 
Validate Base64: Ensure encrypted data is properly Base64 encoded 
Test with Known Values: Use the provided test cases to verify your implementation 
Security Best Practices 
Critical Security Guidelines 
Never Log Sensitive Data: Don't log API keys, secret keys, or decrypted data 
Use Environment Variables: Store credentials securely outside your codebase 
Validate Input: Always validate data before encryption 
Handle Exceptions: Implement proper error handling for encryption/decryption operations 
Secure Key Storage: Use secure credential management systems in production 
Regular Key Rotation: Rotate your API credentials regularly 
Additional Security Measures 
HTTPS Only: Always use HTTPS for API requests 
IP Whitelisting: Restrict API access to approved IP addresses 
Rate Limiting: Implement proper rate limiting to prevent abuse 
Audit Logging: Log API usage patterns without exposing sensitive data 
Testing Your Implementation 
Use these test vectors to verify your encryption implementation: 
// Test case 
const apiKey = 'test_api_key_32_characters_long'; 
const secretKey = 'test_secret_16ch'; 
const testData = '{"test": "data"}'; 
// Expected encrypted result (will vary due to padding) 
const encrypted = encryptMerchantData(testData, apiKey, secretKey); 
const decrypted = decryptMerchantData(encrypted, apiKey, secretKey); 
// Should match original data 
console.assert(decrypted === testData, 'Encryption/Decryption test failed'); 
API Docs 
Resources 
Changelog 
Changelog 
Track the latest updates and improvements to Paywize APIs. 
Last updated: 2026-02-21 
Changelog 
Track all changes and updates across the Paywize Platform APIs. 
Current Versions 
Product Version Release Date Status 
Payout API 
v1.0.0 Nov 5, 2025 
Collection API v1.0.0 Jul 5, 2025 
Connected Banking 
Stable 
Stable 
v1.0.0 Feb 02, 2026 Stable 
Payout API 
v1.0.0 - November 5, 2025 
Initial Release 
Core Features 
IMPS, NEFT, and RTGS transfers 
Real-time transaction status tracking 
Wallet balance inquiries 
Webhook notifications for status updates 
AES-256-CBC encryption 
JWT authentication with 5-minute expiry 
API Endpoints 
POST /api/payout/v1/initiate - Initiate payout transactions 
GET /api/payout/v1/status - Check transaction status 
GET /api/payout/v1/balance - Check wallet balance 
Collection API 
v1.0.0 - July 5, 2025 
Initial Release 
Core Features 
UPI payment collection 
Payment intent URL generation 
Real-time payment status tracking 
Webhook notifications for status updates 
AES-256-CBC encryption 
JWT authentication with 5-minute expiry 
API Endpoints 
POST /api/collection/v1/initiate - Initiate payment collection 
GET /api/collection/v1/status - Check payment status 
Connected Banking 
v1.0.0 - Feb 02, 2026 
Initial Release 
Core Features 
IMPS, NEFT, and RTGS transfers 
Real-time transaction status tracking 
Wallet balance inquiries 
Bank balance inquiries 
Webhook notifications for status updates 
AES-256-CBC encryption 
JWT authentication with 5-minute expiry 
API Endpoints 
POST /api/v1/connected-banking/public/payment/initiate - Initiate payment 
GET /api/v1/connected-banking/public/get-status - Status Check 
GET /api/v1/connected-banking/public/check-balance - Check Wallet Balance 
GET /api/v1/connected-banking/public/bank-balance/{channel} - Check Bank Balance 
Platform Updates 
November 2025 
Payout API v1.0.0 launch 
Unified documentation site 
Shared authentication system 
July 2025 
Collection API v1.0.0 launch 
AES-256-CBC encryption implementation 
JWT authentication system 
Feb 2026 
Connected Banking API v1.0.0 launch 
AES-256-CBC encryption implementation 
JWT authentication system 
Support & Migration 
Need help with API integration or updates? 
Developer Support: developer-support@paywize.in 
Documentation Issues: docs@paywize.in 
API Docs 
Resources 
Support 
Support 
Get help with Paywize API integration. 
Last updated: 2026-02-21 
Support 
Get help with the Paywize Platform APIs. Our support team is here to assist you with integration, 
troubleshooting, and best practices. 
Quick Links 
API Status - Real-time API status and uptime 
Developer Portal - Developer dashboard and resources 
Community Forum - Community discussions 
Contact Information 
Developer Support 
Email: developer-support@paywize.in 
Response Time: Within 4 hours (business days) 
Support Hours: Monday - Friday, 9:00 AM - 6:00 PM IST 
Business Support 
Email: business@paywize.in 
Support Hours: Monday - Friday, 9:00 AM - 6:00 PM IST 
Documentation Issues 
Email: docs@paywize.in 
Getting Help 
Before Contacting Support 
Please review: 
Getting Started Guide - Platform overview and setup 
Payout API Documentation - Complete payout API reference 
Collection API Documentation - Complete collection API reference 
Authentication Guide - JWT token generation 
Encryption Guide - AES-256-CBC implementation 
Changelog - Recent updates and changes 
Check API Status 
Visit status.paywize.in for: 
Current API status 
Scheduled maintenance 
Recent incidents 
Contact Support 
Tips for faster resolution: 
Include relevant code snippets 
Provide API request/response examples 
Mention your merchant ID 
Describe steps to reproduce the issue 
Common Issues & Solutions 
Authentication Issues 
Problem: 401 Unauthorized errors Solution: 
Check if your API credentials are correct 
Ensure token hasn't expired (tokens last 5 minutes) 
Verify you're using the correct environment (sandbox vs production) 
Generate new token using correct endpoint 
// Correct token generation 
const response = await fetch('https://merchant.paywize.in/api/v1/auth/clients/token', { 
method: 'POST', 
headers: { 
'Content-Type': 'application/json' 
}, 
body: JSON.stringify({ 
payload: encryptedCredentials 
}) 
}); 
Encryption/Decryption Errors 
Problem: Encryption or decryption failures Solution: 
Verify API key format (32 characters) 
Verify secret key format (16 characters for IV) 
Use AES-256-CBC encryption 
Ensure proper base64 encoding/decoding 
Webhook Issues 
Problem: Webhooks not being received Solution: 
Ensure webhook URL is publicly accessible 
Return 200 OK status within 30 seconds 
Provide correct callback_url in API requests 
Check for HTTPS requirement 
Transaction Status Issues 
Problem: Transaction status not updating Solution: 
Check if webhooks are configured correctly 
Use status API as fallback 
Verify transaction_id or sender_id format 
Check for network connectivity issues 
FAQ 
General Questions 
Q: How do I migrate from sandbox to production? A: Update your base URL from 
sandbox.merchant.paywize.in to merchant.paywize.in and use production credentials. 
Q: Can I test APIs without real money? A: Yes, use our sandbox environment with test credentials. 
Payout API 
Q: How long do payouts take to process? A: IMPS transfers are instant, NEFT takes 30 min - 2 hours, 
RTGS takes 30 min - 2 hours. 
Q: Can I cancel a payout after initiation? A: Payouts can only be cancelled before processing begins. 
Use the status API to check current status. 
Collection API 
Q: What payment methods are supported? A: UPI payment collection with payment intent URLs. 
Q: How do I configure webhooks? A: Provide callback_url in your API requests for real-time status 
notifications. 
Support Response Times 
Support Type Response Time 
Developer Support 
Business Support 
4 hours (business days) 
4 hours (business days) 
Documentation Issues 24 hours 