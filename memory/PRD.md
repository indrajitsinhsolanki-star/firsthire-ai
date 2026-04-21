# FirstHire.ai v2.0 - AI Recruiting Platform PRD

## Original Problem Statement
FirstHire.ai v2.0 for 8-day AI challenge. Added AUTHENTICITY ENGINE as flagship feature - AI-powered GitHub profile verification to detect fake/inflated skills.

## Architecture
- **Frontend**: React (Create React App) + Tailwind CSS (Dark theme)
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **AI**: Claude Sonnet 4.5 via Emergent LLM Key
- **External APIs**: GitHub API for profile analysis

## User Personas
1. **Recruiter** - Primary user who searches candidates, creates shortlists, verifies candidates
2. **Hiring Manager** - Team member with Admin role, reviews verification reports
3. **Team Viewer** - Team member with Viewer role, can view shortlists and verifications

## Core Requirements (Static)
- [x] AI-powered natural language candidate search
- [x] Candidate profiles with match scoring
- [x] Shortlist creation and management
- [x] AI-generated outreach emails
- [x] Talent insights dashboard
- [x] User authentication (register/login)

## Implemented Features (Jan 2026)

### v2.0 - Authenticity Engine (NEW)
- [x] **GitHub Profile Verification**
  - Fetch GitHub user profile, repositories, activity
  - Analyze with Claude Sonnet 4.5 AI
  - Calculate authenticity score (0-100)
  - Calculate skill match score (0-100)
  - Provide recommendation (Interview/Screen Further/Pass)
  - Detect red flags (forks, tutorial repos, inactivity)
  - Highlight green flags (stars, original work, contributions)
  - Generate interview questions
  - List skill evidence with specific examples
- [x] **Verification History**
  - Store all verifications in database
  - View past verifications
  - Quick access from verify page
- [x] **UI Components**
  - VerifyCandidatePage with input form
  - Score gauges with color coding
  - Expandable sections for details
  - Example profile buttons for demo

### v1.0 Features
- [x] AI Recruiting Agents
- [x] Team Collaboration
- [x] Search with flexible matching
- [x] 71 diverse candidate database

## API Endpoints

### Authenticity Engine (NEW)
- POST /api/verify-candidate
- GET /api/verification-history
- GET /api/verification/{id}
- DELETE /api/verification/{id}
- GET /api/verification-stats

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
- [x] Flexible search matching
- [x] **Authenticity Engine** (v2.0 flagship feature)

### P1 (Future)
- [ ] Real email sending (currently simulated)
- [ ] Scheduled agent runs (currently manual trigger)
- [ ] Accept team invite UI flow
- [ ] GitHub OAuth for candidates to share their own profiles
- [ ] PDF export for verification reports

### P2 (Enhancement)
- [ ] CSV export of candidates
- [ ] API access for integrations
- [ ] Advanced analytics dashboard
- [ ] Candidate comparison view
- [ ] Bulk verification upload

## Test Results (v2.0)
- Backend: 100% (30/30 tests passing)
- Frontend: 100% functionality
- AI Integration: 100% (Claude + GitHub API)
- Authenticity Engine: 100% working
- Overall: 100% success rate
