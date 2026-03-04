---
title: PAYCHER PLATFORM
---

**B2B Payment API Platform**

Complete Technical Requirements & Implementation Plan

# 1. EXECUTIVE SUMMARY

**CLIENT UPDATE:** Platform scope revised to B2B API service only.
Direct consumer payments (previously Flow 1) have been removed from
scope.

Paycher is a B2B payment API platform that enables businesses to
integrate payment processing capabilities into their applications. The
platform provides white-label payment APIs that allow partner businesses
(gaming platforms, e-commerce sites, service providers, etc.) to accept
payments from their end users through a simple API integration. Paycher
integrates with Paywise as the primary payment gateway and implements a
commission-based revenue model with comprehensive wallet management and
settlement capabilities.

Key Platform Features

-   RESTful Payment APIs for seamless third-party integration

-   Payment gateway integration via Paywise

-   Partner onboarding and API credential management

-   Per-transaction commission model (client approved)

-   Partner wallet system with automated settlements

-   Real-time webhook notifications for payment events

-   Comprehensive transaction logging and reporting

-   Role-based access control (Partner/Admin)

-   Sandbox environment for testing and development

-   Secure API authentication (API Keys + OAuth 2.0)

# 2. BUSINESS MODEL & OPERATIONS

## 2.1 Platform Overview

Paycher operates as a payment infrastructure provider exclusively for
businesses (B2B model). Partner companies integrate Paycher\'s payment
APIs into their applications to enable their end users to make payments.
Paycher handles all payment processing, gateway integration, compliance,
and settlement operations, while partners focus on their core business.

## 2.2 How It Works - Complete Flow

1.  **1. Partner Registration:** Business partners sign up on Paycher
    platform and complete KYC verification

2.  **2. API Credentials:** Partners receive API Key, Secret Key, and
    access to sandbox environment

3.  **3. Integration:** Partners integrate Paycher payment APIs into
    their application (web/mobile)

4.  **4. Configuration:** Partners configure webhook URLs, commission
    settings, and settlement preferences

5.  **5. Payment Initiation:** End user on partner\'s platform initiates
    payment (e.g., deposit ₹1000)

6.  **6. API Call:** Partner\'s backend calls Paycher API with payment
    details

7.  **7. Payment Page:** User is redirected to Paycher\'s hosted payment
    page

8.  **8. Payment Processing:** User completes payment via Paywise
    (UPI/Card/Net Banking)

9.  **9. Commission Deduction:** Paycher automatically deducts
    commission (e.g., 3% = ₹30)

10. **10. Wallet Credit:** Net amount (₹970) credited to partner\'s
    Paycher wallet

11. **11. Webhook Notification:** Paycher sends real-time webhook to
    partner with payment status

12. **12. Partner Action:** Partner receives webhook and updates user\'s
    account/wallet in their system

13. **13. Settlement:** Partner requests withdrawal; funds transferred
    to their bank account

## 2.3 Practical Example: Gaming Platform Integration

**Scenario:** GamingPro (partner) wants to accept deposits from their
users

**Step-by-Step Transaction:**

-   User \"Rahul\" visits GamingPro.com and wants to add ₹1,000 to his
    game wallet

-   Rahul clicks \"Add Money\" and enters ₹1,000

-   GamingPro\'s backend makes API call to Paycher: POST
    /api/v1/payments/initiate

-   Paycher creates transaction and returns payment_url

-   Rahul is redirected to: https://paycher.com/pay/txn_abc123

-   Rahul sees Paycher\'s payment page with UPI/Card/NetBanking options

-   Rahul selects UPI and completes payment of ₹1,000

-   Paywise processes the payment successfully

-   Paycher deducts ₹30 commission (3% of ₹1,000)

-   Paycher credits ₹970 to GamingPro\'s wallet

-   Paycher immediately sends webhook POST request to GamingPro:
    \"payment.success\"

-   GamingPro receives webhook, verifies signature, and adds ₹1,000 to
    Rahul\'s game wallet

-   Rahul is redirected back to GamingPro and sees updated balance

-   Rahul can now use ₹1,000 to play games (managed entirely by
    GamingPro)

-   At end of day/week, GamingPro requests settlement of accumulated
    funds from Paycher wallet

-   Paycher transfers funds to GamingPro\'s bank account

## 2.4 Important: Separation of Concerns

  -----------------------------------------------------------------------
  Paycher Manages                     Partner Manages
  ----------------------------------- -----------------------------------
  • Payment processing\               • End user accounts\
  • Gateway integration\              • User wallet/credits\
  • Transaction security\             • Business logic\
  • Commission collection\            • User experience\
  • Partner wallet & settlements\     • Pricing & promotions\
  • Compliance & regulatory\          • User withdrawals\
  • Transaction logs                  • Customer support

  Paycher does NOT know what users do Partner does NOT handle actual
  with credits after payment          payment processing
  -----------------------------------------------------------------------

**Key Point:** Paycher never stores or manages end-user data (customers
of partners). We only track partner transactions and wallets. End-user
management is entirely the partner\'s responsibility.

## 2.5 Target Partner Industries

