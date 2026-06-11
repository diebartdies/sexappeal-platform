#!/bin/bash

# --- Configuration ---
DB_NAME="sexappeal"
MONGO_CONTAINER="sexappeal_mongo"
# Directory on the server where daily backups are stored
BACKUP_DIR="/root/sexappeal_backups"
BACKUP_SEARCH_PATTERN="${DB_NAME}_*.archive"

# --- Find the latest backup file in the designated backup directory ---
echo "Searching for the latest backup file in ${BACKUP_DIR} matching ${BACKUP_SEARCH_PATTERN}..."
LATEST_BACKUP_FILE=$(find "${BACKUP_DIR}" -type f -name "${BACKUP_SEARCH_PATTERN}" -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

if [ -z "$LATEST_BACKUP_FILE" ]; then
    echo "ERROR: No backup file found in ${BACKUP_DIR} matching ${BACKUP_SEARCH_PATTERN}."
    exit 1
fi

echo "Found latest backup file: ${LATEST_BACKUP_FILE}"

echo "Restoring database '${DB_NAME}' from '${LATEST_BACKUP_FILE}'..."

# Copy backup from host to Docker container
docker cp "${LATEST_BACKUP_FILE}" "${MONGO_CONTAINER}:/tmp/restore_backup.archive"

# Execute mongorestore inside the Docker container
if docker exec "$MONGO_CONTAINER" sh -c "mongorestore --archive=/tmp/restore_backup.archive --gzip --drop --db ${DB_NAME}"; then
    echo "Database restored successfully from ${LATEST_BACKUP_FILE}."
else
    echo "ERROR: Database restore failed. Check container logs for details."
fi

# Clean up temporary backup file inside the Docker container
docker exec "$MONGO_CONTAINER" rm "/tmp/restore_backup.archive"

echo "Restore script finished."