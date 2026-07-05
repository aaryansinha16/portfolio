#!/usr/bin/env bash
set -euo pipefail
# Deploys the built journey to aaryansinha16.github.io (the user-pages
# root site). The pages repo holds ONLY built output; this repo is the
# source of truth. Old portfolio versions live on in its git history.
cd "$(dirname "$0")/.."
pnpm build
SHA=$(git rev-parse --short HEAD)
DIR=$(mktemp -d)
trap 'rm -rf "$DIR"' EXIT
git clone --depth 1 https://github.com/aaryansinha16/aaryansinha16.github.io.git "$DIR"
find "$DIR" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R dist/. "$DIR"/
find "$DIR" -name .DS_Store -delete
touch "$DIR/.nojekyll"
cat > "$DIR/README.md" <<'MD'
# aaryansinha16.github.io

**The Road Trip** — my portfolio, told as one long drive.

This repo holds the *built* site only. Source lives at
[aaryansinha16/portfolio](https://github.com/aaryansinha16/portfolio);
deploy from there with `pnpm deploy:pages`.
MD
git -C "$DIR" add -A
if git -C "$DIR" diff --cached --quiet; then
  echo "nothing to deploy (site unchanged)"
else
  git -C "$DIR" commit -m "deploy: the road trip @ portfolio ${SHA}"
  git -C "$DIR" push origin HEAD
fi
echo "deployed → https://aaryansinha16.github.io/"
