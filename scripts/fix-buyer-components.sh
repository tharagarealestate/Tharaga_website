#!/bin/bash
# Fix all buyer dashboard components to use SupabaseContext

cd "$(dirname "$0")"

# Components to fix
components=(
  "app/components/dashboard/buyer/PerfectMatches.tsx"
  "app/components/dashboard/buyer/SavedProperties.tsx"
  "app/components/dashboard/buyer/DocumentVault.tsx"
  "app/components/dashboard/buyer/MarketInsights.tsx"
  "app/components/dashboard/buyer/DashboardHeader.tsx"
)

for file in "${components[@]}"; do
  echo "Fixing $file..."

  # Replace import
  sed -i "s/import { getSupabase } from '@\/lib\/supabase';/import { useSupabase } from '@\/contexts\/SupabaseContext';/g" "$file"

  # Replace const supabase = getSupabase()
  sed -i "s/const supabase = getSupabase();/const { supabase } = useSupabase();/g" "$file"

  echo "  ✓ Updated imports and Supabase initialization"
done

echo ""
echo "All components updated! Now need to add safety checks where supabase is used."
echo "Adding 'if (!supabase) return' checks manually for async functions..."
