# FirstHire.ai - AI Recruiting Platform PRD

## Original Problem Statement
Existing TalentGPT AI recruiting platform rebranded to FirstHire.ai. Built with React + Tailwind CSS + FastAPI + MongoDB. Features: AI-powered search, candidate cards, shortlists, outreach, insights dashboard, AI recruiting agents, and team collaboration.

## Architecture
- **Frontend**: React (Create React App) + Tailwind CSS (Dark theme)
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **AI**: Claude Sonnet 4.5 via Emergent LLM Key

## User Personas
1. **Recruiter** - Primary user who searches candidates, creates shortlists, sends outreach
2. **Hiring Manager** - Team member with Admin role, manages team and reviews candidates
3. **Team Viewer** - Team member with Viewer role, can view shortlists and comment

## Core Requirements (Static)
- [x] AI-powered natural language candidate search
- [x] Candidate profiles with match scoring
- [x] Shortlist creation and management
- [x] AI-generated outreach emails
- [x] Talent insights dashboard
- [x] User authentication (register/login)

## Implemented Features (Jan 2026)
- [x] **AI Recruiting Agents**: Autonomous background sourcing agents
  - Create agents with search criteria (seniority, location, skills, industry)
  - Set run interval and target count
  - Auto-add candidates to specified shortlist
  - View agent run history and status
- [x] **Team Collaboration**: 
  - Create teams
  - Invite members via email (Admin/Viewer roles)
  - Share shortlists with teams
  - Add comments on candidate cards
- [x] **AI Integration**: Claude Sonnet 4.5 for:
  - Natural language search query parsing
  - Candidate summary generation
  - Outreach email generation (FirstHire.ai branded)
- [x] **Rebranding to FirstHire.ai**:
  - App title and browser tab
  - Logo text and navbar brand
  - All page titles and headings
  - Email templates with FirstHire.ai signature
  - Loading screens and empty states
  - Footer copyright (© 2026 FirstHire.ai)
  - Meta tags and SEO description
  - README documentation

## API Endpoints
### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Candidates
- GET /api/candidates
- POST /api/candidates/search
- POST /api/candidates/{id}/summary

### Shortlists
- GET/POST /api/shortlists
- DELETE /api/shortlists/{id}
- POST /api/shortlists/{id}/share
- GET/POST /api/shortlists/{id}/candidates
- PATCH /api/shortlist-candidates/{id}/stage
- DELETE /api/shortlist-candidates/{id}

### Comments
- POST /api/shortlist-candidates/{id}/comments
- DELETE /api/comments/{id}

### Teams
- GET/POST /api/teams
- GET /api/teams/{id}/members
- POST /api/teams/{id}/invite
- POST /api/teams/accept-invite
- DELETE /api/teams/{id}/members/{member_id}

### AI Agents
- GET/POST /api/agents
- POST /api/agents/{id}/run
- PATCH /api/agents/{id}/status
- DELETE /api/agents/{id}
- GET /api/agents/{id}/runs

### Outreach
- GET/POST /api/outreach
- POST /api/outreach/{id}/send

### Insights
- GET /api/insights

## Prioritized Backlog
### P0 (Complete)
- [x] AI Search with Claude Sonnet 4.5
- [x] Team collaboration
- [x] AI Recruiting Agents
- [x] Comments on candidates
- [x] Rebrand to FirstHire.ai
- [x] Expanded candidate database (71 candidates)
- [x] Flexible search matching (always shows results)

### P1 (Future)
- [ ] Real email sending (currently simulated)
- [ ] Scheduled agent runs (currently manual trigger)
- [ ] Accept team invite UI flow

### P2 (Enhancement)
- [ ] CSV export of candidates
- [ ] API access for integrations
- [ ] Advanced analytics dashboard
- [ ] Candidate comparison view

## Test Results
- Backend: 95% (20/21 tests passing)
- Frontend: 100% functionality
- AI Integration: 100% working
- Overall: 98% success rate
