#!/bin/bash

# Backup script for src folder

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create backup directory if it doesn't exist
BACKUP_DIR="$SCRIPT_DIR/backup-files"
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# Create backup filename
BACKUP_NAME="src-backup-$TIMESTAMP"

# Copy src folder to backup
cp -r "$SCRIPT_DIR/src" "$BACKUP_DIR/$BACKUP_NAME"

echo "Backup created: $BACKUP_DIR/$BACKUP_NAME"
