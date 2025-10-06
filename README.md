# Conversation Graph UI

A Vue 3 application that visualizes LLM conversations as a tree structure instead of linear chat. Create branches at any point to explore multiple conversation paths.

## Features

- **Tree-based conversations**: Branch conversations at any point
- **Visual graph layout**: Top-to-bottom tree with horizontal branching
- **OpenAI integration**: Direct API calls to GPT models
- **Persistent storage**: Conversations saved to localStorage
- **Auto-generated titles**: AI-generated conversation titles
- **Dark theme**: Blueprint-style grid background

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd node-conversation-ui
```

2. Install dependencies:

```bash
npm install
```

3. Configure OpenAI API key:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API key:

```env
VITE_OPENAI_API_KEY=sk-proj-your_key_here 
VITE_OPENAI_MODEL=gpt-4o-mini # OPTIONAL
VITE_OPENAI_TEMPERATURE=0.7 # OPTIONAL
VITE_OPENAI_MAX_TOKENS=1000 # OPTIONAL
```

## Usage

Start the development server:

```bash
npm run dev
```

Open your browser at `http://localhost:5173`

## Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter
```

## How to Use

1. Click "New Conversation" from the home page
2. Edit the system prompt (optional)
3. Add user prompts by clicking "Branch: User Prompt"
4. Generate LLM responses
5. Branch from any LLM response to explore different conversation paths

## Warning

⚠️ This implementation makes **client-side** API calls to OpenAI, exposing your API key in the browser. **Only use for local development/testing.**

For production, implement a backend proxy to secure your API key.

## License

MIT
