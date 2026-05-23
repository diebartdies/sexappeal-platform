#!/bin/bash

# This script configures your bash terminal to automatically load variables
# from your .env file every time you open it or change into the project folder.

BASHRC="$HOME/.bashrc"

echo "Configuring terminal to auto-load .env files..."

if grep -q "auto_load_env" "$BASHRC" 2>/dev/null; then
    echo "⚠️ Auto-loader is already configured in $BASHRC."
else
    cat << 'EOF' >> "$BASHRC"

# --- Auto-load .env variables ---
auto_load_env() {
    if [ -f ".env" ]; then
        # Load the .env file, ignoring comments and safely handling spaces
        set -a
        source .env
        set +a
        echo "✅ Loaded environment variables from .env"
    fi
}

# Override the 'cd' command to load .env when entering a directory
cd() {
    builtin cd "$@" && auto_load_env
}

# Run immediately when the terminal opens
auto_load_env
# --------------------------------
EOF
    echo "✅ Added auto-loader to $BASHRC."
fi

echo "🚀 To apply these changes right now, run:"
echo "source ~/.bashrc"