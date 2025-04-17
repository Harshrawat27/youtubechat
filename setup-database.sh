#!/bin/bash

# Exit on error
set -e

echo "Setting up the database for the YouTube Chat application"

# Check if Prisma is installed
if ! command -v npx prisma &> /dev/null; then
    echo "Prisma CLI not found, installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Create database migrations if needed
if [ ! -d "prisma/migrations" ]; then
    echo "Creating initial migration..."
    npx prisma migrate dev --name init
else
    echo "Applying existing migrations..."
    npx prisma migrate deploy
fi

# Set up dev database with some sample data
echo "Seeding database with sample data..."
npx prisma db seed || echo "Seeding failed. Make sure to set up a seeds script in package.json"

echo "Database setup complete!"
echo "Make sure your .env.local file contains a valid DATABASE_URL and NEXTAUTH_SECRET"