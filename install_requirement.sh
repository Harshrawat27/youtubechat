#!/bin/bash

# Exit on error
set -e

echo "Installing required tools for YouTube video transcription"

# Check if running on Ubuntu/Debian
if command -v apt-get &> /dev/null; then
    echo "Detected Debian/Ubuntu system"
    sudo apt-get update
    # Install Python and pip
    sudo apt-get install -y python3 python3-pip ffmpeg
    # Install yt-dlp
    sudo pip3 install yt-dlp
# Check if running on CentOS/RHEL/Fedora
elif command -v dnf &> /dev/null; then
    echo "Detected RHEL/CentOS/Fedora system"
    sudo dnf install -y python3 python3-pip ffmpeg
    sudo pip3 install yt-dlp
# Check for macOS
elif command -v brew &> /dev/null; then
    echo "Detected macOS system"
    brew install python3 ffmpeg
    pip3 install yt-dlp
else
    echo "Unsupported operating system. Please install manually:"
    echo "1. Install Python 3"
    echo "2. Install FFmpeg"
    echo "3. Install yt-dlp: pip3 install yt-dlp"
    exit 1
fi

# Create tmp directory
mkdir -p tmp
chmod 755 tmp

echo "Installation complete!"
echo "Make sure your .env.local file contains a valid OPENAI_API_KEY"