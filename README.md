# FirstHire.ai v2.0 - AI-Powered Recruiting Platform

FirstHire.ai is an intelligent recruiting platform that uses AI to help you find, evaluate, and hire top talent. Powered by Claude AI for natural language processing and autonomous recruiting agents.

## NEW in v2.0: Authenticity Engine

**AI-powered GitHub profile verification** - Detect fake/inflated skills by analyzing real coding activity.

### How It Works
1. Enter a candidate's GitHub username
2. Add optional job requirements to match against
3. Our AI analyzes their profile, repositories, commits, and activity patterns
4. Get an authenticity score, skill match, and hiring recommendation

### What It Analyzes
- **Repository Quality**: Original vs forked repos, tutorial/practice projects detection
- **Contribution Patterns**: Commit frequency, recent activity, contribution streaks
- **Skill Evidence**: Actual code contributions, language expertise, project complexity
- **Red Flags**: Signs of inflated claims (only forks, no commits, tutorial repos)
- **Green Flags**: Genuine indicators (stars received, open source contributions)

### Output
- Authenticity Score (0-100)
- Skill Match Score (0-100)
- Recommendation: Interview / Screen Further / Pass
- Detailed skill evidence by technology
- Red flags and green flags
- Suggested interview questions

---

## Core Features

### AI-Powered Candidate Search
Use natural language to search for candidates:
- "Senior React engineer in San Francisco with startup experience"
- "Mid-level Python developer, fintech industry"
- "Remote DevOps engineers with Kubernetes skills"

### AI Recruiting Agents
Set up autonomous agents that source candidates 24/7:
- Define search criteria (seniority, location, skills, industry)
- Configure run intervals and target counts
- Auto-add matched candidates to your shortlists

### Team Collaboration
Work together with your hiring team:
- Create teams and invite members via email
- Role-based access (Admin and Viewer roles)
- Share shortlists across your organization
- Comment on candidate profiles

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

---

## Tech Stack

- **Frontend**: React + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: Claude Sonnet 4.5 via Emergent LLM
- **APIs**: GitHub API for profile analysis

## API Endpoints

### Authenticity Engine (NEW in v2.0)
- `POST /api/verify-candidate` - Verify a GitHub profile
- `GET /api/verification-history` - Get verification history
- `GET /api/verification/{id}` - Get specific verification
- `DELETE /api/verification/{id}` - Delete verification
- `GET /api/verification-stats` - Get verification statistics

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

### AI Agents
- `GET /api/agents` - List recruiting agents
- `POST /api/agents` - Create new agent
- `POST /api/agents/{id}/run` - Trigger agent run

### Teams
- `GET /api/teams` - List user's teams
- `POST /api/teams` - Create new team
- `POST /api/teams/{id}/invite` - Invite member

---

## Environment Variables

```
# Backend (.env)
MONGO_URL=mongodb://localhost:27017
DB_NAME=firsthire
EMERGENT_LLM_KEY=your_key_here
GITHUB_TOKEN=optional_for_higher_rate_limits

# Frontend (.env)
REACT_APP_BACKEND_URL=http://localhost:8001
```

## License

© 2026 FirstHire.ai. All rights reserved.
