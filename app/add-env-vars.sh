#!/bin/bash
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
  
  echo "Adding: $key"
  echo "$value" | vercel env add "$key" production --yes
done < .env.production
