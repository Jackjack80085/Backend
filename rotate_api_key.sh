#!/bin/bash

# Login as partner with correct password
PARTNER_LOGIN=$(curl -s -X POST http://localhost:5000/auth/partner/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testpartner1@example.com","password":"User@123"}')

PARTNER_TOKEN=$(echo "$PARTNER_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Partner Token: ${PARTNER_TOKEN:0:20}..."

if [ -z "$PARTNER_TOKEN" ]; then
  echo "Failed to get partner token"
  exit 1
fi

# Rotate API key
echo "Rotating API key..."
ROTATE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/partner/rotate-api-key \
  -H "Authorization: Bearer $PARTNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Integration testing"}')

echo "New Credentials:"
echo "$ROTATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ROTATE_RESPONSE"