-   **Online Gaming:** Real-money games, fantasy sports, poker, rummy,
    casual gaming

-   **E-commerce:** Product sales, marketplace transactions, service
    bookings

-   **EdTech:** Course payments, tutoring fees, certification programs

-   **SaaS Platforms:** Subscription billing, usage-based payments,
    license fees

-   **Marketplaces:** Buyer-seller transactions, commission-based
    platforms

-   **Service Aggregators:** Taxi booking, food delivery, home services

-   **Content Creators:** Subscription platforms, tips/donations,
    premium content

-   **Fintech Apps:** Micro-lending, investment platforms, insurance

## 2.6 Commission Model

**CLIENT APPROVED:** Per-Transaction Commission Model

Paycher charges a percentage-based commission on each successful
transaction processed through the platform. The commission is
automatically deducted before crediting the net amount to the partner\'s
wallet. This model provides:

-   Predictable revenue tied directly to transaction volume

-   Easy accounting and reconciliation

-   Automatic scaling with platform growth

-   Fair pricing for partners of all sizes

-   Transparent cost structure

**Example Calculation:\
**User pays ₹100 → Paycher deducts ₹3 commission (3%) → Partner receives
₹97 in wallet\
User pays ₹10,000 → Paycher deducts ₹300 commission (3%) → Partner
receives ₹9,700 in wallet

# 3. SYSTEM ARCHITECTURE

## 3.1 High-Level Architecture

-   **Partner Dashboard (Frontend):** React/Next.js - Partner portal for
    viewing transactions, managing API keys, requesting settlements

-   **Public Payment Pages:** Responsive payment interface where end
    users complete payments

-   **API Gateway:** Node.js/Express - Routes requests, handles
    authentication, rate limiting

-   **Business Logic Layer:** Payment processing, commission
    calculation, wallet operations, webhook delivery

-   **Payment Gateway Integration:** Paywise API integration for actual
    payment processing

-   **Database Layer:** PostgreSQL for transactional data, Redis for
    caching and sessions

-   **Wallet Service:** Manages partner wallets, settlements, and
    reconciliation

-   **Webhook Service:** Asynchronous webhook delivery with retry
    mechanism

-   **Logging & Monitoring:** Transaction logs, API logs, error
    tracking, system metrics

## 3.2 Core Components Detailed

### A. Authentication & Authorization

-   API Key + Secret Key authentication for partner API requests

-   JWT tokens for partner dashboard sessions

-   OAuth 2.0 support for advanced integrations

-   HMAC-SHA256 signature verification for webhooks

-   Role-Based Access Control (RBAC):

-   • Partner Role: View own transactions, manage API credentials,
    wallet operations, settlement requests, webhook configuration

-   • Admin Role: Platform configuration, view all transactions, partner
    approval, commission management, system monitoring

-   IP whitelisting for enhanced API security (optional)

-   Rate limiting per API key to prevent abuse

### B. Payment Processing Module

-   Paywise gateway integration with fallback mechanisms

-   Support multiple payment methods:

-   • UPI (PhonePe, Google Pay, Paytm, BHIM)

-   • Debit/Credit Cards (Visa, Mastercard, RuPay)

-   • Net Banking (all major Indian banks)

-   • Digital Wallets (if supported by Paywise)

-   Hosted payment page (white-labeled with partner branding option)

-   Payment status tracking with real-time updates

-   Automatic payment retry for failed transactions

-   Idempotency handling to prevent duplicate charges

-   Transaction timeout management

-   Payment link expiration (configurable, default 30 minutes)

### C. Commission Engine

-   Configurable commission rules per partner

-   Commission types supported:

-   • Percentage-based (e.g., 2.5% of transaction)

-   • Flat fee (e.g., ₹10 per transaction)

-   • Tiered pricing based on monthly volume

-   • Different rates per payment method

-   Real-time commission calculation during payment

-   Automatic commission deduction before wallet credit

-   Commission reporting and analytics dashboard

-   Historical commission data for auditing

### D. Partner Wallet System

-   **Platform Master Wallet:** Collects all commissions from all
    transactions

-   **Partner Wallets (Multiple):** Individual wallet for each partner
    with real-time balance

-   Wallet Operations:

-   **• Credit:** Automatic credit of net amount after each successful
    payment

-   **• Debit:** Settlements/withdrawals to partner bank accounts

-   **• Hold:** Temporary holds for dispute resolution or refunds

-   **Transaction History:** Complete audit trail of all wallet
    movements

-   **Balance Reconciliation:** Automated daily reconciliation with
    payment gateway

-   **Low Balance Alerts:** Notifications when master wallet needs
    replenishment

-   **Multi-currency Support:** INR primary, expandable to other
    currencies

### E. Settlement System

-   Settlement = Transfer of funds from partner\'s Paycher wallet to
    their bank account

-   Settlement Cycles:

-   • T+2 (Default): Funds available 2 business days after transaction

-   • Daily: Auto-settle every day for qualified partners

-   • Weekly: Every Friday for regular partners

-   • Monthly: 1st of each month

-   • Instant: On-demand for premium partners (additional 1% fee)

