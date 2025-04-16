# YouTube Video Chat App

A Next.js 15 application that allows users to chat with YouTube videos. Features accurate timestamps via OpenAI's Whisper transcription and social media content generation.

## Features

- **Video Chat**: Ask questions about specific points in videos and get AI answers with precise timestamps
- **Accurate Transcription**: Uses OpenAI's Whisper model for high-quality transcription with precise timestamps
- **Social Media Generation**: Create Twitter posts and threads from video content
- **General AI Chat**: Chat with the AI assistant for general questions
- **Dark Mode UI**: Beautiful dark interface with primary color #8975EA

## Requirements

Before running this application, make sure you have the following installed:

- Node.js 18+ and npm/yarn
- Python 3.7+
- FFmpeg
- yt-dlp

These tools are required for downloading and processing YouTube videos for transcription.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/youtube-chat-app.git
   cd youtube-chat-app
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Install the required system dependencies:

   ```bash
   # Make the install script executable
   chmod +x install_requirements.sh

   # Run the install script
   ./install_requirements.sh
   ```

4. Create a `.env.local` file with your OpenAI API key:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

5. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Access the application at http://localhost:3000

## How It Works

1. **Video Processing**: When a user enters a YouTube video URL, the app downloads the video's audio, transcribes it using OpenAI's Whisper model, and stores the transcript with precise timestamps.

2. **Chat Interface**: Users can ask questions about the video content, and the AI will respond with relevant information and timestamps.

3. **Timestamp Navigation**: Users can click on timestamps to navigate directly to that point in the video.

4. **Social Content Generation**: Users can request Twitter posts or threads summarizing the video content.

## Technical Details

- **Next.js 15**: Modern React framework with app router
- **TypeScript**: For type safety and better development experience
- **Tailwind CSS**: For styling with custom color scheme
- **OpenAI API**: For transcription (Whisper) and chat (GPT-4o)
- **yt-dlp**: For reliable YouTube video downloading
- **FFmpeg**: For audio extraction

## Deployment Notes

When deploying this application, ensure:

1. The server has sufficient disk space for temporary video/audio storage
2. FFmpeg and yt-dlp are properly installed
3. Environment variables are set correctly
4. Temporary directory permissions are properly configured

## License

MIT
