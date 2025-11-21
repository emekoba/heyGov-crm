# HeyGov CRM

Mini CRM application with intelligent AI assistant built with Vue.js and Express.js.

## Features

### 🤖 AI Assistant (Action-Based)

The AI assistant uses an **intent-based action system** where natural language is parsed into structured actions:

**Available Actions:**

- **Add Contacts**: "Met John Doe from Acme Corp at john@acme.com"
- **Update Contacts**: "Change Alex's email to newemail@test.com" or "Update Sarah's company to Microsoft"
- **Delete Contacts**: "Remove John Smith" or "Delete bob@example.com"
- **Query Information**: "What's Alex's email?" or "When did I meet Sarah?"

The AI analyzes your query, determines the intent, extracts parameters, and executes the appropriate action.

### 📋 Contact Management

- **Full CRUD Operations**: Create, read, update, and delete contacts
- **Fields**: Name, Email, Company, Phone
- **Metadata Storage**: User inputs stored in metadata object
- **Optimistic UI Updates**: All changes reflect instantly without page reloads

### 🔍 Search & Filter

- **Real-time Search**: Filter contacts across all fields
- **Company Filter**: View contacts by company
- **Smart Sorting**: Sort by name, email, company, or date added
- **Pagination**: 10 contacts per page with navigation

### ⚡ Smart Query Processing

- **Intelligent Contact Filtering**: For questions, only relevant contacts are sent to AI (reduces tokens)
- **Pattern Detection**: Questions detected without AI (?, "what", "when", "who", etc.)
- **Action Logging**: Server logs show query processing steps

## Architecture

```
User Query → AI Parser (intent + params) → Action Handler → Execute → Update State
```

**Benefits:**

- Single AI call per query
- AI only does parsing, not execution
- Easy to extend with new actions
- Testable and maintainable

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with your OpenAI API key:

```bash
OPENAI_API_KEY=your_key_here
PORT=4001
```

3. Run the application:

```bash
npm run dev
```

This starts:

- Frontend: http://localhost:4000
- Backend API: http://localhost:4001

## Project Structure

```
├── server/
│   ├── index.js          # Express server & routes
│   ├── assistant.js      # Action handlers & execution logic
│   ├── ai.js            # OpenAI API integration
│   └── constants.js     # Configuration & action definitions
├── src/
│   ├── App.vue          # Main Vue component
│   ├── constants.js     # Frontend constants
│   └── style.css        # Styling
└── README.md
```

## Usage Examples

### AI Assistant

**Add contacts:**

- "Had a call with Alex Smith at alex@heygov.com"
- "Met Sarah Jones from Microsoft and Bob Lee from Google"

**Update contacts:**

- "Update Alex's email to newemail@test.com"
- "Change Sarah's company to Amazon"

**Delete contacts:**

- "Remove John Smith"
- "Delete bob@example.com"

**Query information:**

- "What's Alex's email?"
- "When did I meet Sarah?"

### Manual Operations

- Click **Edit** button to modify contact details
- Click **Delete** button to remove contacts
- Use the form to add contacts manually
- Search bar filters in real-time

## Technical Details

- **Frontend**: Vue.js 3 (Composition API), Vite, TypeScript
- **Backend**: Express.js, Node.js, TypeScript
- **AI**: OpenAI GPT-4o-mini
- **Storage**: In-memory (resets on restart)
- **Port Configuration**: Frontend 4000, Backend 4001

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

### Quick Deploy Options

**For Assessors - Easiest Option:**
1. Backend: Deploy to [Render](https://render.com) (free tier)
2. Frontend: Deploy to [Netlify](https://netlify.com) or [Vercel](https://vercel.com)
3. See `DEPLOYMENT.md` for step-by-step guide

**One-Click Deploy:**
- [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/emekoba/heyGov-crm)
- Backend requires separate deployment (see DEPLOYMENT.md)

### Local Testing
```bash
# Clone and install
git clone https://github.com/emekoba/heyGov-crm.git
cd heyGov-crm
npm install

# Configure environment
echo "OPENAI_API_KEY=your_key_here" > .env

# Run application
npm run dev
```

Visit http://localhost:4000 to test the application.
