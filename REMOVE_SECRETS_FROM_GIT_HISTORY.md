# Instructions: Remove Secrets from Git History

⚠️ **WARNING**: These operations rewrite git history. Coordinate with your team before proceeding.

## Secrets Found in Git History

Based on the audit, the following secrets were committed to git:

1. **Google Maps API Key**: `AIzaSyAUNl5bZif51a8b5FC5kKqZs40KlP5lP74`
   - Found in commits: `fed8ce6`, `916db57`, `7566836`, `3f8d528`, `240305d`, `6b95057`, etc.

2. **CRON_SECRET**: `hdN8SGSEsSulptdqHg0O2Yss2lpxXwKUlDvMZM3ABso=`
   - Found in commit: `9b00ad4`

3. **RESEND_WEBHOOK_SECRET**: `whsec_b2akJsaEFVZl8i6fKAnztSqHxqIEi/cU`
   - Found in commit: `9b00ad4`

4. **RESEND_API_KEY**: `re_H9TCXTNw_LDFKwRKd92qow9MNng5adhH6`
   - Found in commits: `5836935`, `398a7d6`

## Option 1: Using git filter-repo (Recommended)

```bash
# Install git-filter-repo if not already installed
# Windows: pip install git-filter-repo
# Mac/Linux: brew install git-filter-repo

# Remove Google Maps API Key
git filter-repo --replace-text <(echo "AIzaSyAUNl5bZif51a8b5FC5kKqZs40KlP5lP74==>REMOVED_SECRET") --force

# Remove CRON_SECRET
git filter-repo --replace-text <(echo "hdN8SGSEsSulptdqHg0O2Yss2lpxXwKUlDvMZM3ABso==>REMOVED_SECRET") --force

# Remove RESEND_WEBHOOK_SECRET
git filter-repo --replace-text <(echo "whsec_b2akJsaEFVZl8i6fKAnztSqHxqIEi/cU==>REMOVED_SECRET") --force

# Remove RESEND_API_KEY
git filter-repo --replace-text <(echo "re_H9TCXTNw_LDFKwRKd92qow9MNng5adhH6==>REMOVED_SECRET") --force
```

## Option 2: Using BFG Repo-Cleaner

```bash
# Download BFG from: https://rtyley.github.io/bfg-repo-cleaner/

# Create replacements file
echo "AIzaSyAUNl5bZif51a8b5FC5kKqZs40KlP5lP74==>REMOVED_SECRET" > secrets.txt
echo "hdN8SGSEsSulptdqHg0O2Yss2lpxXwKUlDvMZM3ABso==>REMOVED_SECRET" >> secrets.txt
echo "whsec_b2akJsaEFVZl8i6fKAnztSqHxqIEi/cU==>REMOVED_SECRET" >> secrets.txt
echo "re_H9TCXTNw_LDFKwRKd92qow9MNng5adhH6==>REMOVED_SECRET" >> secrets.txt

# Run BFG
java -jar bfg.jar --replace-text secrets.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## Option 3: Using git filter-branch (Legacy method)

```bash
# Remove all occurrences of the Google Maps API key
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch buyer-form/index.html app/public/buyer-form/index.html" \
  --prune-empty --tag-name-filter cat -- --all

# Then rewrite all commits to replace the secret
git filter-branch --force --tree-filter \
  'find . -type f -exec sed -i "s/AIzaSyAUNl5bZif51a8b5FC5kKqZs40KlP5lP74/REMOVED_SECRET/g" {} \;' \
  --prune-empty --tag-name-filter cat -- --all
```

## After Removing from History

1. **Force push to remote** (coordinate with team first):
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```

2. **Notify all team members** to re-clone the repository:
   ```bash
   # Team members should:
   cd /path/to/repo
   git fetch origin
   git reset --hard origin/main  # or master, depending on your default branch
   ```

3. **Rotate all exposed keys** (assume they're compromised):
   - Google Maps API Key
   - Firebase API Key  
   - CRON_SECRET
   - RESEND_API_KEY
   - RESEND_WEBHOOK_SECRET

## Important Notes

- ⚠️ **This is a destructive operation** - it rewrites git history
- ⚠️ **Coordinate with your team** - everyone needs to re-clone
- ⚠️ **Backup first** - create a backup branch before proceeding
- ⚠️ **Rotate keys immediately** - assume all exposed keys are compromised
- ✅ **After cleanup** - verify no secrets remain: `git log --all -S "SECRET"`

## Alternative: If Repository is Public

If this is a **public repository**:

1. **Assume all keys are compromised** - rotate immediately
2. **Consider making the repo private** if it contains sensitive information
3. **Remove from history** to prevent further exposure
4. **Monitor for unauthorized access** in your service dashboards

## Verification

After cleanup, verify secrets are removed:

```bash
# Search for any remaining occurrences
git log --all --full-history -S "AIzaSyAUNl5bZif51a8b5FC5kKqZs40KlP5lP74"
git log --all --full-history -S "hdN8SGSEsSulptdqHg0O2Yss2lpxXwKUlDvMZM3ABso="
git log --all --full-history -S "whsec_b2akJsaEFVZl8i6fKAnztSqHxqIEi/cU"
git log --all --full-history -S "re_H9TCXTNw_LDFKwRKd92qow9MNng5adhH6"

# Should return no results if cleanup was successful
```

---
**Last Updated**: January 2025
**Status**: Action Required - History Cleanup




























































