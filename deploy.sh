#!/bin/bash
set -e

DIST_DIR="dist"
DEPLOY_BRANCH="gh-pages"
REPO_URL=$(git remote get-url origin)
COMMIT_MSG="deploy: fix email-verified student login bypass $(date '+%Y-%m-%d %H:%M')"

echo "🚀 Deploy başlıyor..."
echo "📦 Repo: $REPO_URL"
echo "🌿 Branch: $DEPLOY_BRANCH"

# Geçici deploy klasörü
TMPDIR=$(mktemp -d)
echo "📁 Temp dir: $TMPDIR"

# Mevcut dist'i kopyala
cp -r "$DIST_DIR"/. "$TMPDIR/"

# Geçici klasörde git repo başlat
cd "$TMPDIR"
git init
git config user.name "$(git -C "$OLDPWD" config user.name || echo 'Deploy Bot')"
git config user.email "$(git -C "$OLDPWD" config user.email || echo 'deploy@bot.local')"

git add -A
git commit -m "$COMMIT_MSG"

# gh-pages branch'ine force push et
git push --force "$REPO_URL" HEAD:"$DEPLOY_BRANCH"

echo ""
echo "✅ Deploy tamamlandı!"
echo "🌐 Site: https://testnep1453.github.io/nep1/"

# Temizlik
cd -
rm -rf "$TMPDIR"
