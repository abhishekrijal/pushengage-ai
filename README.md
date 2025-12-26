# PushEngage AI

A modern chat-based application for generating push notification content using AI.

## Features

- 🤖 AI-powered push notification generation using Google Gemini
- 💬 Chat-like interface with context awareness
- 📱 Real-time notification preview (Chrome & Mobile)
- 🎯 Multiple notification options selection
- 🔗 Follow-up form for URL and image configuration
- 📤 Direct PushEngage API integration for sending notifications
- 💾 Save drafts before sending
- 📝 Hardcoded guidelines for creating effective notifications
- ⚡ Built with Bun, Next.js, and TanStack AI
- 🎨 Modern UI with Tailwind CSS and dark mode

## Getting Started

1. Install dependencies:
```bash
bun install
```

2. Set up environment variables:
```bash
# Create .env file and add your API keys
cat > .env << EOF
GEMINI_API_KEY=your_gemini_api_key_here
PUSHENGAGE_SITE_ID=your_pushengage_site_id
PUSHENGAGE_API_KEY=your_pushengage_api_key
BANANA_API_KEY=your_banana_api_key_here
BANANA_MODEL_KEY=stable-diffusion-v1-5
EOF
```

- Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Get your PushEngage credentials from [PushEngage Dashboard](https://www.pushengage.com/api/rest-api/getting-started)
  - Site ID: Found in Site Settings » Site Details
  - API Key: Generated in Site Settings » Site Details
- Get your Banana.dev API key from [Banana.dev](https://www.banana.dev/) for AI image generation

3. Run the development server:
```bash
bun run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 14 (App Router)
- **AI**: TanStack AI + Google Gemini (via @tanstack/ai-gemini)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

