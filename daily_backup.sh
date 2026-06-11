#!/bin/bash

# --- Configuration ---
DB_NAME="sexappeal"
MONGO_CONTAINER="sexappeal_mongo"
# Directory on the server to store backups
# Ensure this path is outside your SexAppeal-platform project directory if you regularly
# clean or remove that directory during deployments, to prevent accidental deletion.
BACKUP_DIR="/root/sexappeal_backups"
RETENTION_DAYS=7 # Number of days to keep backups

# --- Create backup directory if it doesn't exist ---
mkdir -p "$BACKUP_DIR"

# --- Generate timestamp for backup file ---
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${DB_NAME}_${TIMESTAMP}.archive"
FULL_BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

echo "Starting daily MongoDB backup for database '$DB_NAME'..."
echo "Backup file: $FULL_BACKUP_PATH"

# --- Perform the mongodump inside the Docker container ---
# This creates a temporary archive file inside the container
docker exec "$MONGO_CONTAINER" sh -c "mongodump --archive=/tmp/${BACKUP_FILE} --gzip --db ${DB_NAME}"

# --- Copy backup from container to host machine ---
# This moves the temporary archive from inside the container to the permanent host backup directory
docker cp "${MONGO_CONTAINER}:/tmp/${BACKUP_FILE}" "$FULL_BACKUP_PATH"

# --- Clean up temporary backup file inside the Docker container ---
docker exec "$MONGO_CONTAINER" rm "/tmp/${BACKUP_FILE}"

echo "Backup completed successfully to $FULL_BACKUP_PATH"

# --- Clean up old backups (older than RETENTION_DAYS) ---
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.archive" -mtime +"$RETENTION_DAYS" -delete
echo "Old backups cleaned."

echo "Daily backup script finished."