-   Minimum Settlement Amount: ₹1,000

-   Maximum Daily Settlement: ₹10,00,000 (configurable per partner)

-   Settlement Processing Time: 1-3 business days

-   Settlement Status Tracking: Pending → Processing → Completed →
    Failed

-   Automatic Retry: Failed settlements retry after 24 hours

-   Settlement Fees: ₹10 flat fee per settlement transaction

-   Bank Transfer Methods: NEFT, RTGS, IMPS

### F. Webhook System

-   Real-time HTTP POST notifications to partner endpoints

-   Webhook Events:

-   • payment.initiated - When payment process starts

-   • payment.success - Payment completed successfully

-   • payment.failed - Payment failed

-   • payment.pending - Payment awaiting confirmation

-   • refund.initiated - Refund process started

-   • refund.completed - Refund successful

-   • settlement.completed - Settlement to bank completed

-   HMAC-SHA256 signature for webhook verification

-   Automatic retry mechanism: 3 attempts with exponential backoff

-   Webhook logs for debugging and monitoring

-   Webhook testing interface in partner dashboard

-   Configurable webhook timeout (default 10 seconds)

### G. Logging & Monitoring

-   Comprehensive transaction logs (every payment step logged)

-   API request/response logging with masking of sensitive data

-   Error tracking and alerting (Sentry integration)

-   Partner activity audit trail

-   Paywise gateway interaction logs

-   Webhook delivery logs with response codes

-   System performance metrics (CPU, memory, response times)

-   Database query performance monitoring

-   Security event logging (failed auth attempts, suspicious activity)

-   Compliance and regulatory reporting

# 4. DATABASE SCHEMA

**IMPORTANT NOTE:** Since Paycher is B2B-only, we do NOT store end-user
data (customers of partners). The schema focuses on partners,
transactions, wallets, and settlements. End-user management is entirely
the responsibility of partner platforms.

## 4.1 Core Tables

### Partners Table

  -----------------------------------------------------------------------
  Field                   Type                    Description
  ----------------------- ----------------------- -----------------------
  partner_id              UUID                    Primary key

  business_name           VARCHAR(255)            Legal business name

  email                   VARCHAR(255)            Contact email, unique,
                                                  indexed

  password_hash           VARCHAR(255)            Bcrypt hashed password

  phone                   VARCHAR(15)             Contact phone number

  business_type           VARCHAR(100)            Gaming, E-commerce,
                                                  SaaS, etc.

  kyc_status              ENUM                    pending, approved,
                                                  rejected

  api_key                 VARCHAR(64)             Public API key, unique

  api_secret_hash         VARCHAR(255)            Hashed secret key

  webhook_url             VARCHAR(500)            Partner\'s webhook
                                                  endpoint

  is_active               BOOLEAN                 Account status

  created_at              TIMESTAMP               Registration date
  -----------------------------------------------------------------------

### Transactions Table

  -----------------------------------------------------------------------
  Field                   Type                    Description
  ----------------------- ----------------------- -----------------------
  transaction_id          UUID                    Primary key

  partner_id              UUID                    Foreign key to partners

  amount                  DECIMAL(15,2)           Transaction amount

  commission              DECIMAL(15,2)           Commission charged

  net_amount              DECIMAL(15,2)           Amount credited to
                                                  partner

  payment_method          VARCHAR(50)             UPI, Card, NetBanking

  status                  ENUM                    pending, success,
                                                  failed, refunded

  paywise_txn_id          VARCHAR(255)            Paywise transaction
                                                  reference

  user_reference          VARCHAR(255)            Partner\'s user ID (for
                                                  tracking)

  payment_url             VARCHAR(500)            Generated payment page
                                                  URL

  expires_at              TIMESTAMP               Payment link expiration

  completed_at            TIMESTAMP               Payment completion time

  metadata                JSON                    Additional
                                                  partner-provided data

  created_at              TIMESTAMP               Transaction initiation
                                                  time

  updated_at              TIMESTAMP               Last update time
  -----------------------------------------------------------------------

### Wallets Table

  -----------------------------------------------------------------------
  Field                   Type                    Description
  ----------------------- ----------------------- -----------------------
  wallet_id               UUID                    Primary key

  partner_id              UUID                    Foreign key (NULL for
                                                  platform wallet)

  wallet_type             ENUM                    platform, partner

  balance                 DECIMAL(15,2)           Current balance

  currency                VARCHAR(3)              INR (default)

  last_settlement         TIMESTAMP               Last settlement date

  created_at              TIMESTAMP               Wallet creation date
  -----------------------------------------------------------------------

### Additional Required Tables

-   **WalletTransactions:** Every credit/debit to wallets with
    transaction reference

-   **Settlements:** Settlement requests and their status (pending,
    processing, completed, failed)

-   **CommissionRules:** Configurable commission structures per partner

-   **Webhooks:** Webhook delivery attempts, status, and responses

-   **APILogs:** All API requests and responses for debugging

-   **AuditLogs:** Complete activity audit trail for compliance

*--- End of Requirements Document ---*

Generated: February 4, 2026 \| Version: 2.0 (B2B Only)
