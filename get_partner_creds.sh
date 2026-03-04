#!/bin/bash

# Get admin JWT
ADMIN_LOGIN=$(curl -s -X POST http://localhost:5000/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@paycher.com","password":"AdminPaycher2024"}')

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Admin Token: $ADMIN_TOKEN"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "Failed to get admin token"
  exit 1
fi

# Get list of partners
PARTNERS=$(curl -s -X GET http://localhost:5000/api/v1/admin/partners \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Partners response:"
echo "$PARTNERS" | head -100

