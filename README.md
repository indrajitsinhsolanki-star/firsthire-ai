# FirstHire.ai - AI-Powered Recruiting Platform

FirstHire.ai is an intelligent recruiting platform that uses AI to help you find, evaluate, and hire top talent. Powered by Claude AI for natural language processing and autonomous recruiting agents.

## Features

### AI-Powered Candidate Search
Use natural language to search for candidates. Our AI understands queries like:
- "Senior React engineer in San Francisco with startup experience"
- "Mid-level Python developer, fintech industry"
- "Remote DevOps engineers with Kubernetes skills"

### AI Recruiting Agents
Set up autonomous agents that source candidates 24/7:
- Define search criteria (seniority, location, skills, industry)
- Configure run intervals and target counts
- Auto-add matched candidates to your shortlists
- Track agent performance and run history

### Team Collaboration
Work together with your hiring team:
- Create teams and invite members via email
- Role-based access (Admin and Viewer roles)
- Share shortlists across your organization
- Comment on candidate profiles
- Track candidate pipeline stages

### AI-Generated Outreach
Let AI craft personalized outreach emails:
- Initial contact emails
- Follow-up sequences
- Professional, warm messaging

### Talent Insights
Visualize your talent pool with analytics:
- Skills distribution charts
- Location breakdown
- Seniority level analysis

## Tech Stack

- **Frontend**: React + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: Claude Sonnet 4.5 via Emergent LLM

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/firsthire-ai.git
cd firsthire-ai
```

2. Install frontend dependencies:
```bash
cd frontend
yarn install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

4. Set up environment variables:

**Backend (.env)**:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=firsthire
EMERGENT_LLM_KEY=your_key_here
```

**Frontend (.env)**:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

5. Start the services:
```bash
# Backend
cd backend
uvicorn server:app --reload --port 8001

# Frontend
cd frontend
yarn start
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user

### Candidates
- `GET /api/candidates` - List all candidates
- `POST /api/candidates/search` - AI-powered search
- `POST /api/candidates/{id}/summary` - Generate AI summary

### Shortlists
- `GET /api/shortlists` - List user's shortlists
- `POST /api/shortlists` - Create new shortlist
- `POST /api/shortlists/{id}/share` - Share with team
- `GET /api/shortlists/{id}/candidates` - Get shortlist candidates

### AI Agents
- `GET /api/agents` - List recruiting agents
- `POST /api/agents` - Create new agent
- `POST /api/agents/{id}/run` - Trigger agent run
- `PATCH /api/agents/{id}/status` - Update agent status

### Teams
- `GET /api/teams` - List user's teams
- `POST /api/teams` - Create new team
- `POST /api/teams/{id}/invite` - Invite member

## License

© 2026 FirstHire.ai. All rights reserved.
