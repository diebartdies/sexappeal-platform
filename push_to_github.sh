#!/bin/bash

if [[ "${1:-}" == "--auto" ]] || [[ "${1:-}" == "-y" ]]; then
    exec bash "$(dirname "$0")/scripts/git-backup-push.sh" "$(cd "$(dirname "$0")" && pwd)"
fi

echo "🚀 Starting GitHub upload process..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git could not be found. Please install Git first."
    read -p "Press [Enter] to exit..."
    exit 1
fi

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing empty Git repository..."
    git init || { echo "❌ Failed to initialize git."; read -p "Press [Enter] to exit..."; exit 1; }
    git branch -M main || true
fi

# Ask for commit message
read -p "📝 Enter commit message (default: 'Platform update'): " COMMIT_MSG
COMMIT_MSG=${COMMIT_MSG:-Platform update}

# Add and commit
echo "➕ Adding files (respecting .gitignore)..."
git add . || { echo "❌ Failed to add files."; read -p "Press [Enter] to exit..."; exit 1; }

echo "💾 Committing changes..."
git commit -m "$COMMIT_MSG" || echo "No new changes to commit."

# Check remote origin, ask for it if it doesn't exist
if ! git remote | grep -q 'origin'; then
    echo "🔗 Adding remote origin: https://github.com/diebartdies/sexappeal-platform.git"
    git remote add origin "https://github.com/diebartdies/sexappeal-platform.git" || { echo "❌ Failed to add remote origin."; read -p "Press [Enter] to exit..."; exit 1; }
fi

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push -u origin main || { 
    echo "❌ Failed to push to GitHub."
    echo "This often happens if GitHub has changes that your local machine doesn't."
    echo "To ensure your local content is NEVER overwritten by GitHub, we can force overwrite GitHub."
    read -p "⚠️ Do you want to FORCE push and overwrite GitHub with your local files? (y/n): " FORCE_PUSH
    if [[ "$FORCE_PUSH" =~ ^[Yy]$ ]]; then
        echo "🚀 Force pushing to GitHub..."
        git push -u origin main --force || { 
            echo "❌ Force push failed. Please check your GitHub authentication."
            read -p "Press [Enter] to exit..."
            exit 1
        }
    else
        echo "Aborting push to protect local content."
        read -p "Press [Enter] to exit..."
        exit 1
    fi
}

echo "✅ Successfully uploaded to GitHub!"
read -p "Press [Enter] to exit..."