from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage
import re
import secrets
import hashlib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM API Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    full_name: str
    plan: str = "Free"
    searches_used: int = 0
    searches_limit: int = 5
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Candidate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    title: str
    company: str
    location: str
    skills: List[str] = []
    years_exp: int = 0
    seniority: str = "Mid"
    summary: Optional[str] = None
    email: str
    linkedin_url: Optional[str] = None
    industry: Optional[str] = None
    availability: str = "Active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Team(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    owner_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TeamMember(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    team_id: str
    user_id: Optional[str] = None
    role: str = "Viewer"  # Admin or Viewer
    invited_email: Optional[str] = None
    invite_token: Optional[str] = None
    status: str = "pending"  # pending or active
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Shortlist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    team_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    is_shared: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ShortlistCandidate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shortlist_id: str
    candidate_id: str
    stage: str = "Sourced"
    notes: Optional[str] = None
    added_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shortlist_candidate_id: str
    user_id: str
    user_name: str
    text: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OutreachSequence(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    candidate_id: str
    status: str = "Not Started"
    email_1_sent_at: Optional[str] = None
    email_1_content: Optional[str] = None
    email_2_sent_at: Optional[str] = None
    email_2_content: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RecruitingAgent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    search_criteria: Dict[str, Any]
    status: str = "active"  # active, paused, completed
    candidates_found: int = 0
    last_run: Optional[str] = None
    run_interval_hours: int = 24
    target_count: int = 10
    shortlist_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AgentRun(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str
    candidates_found: int = 0
    status: str = "running"
    log: List[str] = []
    started_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None

# ==================== REQUEST MODELS ====================

class SearchQuery(BaseModel):
    query: str

class CreateShortlist(BaseModel):
    name: str
    description: Optional[str] = None
    team_id: Optional[str] = None

class AddToShortlist(BaseModel):
    shortlist_id: str
    candidate_id: str

class UpdateStage(BaseModel):
    stage: str

class CreateComment(BaseModel):
    text: str

class CreateOutreach(BaseModel):
    candidate_id: str

class SendEmail(BaseModel):
    email_type: str = "initial"

class CreateAgent(BaseModel):
    name: str
    search_criteria: Dict[str, Any]
    run_interval_hours: int = 24
    target_count: int = 10
    shortlist_id: Optional[str] = None

class InviteMember(BaseModel):
    email: str
    role: str = "Viewer"

class CreateTeam(BaseModel):
    name: str

class ShareShortlist(BaseModel):
    team_id: str

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

async def get_claude_chat(system_message: str) -> LlmChat:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=str(uuid.uuid4()),
        system_message=system_message
    )
    chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
    return chat

async def parse_search_query_ai(query: str) -> Dict[str, Any]:
    """Use Claude to parse natural language search query into filters"""
    try:
        chat = await get_claude_chat(
            """You are a recruiting search parser. Parse the user's natural language query into structured filters.
            Return ONLY valid JSON with these possible fields:
            - seniority: "Junior", "Mid", "Senior", "Director", "VP", "C-Suite"
            - location: city name or "Remote"
            - skills: array of skill names
            - industry: industry name
            - experience_years: { "min": number, "max": number }
            
            Be concise and only include fields that are explicitly mentioned or strongly implied."""
        )
        
        response = await chat.send_message(UserMessage(text=f"Parse this recruiting search query: {query}"))
        
        # Extract JSON from response
        json_match = re.search(r'\{[^{}]*\}', response, re.DOTALL)
        if json_match:
            import json
            return json.loads(json_match.group())
        return {}
    except Exception as e:
        logger.error(f"Error parsing query with AI: {e}")
        return parse_query_locally(query)

def parse_query_locally(query: str) -> Dict[str, Any]:
    """Fallback local parser"""
    filters = {"skills": []}
    query_lower = query.lower()
    
    seniorities = {'intern': 'Junior', 'junior': 'Junior', 'mid': 'Mid', 'senior': 'Senior', 
                   'lead': 'Senior', 'director': 'Director', 'vp': 'VP', 'c-suite': 'C-Suite'}
    for key, val in seniorities.items():
        if key in query_lower:
            filters['seniority'] = val
            break
    
    locations = ['NYC', 'New York', 'San Francisco', 'SF', 'Los Angeles', 'Seattle', 'Boston', 'Remote', 'Toronto', 'Dublin']
    for loc in locations:
        if loc.lower() in query_lower:
            filters['location'] = loc
            break
    
    skills = ['react', 'python', 'typescript', 'node', 'aws', 'java', 'go', 'rust', 'javascript', 
              'kubernetes', 'docker', 'graphql', 'sql', 'machine learning', 'ai']
    for skill in skills:
        if skill in query_lower:
            filters['skills'].append(skill.title())
    
    industries = ['fintech', 'saas', 'ai', 'media', 'ecommerce', 'startup', 'enterprise', 'cloud', 'tech']
    for ind in industries:
        if ind in query_lower:
            filters['industry'] = ind.title()
            break
    
    return filters

async def generate_summary_ai(candidate: Dict) -> str:
    """Generate AI summary for a candidate"""
    try:
        chat = await get_claude_chat(
            "You are a recruiting assistant. Generate a brief, professional 2-sentence summary of a candidate's profile highlighting their key strengths and experience."
        )
        
        prompt = f"""Summarize this candidate:
        Name: {candidate.get('name')}
        Title: {candidate.get('title')}
        Company: {candidate.get('company')}
        Skills: {', '.join(candidate.get('skills', []))}
        Experience: {candidate.get('years_exp')} years
        Seniority: {candidate.get('seniority')}
        Industry: {candidate.get('industry')}"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        return response
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        return f"{candidate.get('name')} is a {candidate.get('seniority')} {candidate.get('title')} at {candidate.get('company')}."

async def generate_email_ai(candidate: Dict, email_type: str = "initial") -> str:
    """Generate AI outreach email"""
    try:
        chat = await get_claude_chat(
            "You are a recruiting professional from FirstHire.ai. Write personalized, professional outreach emails that are warm but not too casual. Keep emails concise (under 150 words). Sign off with 'Best regards' and include 'FirstHire.ai Team' in the signature."
        )
        
        if email_type == "initial":
            prompt = f"""Write an initial outreach email to recruit this candidate on behalf of FirstHire.ai:
            Name: {candidate.get('name')}
            Title: {candidate.get('title')}
            Company: {candidate.get('company')}
            Skills: {', '.join(candidate.get('skills', [])[:3])}"""
        else:
            prompt = f"""Write a follow-up email to {candidate.get('name')} who hasn't responded to our initial outreach from FirstHire.ai."""
        
        response = await chat.send_message(UserMessage(text=prompt))
        return response
    except Exception as e:
        logger.error(f"Error generating email: {e}")
        return f"Hi {candidate.get('name')},\n\nI'm impressed by your background. I think there's a great opportunity that aligns with your experience.\n\nLet's connect!\n\nBest regards,\nFirstHire.ai Team"

def calculate_match_score(candidate: Dict, filters: Dict) -> int:
    """Calculate match score between candidate and search filters"""
    score = 0
    max_score = 0
    
    if filters.get('seniority'):
        max_score += 20
        if candidate.get('seniority', '').lower() == filters['seniority'].lower():
            score += 20
    
    if filters.get('location'):
        max_score += 20
        if filters['location'].lower() in candidate.get('location', '').lower():
            score += 20
    
    if filters.get('skills'):
        max_score += 30
        candidate_skills = [s.lower() for s in candidate.get('skills', [])]
        matched = sum(1 for s in filters['skills'] if s.lower() in candidate_skills)
        if filters['skills']:
            score += int((matched / len(filters['skills'])) * 30)
    
    if filters.get('industry'):
        max_score += 10
        if filters['industry'].lower() == candidate.get('industry', '').lower():
            score += 10
    
    if filters.get('experience_years'):
        max_score += 20
        years = candidate.get('years_exp', 0)
        if filters['experience_years'].get('min') and years >= filters['experience_years']['min']:
            score += 10
        if filters['experience_years'].get('max') and years <= filters['experience_years']['max']:
            score += 10
    
    return int((score / max_score) * 100) if max_score > 0 else 50

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=data.email,
        full_name=data.full_name
    )
    user_dict = user.model_dump()
    user_dict['password_hash'] = hash_password(data.password)
    
    await db.users.insert_one(user_dict)
    return {"id": user.id, "email": user.email, "full_name": user.full_name}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or user.get('password_hash') != hash_password(data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = secrets.token_urlsafe(32)
    await db.sessions.insert_one({"token": token, "user_id": user['id'], "created_at": datetime.now(timezone.utc).isoformat()})
    
    return {"token": token, "user": {"id": user['id'], "email": user['email'], "full_name": user['full_name'], "plan": user.get('plan', 'Free')}}

@api_router.get("/auth/me")
async def get_current_user(token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": session['user_id']}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

# ==================== CANDIDATE ROUTES ====================

@api_router.get("/candidates", response_model=List[Candidate])
async def get_candidates():
    candidates = await db.candidates.find({}, {"_id": 0}).to_list(1000)
    return candidates

@api_router.post("/candidates/search")
async def search_candidates(data: SearchQuery, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    filters = await parse_search_query_ai(data.query)
    
    query = {}
    if filters.get('seniority'):
        query['seniority'] = filters['seniority']
    if filters.get('location'):
        query['location'] = {"$regex": filters['location'], "$options": "i"}
    if filters.get('industry'):
        query['industry'] = {"$regex": filters['industry'], "$options": "i"}
    
    candidates = await db.candidates.find(query, {"_id": 0}).to_list(100)
    
    # Filter by skills if specified
    if filters.get('skills'):
        candidates = [c for c in candidates if any(
            skill.lower() in [s.lower() for s in c.get('skills', [])]
            for skill in filters['skills']
        )]
    
    # Calculate match scores
    for candidate in candidates:
        candidate['match_score'] = calculate_match_score(candidate, filters)
    
    # Sort by match score
    candidates.sort(key=lambda x: x.get('match_score', 0), reverse=True)
    
    return {"candidates": candidates, "filters": filters}

@api_router.post("/candidates/{candidate_id}/summary")
async def get_candidate_summary(candidate_id: str, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    candidate = await db.candidates.find_one({"id": candidate_id}, {"_id": 0})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    summary = await generate_summary_ai(candidate)
    return {"summary": summary}

# ==================== SHORTLIST ROUTES ====================

@api_router.get("/shortlists")
async def get_shortlists(token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = session['user_id']
    
    # Get user's own shortlists
    own_lists = await db.shortlists.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    # Get team shortlists
    team_members = await db.team_members.find({"user_id": user_id, "status": "active"}, {"_id": 0}).to_list(100)
    team_ids = [m['team_id'] for m in team_members]
    
    team_lists = []
    if team_ids:
        team_lists = await db.shortlists.find({"team_id": {"$in": team_ids}, "is_shared": True}, {"_id": 0}).to_list(100)
    
    all_lists = own_lists + [l for l in team_lists if l['user_id'] != user_id]
    
    return all_lists

@api_router.post("/shortlists")
async def create_shortlist(data: CreateShortlist, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    shortlist = Shortlist(
        user_id=session['user_id'],
        name=data.name,
        description=data.description,
        team_id=data.team_id,
        is_shared=data.team_id is not None
    )
    
    await db.shortlists.insert_one(shortlist.model_dump())
    return shortlist.model_dump()

@api_router.delete("/shortlists/{shortlist_id}")
async def delete_shortlist(shortlist_id: str, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    shortlist = await db.shortlists.find_one({"id": shortlist_id})
    if not shortlist or shortlist['user_id'] != session['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.shortlists.delete_one({"id": shortlist_id})
    await db.shortlist_candidates.delete_many({"shortlist_id": shortlist_id})
    
    return {"success": True}

@api_router.post("/shortlists/{shortlist_id}/share")
async def share_shortlist(shortlist_id: str, data: ShareShortlist, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    shortlist = await db.shortlists.find_one({"id": shortlist_id})
    if not shortlist or shortlist['user_id'] != session['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.shortlists.update_one(
        {"id": shortlist_id},
        {"$set": {"team_id": data.team_id, "is_shared": True}}
    )
    
    return {"success": True}

@api_router.get("/shortlists/{shortlist_id}/candidates")
async def get_shortlist_candidates(shortlist_id: str, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    items = await db.shortlist_candidates.find({"shortlist_id": shortlist_id}, {"_id": 0}).to_list(100)
    
    # Get candidate details
    for item in items:
        candidate = await db.candidates.find_one({"id": item['candidate_id']}, {"_id": 0})
        if candidate:
            item['candidate'] = candidate
        
        # Get comments
        comments = await db.comments.find({"shortlist_candidate_id": item['id']}, {"_id": 0}).to_list(100)
        item['comments'] = comments
    
    return items

@api_router.post("/shortlists/{shortlist_id}/candidates")
async def add_to_shortlist(shortlist_id: str, data: AddToShortlist, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Check if already exists
    existing = await db.shortlist_candidates.find_one({
        "shortlist_id": shortlist_id,
        "candidate_id": data.candidate_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Candidate already in shortlist")
    
    item = ShortlistCandidate(
        shortlist_id=shortlist_id,
        candidate_id=data.candidate_id
    )
    
    await db.shortlist_candidates.insert_one(item.model_dump())
    return item.model_dump()

@api_router.patch("/shortlist-candidates/{item_id}/stage")
async def update_candidate_stage(item_id: str, data: UpdateStage, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    await db.shortlist_candidates.update_one(
        {"id": item_id},
        {"$set": {"stage": data.stage}}
    )
    
    return {"success": True}

@api_router.delete("/shortlist-candidates/{item_id}")
async def remove_from_shortlist(item_id: str, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    await db.shortlist_candidates.delete_one({"id": item_id})
    await db.comments.delete_many({"shortlist_candidate_id": item_id})
    
    return {"success": True}

# ==================== COMMENTS ROUTES ====================

@api_router.post("/shortlist-candidates/{item_id}/comments")
async def add_comment(item_id: str, data: CreateComment, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": session['user_id']}, {"_id": 0})
    
    comment = Comment(
        shortlist_candidate_id=item_id,
        user_id=session['user_id'],
        user_name=user.get('full_name', 'User'),
        text=data.text
    )
    
    await db.comments.insert_one(comment.model_dump())
    return comment.model_dump()

@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    comment = await db.comments.find_one({"id": comment_id})
    if not comment or comment['user_id'] != session['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.comments.delete_one({"id": comment_id})
    return {"success": True}

# ==================== TEAM ROUTES ====================

@api_router.get("/teams")
async def get_teams(token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = session['user_id']
    
    # Teams user owns
    owned = await db.teams.find({"owner_id": user_id}, {"_id": 0}).to_list(100)
    
    # Teams user is member of
    memberships = await db.team_members.find({"user_id": user_id, "status": "active"}, {"_id": 0}).to_list(100)
    member_team_ids = [m['team_id'] for m in memberships]
    
    member_teams = []
    if member_team_ids:
        member_teams = await db.teams.find({"id": {"$in": member_team_ids}}, {"_id": 0}).to_list(100)
    
    all_teams = owned + [t for t in member_teams if t['owner_id'] != user_id]
    
    # Add member count
    for team in all_teams:
        team['member_count'] = await db.team_members.count_documents({"team_id": team['id'], "status": "active"})
        team['is_owner'] = team['owner_id'] == user_id
    
    return all_teams

@api_router.post("/teams")
async def create_team(data: CreateTeam, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    team = Team(
        name=data.name,
        owner_id=session['user_id']
    )
    
    await db.teams.insert_one(team.model_dump())
    
    # Add owner as admin member
    member = TeamMember(
        team_id=team.id,
        user_id=session['user_id'],
        role="Admin",
        status="active"
    )
    await db.team_members.insert_one(member.model_dump())
    
    return team.model_dump()

@api_router.get("/teams/{team_id}/members")
async def get_team_members(team_id: str, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    members = await db.team_members.find({"team_id": team_id}, {"_id": 0}).to_list(100)
    
    # Get user details
    for member in members:
        if member['user_id']:
            user = await db.users.find_one({"id": member['user_id']}, {"_id": 0, "password_hash": 0})
            if user:
                member['user'] = user
    
    return members

@api_router.post("/teams/{team_id}/invite")
async def invite_team_member(team_id: str, data: InviteMember, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Check if user is admin
    team = await db.teams.find_one({"id": team_id})
    membership = await db.team_members.find_one({"team_id": team_id, "user_id": session['user_id']})
    
    if not team or (team['owner_id'] != session['user_id'] and (not membership or membership['role'] != 'Admin')):
        raise HTTPException(status_code=403, detail="Only admins can invite members")
    
    # Check if already invited/member
    existing = await db.team_members.find_one({"team_id": team_id, "invited_email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Already invited")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": data.email}, {"_id": 0})
    
    invite_token = secrets.token_urlsafe(32)
    
    member = TeamMember(
        team_id=team_id,
        user_id=existing_user['id'] if existing_user else None,
        role=data.role,
        invited_email=data.email,
        invite_token=invite_token,
        status="pending"
    )
    
    await db.team_members.insert_one(member.model_dump())
    
    return {"invite_token": invite_token, "email": data.email}

@api_router.post("/teams/accept-invite")
async def accept_team_invite(invite_token: str, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    member = await db.team_members.find_one({"invite_token": invite_token})
    if not member:
        raise HTTPException(status_code=404, detail="Invalid invite")
    
    user = await db.users.find_one({"id": session['user_id']}, {"_id": 0})
    
    if member['invited_email'] != user['email']:
        raise HTTPException(status_code=403, detail="Invite is for different email")
    
    await db.team_members.update_one(
        {"invite_token": invite_token},
        {"$set": {"user_id": session['user_id'], "status": "active", "invite_token": None}}
    )
    
    return {"success": True}

@api_router.delete("/teams/{team_id}/members/{member_id}")
async def remove_team_member(team_id: str, member_id: str, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    team = await db.teams.find_one({"id": team_id})
    if not team or team['owner_id'] != session['user_id']:
        raise HTTPException(status_code=403, detail="Only owner can remove members")
    
    await db.team_members.delete_one({"id": member_id})
    return {"success": True}

# ==================== OUTREACH ROUTES ====================

@api_router.get("/outreach")
async def get_outreach_sequences(token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    sequences = await db.outreach_sequences.find({"user_id": session['user_id']}, {"_id": 0}).to_list(100)
    
    for seq in sequences:
        candidate = await db.candidates.find_one({"id": seq['candidate_id']}, {"_id": 0})
        if candidate:
            seq['candidate'] = candidate
    
    return sequences

@api_router.post("/outreach")
async def create_outreach(data: CreateOutreach, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Check if already exists
    existing = await db.outreach_sequences.find_one({
        "user_id": session['user_id'],
        "candidate_id": data.candidate_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Outreach sequence already exists")
    
    sequence = OutreachSequence(
        user_id=session['user_id'],
        candidate_id=data.candidate_id
    )
    
    await db.outreach_sequences.insert_one(sequence.model_dump())
    return sequence.model_dump()

@api_router.post("/outreach/{sequence_id}/send")
async def send_outreach_email(sequence_id: str, data: SendEmail, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    sequence = await db.outreach_sequences.find_one({"id": sequence_id, "user_id": session['user_id']})
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")
    
    candidate = await db.candidates.find_one({"id": sequence['candidate_id']}, {"_id": 0})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    email_content = await generate_email_ai(candidate, data.email_type)
    
    if data.email_type == "initial":
        await db.outreach_sequences.update_one(
            {"id": sequence_id},
            {"$set": {
                "email_1_content": email_content,
                "email_1_sent_at": datetime.now(timezone.utc).isoformat(),
                "status": "In Progress"
            }}
        )
    else:
        await db.outreach_sequences.update_one(
            {"id": sequence_id},
            {"$set": {
                "email_2_content": email_content,
                "email_2_sent_at": datetime.now(timezone.utc).isoformat(),
                "status": "Completed"
            }}
        )
    
    return {"email": email_content}

# ==================== RECRUITING AGENTS ROUTES ====================

@api_router.get("/agents")
async def get_agents(token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    agents = await db.recruiting_agents.find({"user_id": session['user_id']}, {"_id": 0}).to_list(100)
    return agents

@api_router.post("/agents")
async def create_agent(data: CreateAgent, token: str, background_tasks: BackgroundTasks):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    agent = RecruitingAgent(
        user_id=session['user_id'],
        name=data.name,
        search_criteria=data.search_criteria,
        run_interval_hours=data.run_interval_hours,
        target_count=data.target_count,
        shortlist_id=data.shortlist_id
    )
    
    await db.recruiting_agents.insert_one(agent.model_dump())
    
    # Start agent run in background
    background_tasks.add_task(run_agent, agent.id)
    
    return agent.model_dump()

@api_router.post("/agents/{agent_id}/run")
async def trigger_agent_run(agent_id: str, token: str, background_tasks: BackgroundTasks):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    agent = await db.recruiting_agents.find_one({"id": agent_id, "user_id": session['user_id']})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    background_tasks.add_task(run_agent, agent_id)
    return {"message": "Agent run started"}

@api_router.patch("/agents/{agent_id}/status")
async def update_agent_status(agent_id: str, status: str, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    if status not in ["active", "paused", "completed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.recruiting_agents.update_one(
        {"id": agent_id, "user_id": session['user_id']},
        {"$set": {"status": status}}
    )
    
    return {"success": True}

@api_router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    await db.recruiting_agents.delete_one({"id": agent_id, "user_id": session['user_id']})
    return {"success": True}

@api_router.get("/agents/{agent_id}/runs")
async def get_agent_runs(agent_id: str, token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    runs = await db.agent_runs.find({"agent_id": agent_id}, {"_id": 0}).sort("started_at", -1).to_list(20)
    return runs

async def run_agent(agent_id: str):
    """Background task to run AI recruiting agent"""
    agent = await db.recruiting_agents.find_one({"id": agent_id})
    if not agent or agent['status'] != 'active':
        return
    
    run = AgentRun(agent_id=agent_id)
    await db.agent_runs.insert_one(run.model_dump())
    
    try:
        # Use AI to find matching candidates
        criteria = agent['search_criteria']
        
        query = {}
        if criteria.get('seniority'):
            query['seniority'] = criteria['seniority']
        if criteria.get('location'):
            query['location'] = {"$regex": criteria['location'], "$options": "i"}
        if criteria.get('industry'):
            query['industry'] = {"$regex": criteria['industry'], "$options": "i"}
        
        candidates = await db.candidates.find(query, {"_id": 0}).to_list(100)
        
        # Filter and score
        scored = []
        for c in candidates:
            score = calculate_match_score(c, criteria)
            if score >= 50:  # Only include good matches
                scored.append((c, score))
        
        scored.sort(key=lambda x: x[1], reverse=True)
        found = scored[:agent['target_count']]
        
        # Add to shortlist if specified
        if agent.get('shortlist_id'):
            for candidate, score in found:
                existing = await db.shortlist_candidates.find_one({
                    "shortlist_id": agent['shortlist_id'],
                    "candidate_id": candidate['id']
                })
                if not existing:
                    item = ShortlistCandidate(
                        shortlist_id=agent['shortlist_id'],
                        candidate_id=candidate['id'],
                        notes=f"Found by AI Agent with {score}% match"
                    )
                    await db.shortlist_candidates.insert_one(item.model_dump())
        
        # Update agent
        await db.recruiting_agents.update_one(
            {"id": agent_id},
            {"$set": {
                "last_run": datetime.now(timezone.utc).isoformat(),
                "candidates_found": agent.get('candidates_found', 0) + len(found)
            }}
        )
        
        # Update run
        await db.agent_runs.update_one(
            {"id": run.id},
            {"$set": {
                "status": "completed",
                "candidates_found": len(found),
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "log": [f"Found {len(found)} candidates matching criteria"]
            }}
        )
        
    except Exception as e:
        logger.error(f"Agent run error: {e}")
        await db.agent_runs.update_one(
            {"id": run.id},
            {"$set": {"status": "failed", "log": [str(e)]}}
        )

# ==================== INSIGHTS ROUTES ====================

@api_router.get("/insights")
async def get_insights(token: str):
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Skills distribution
    candidates = await db.candidates.find({}, {"_id": 0, "skills": 1}).to_list(1000)
    skill_counts = {}
    for c in candidates:
        for skill in c.get('skills', []):
            skill_counts[skill] = skill_counts.get(skill, 0) + 1
    
    top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Location distribution
    location_pipeline = [
        {"$group": {"_id": "$location", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    locations = await db.candidates.aggregate(location_pipeline).to_list(5)
    
    # Seniority distribution
    seniority_pipeline = [
        {"$group": {"_id": "$seniority", "count": {"$sum": 1}}}
    ]
    seniorities = await db.candidates.aggregate(seniority_pipeline).to_list(10)
    
    return {
        "skills": [{"skill": s[0], "count": s[1]} for s in top_skills],
        "locations": [{"name": l["_id"], "value": l["count"]} for l in locations],
        "seniorities": [{"name": s["_id"], "value": s["count"]} for s in seniorities]
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_database():
    """Seed database with mock candidates"""
    # Check if already seeded
    count = await db.candidates.count_documents({})
    if count > 0:
        return {"message": "Database already seeded", "count": count}
    
    mock_candidates = [
        {"name": "Alex Chen", "title": "Senior React Engineer", "company": "Stripe", "location": "San Francisco", "skills": ["React", "TypeScript", "Node.js", "AWS"], "years_exp": 7, "seniority": "Senior", "email": "alex.chen@email.com", "linkedin_url": "https://linkedin.com/in/alexchen", "industry": "FinTech", "availability": "Passive"},
        {"name": "Jordan Smith", "title": "Full Stack Engineer", "company": "Airbnb", "location": "New York", "skills": ["React", "Python", "PostgreSQL", "Docker"], "years_exp": 5, "seniority": "Mid", "email": "jordan.smith@email.com", "linkedin_url": "https://linkedin.com/in/jordansmith", "industry": "Travel", "availability": "Active"},
        {"name": "Morgan Taylor", "title": "Frontend Engineer", "company": "Netflix", "location": "Los Angeles", "skills": ["React", "JavaScript", "CSS", "GraphQL"], "years_exp": 4, "seniority": "Mid", "email": "morgan.taylor@email.com", "linkedin_url": "https://linkedin.com/in/morgantaylor", "industry": "Media", "availability": "Open to Work"},
        {"name": "Casey Johnson", "title": "Backend Engineer", "company": "Amazon", "location": "Seattle", "skills": ["Java", "Python", "AWS", "Kubernetes"], "years_exp": 8, "seniority": "Senior", "email": "casey.johnson@email.com", "linkedin_url": "https://linkedin.com/in/caseyjohnson", "industry": "Cloud", "availability": "Passive"},
        {"name": "Riley Martinez", "title": "DevOps Engineer", "company": "Google", "location": "Mountain View", "skills": ["Kubernetes", "Docker", "AWS", "Terraform"], "years_exp": 6, "seniority": "Senior", "email": "riley.martinez@email.com", "linkedin_url": "https://linkedin.com/in/rileymartinez", "industry": "Tech", "availability": "Passive"},
        {"name": "Taylor Williams", "title": "React Engineer", "company": "Meta", "location": "Menlo Park", "skills": ["React", "TypeScript", "GraphQL", "Testing"], "years_exp": 4, "seniority": "Mid", "email": "taylor.williams@email.com", "linkedin_url": "https://linkedin.com/in/taylorwilliams", "industry": "Social Media", "availability": "Open to Work"},
        {"name": "Blake Rodriguez", "title": "Lead Frontend Engineer", "company": "Uber", "location": "San Francisco", "skills": ["React", "Node.js", "TypeScript", "System Design"], "years_exp": 9, "seniority": "Senior", "email": "blake.rodriguez@email.com", "linkedin_url": "https://linkedin.com/in/blakerodriguez", "industry": "Mobility", "availability": "Passive"},
        {"name": "Jordan Lee", "title": "Full Stack Developer", "company": "GitLab", "location": "Remote", "skills": ["React", "Ruby", "PostgreSQL", "CI/CD"], "years_exp": 5, "seniority": "Mid", "email": "jordan.lee@email.com", "linkedin_url": "https://linkedin.com/in/jordanlee", "industry": "DevOps", "availability": "Open to Work"},
        {"name": "Sam Brown", "title": "Senior Python Engineer", "company": "Databricks", "location": "San Francisco", "skills": ["Python", "Scala", "Spark", "Machine Learning"], "years_exp": 8, "seniority": "Senior", "email": "sam.brown@email.com", "linkedin_url": "https://linkedin.com/in/sambrown", "industry": "Data", "availability": "Passive"},
        {"name": "Quinn Davis", "title": "Product Manager", "company": "Slack", "location": "San Francisco", "skills": ["Product Strategy", "Analytics", "User Research", "Roadmapping"], "years_exp": 6, "seniority": "Senior", "email": "quinn.davis@email.com", "linkedin_url": "https://linkedin.com/in/quinndavis", "industry": "SaaS", "availability": "Open to Work"},
        {"name": "Parker Wilson", "title": "Data Scientist", "company": "Lyft", "location": "San Francisco", "skills": ["Python", "Machine Learning", "SQL", "Statistics"], "years_exp": 5, "seniority": "Mid", "email": "parker.wilson@email.com", "linkedin_url": "https://linkedin.com/in/parkerwilson", "industry": "Mobility", "availability": "Active"},
        {"name": "Drew Miller", "title": "UX/UI Designer", "company": "Figma", "location": "San Francisco", "skills": ["Figma", "UI Design", "User Research", "Prototyping"], "years_exp": 4, "seniority": "Mid", "email": "drew.miller@email.com", "linkedin_url": "https://linkedin.com/in/drewmiller", "industry": "Design", "availability": "Open to Work"},
        {"name": "Cameron Moore", "title": "Senior Software Engineer", "company": "Microsoft", "location": "Seattle", "skills": ["C#", "Azure", "System Architecture", "Cloud"], "years_exp": 10, "seniority": "Senior", "email": "cameron.moore@email.com", "linkedin_url": "https://linkedin.com/in/cameronmoore", "industry": "Tech", "availability": "Passive"},
        {"name": "Avery Garcia", "title": "Tech Lead", "company": "Palantir", "location": "Palo Alto", "skills": ["Java", "System Design", "Leadership", "Architecture"], "years_exp": 9, "seniority": "Senior", "email": "avery.garcia@email.com", "linkedin_url": "https://linkedin.com/in/averygarcia", "industry": "Enterprise Software", "availability": "Passive"},
        {"name": "Dakota Harris", "title": "Junior React Developer", "company": "Shopify", "location": "Toronto", "skills": ["React", "JavaScript", "HTML/CSS", "Git"], "years_exp": 1, "seniority": "Junior", "email": "dakota.harris@email.com", "linkedin_url": "https://linkedin.com/in/dakotaharris", "industry": "E-commerce", "availability": "Active"},
        {"name": "Spencer Clark", "title": "Sales Director", "company": "Salesforce", "location": "San Francisco", "skills": ["Sales Strategy", "Enterprise Sales", "Negotiations", "Team Leadership"], "years_exp": 12, "seniority": "Director", "email": "spencer.clark@email.com", "linkedin_url": "https://linkedin.com/in/spencerclark", "industry": "SaaS", "availability": "Passive"},
        {"name": "Finley White", "title": "Marketing Manager", "company": "HubSpot", "location": "Boston", "skills": ["Content Marketing", "SEO", "Analytics", "Growth"], "years_exp": 5, "seniority": "Mid", "email": "finley.white@email.com", "linkedin_url": "https://linkedin.com/in/finleywhite", "industry": "SaaS", "availability": "Open to Work"},
        {"name": "River Green", "title": "Principal Engineer", "company": "Apple", "location": "Cupertino", "skills": ["System Architecture", "C++", "Leadership", "Innovation"], "years_exp": 15, "seniority": "C-Suite", "email": "river.green@email.com", "linkedin_url": "https://linkedin.com/in/rivergreen", "industry": "Tech", "availability": "Passive"},
        {"name": "Alex Thompson", "title": "Machine Learning Engineer", "company": "OpenAI", "location": "San Francisco", "skills": ["Python", "Machine Learning", "Deep Learning", "PyTorch"], "years_exp": 6, "seniority": "Senior", "email": "alex.thompson@email.com", "linkedin_url": "https://linkedin.com/in/alexthompson", "industry": "AI", "availability": "Passive"},
        {"name": "Alex King", "title": "Full Stack Engineer", "company": "Notion", "location": "San Francisco", "skills": ["React", "TypeScript", "Node.js", "PostgreSQL"], "years_exp": 6, "seniority": "Senior", "email": "alex.king@email.com", "linkedin_url": "https://linkedin.com/in/alexking", "industry": "Productivity", "availability": "Open to Work"},
    ]
    
    for c in mock_candidates:
        candidate = Candidate(**c)
        await db.candidates.insert_one(candidate.model_dump())
    
    return {"message": "Database seeded", "count": len(mock_candidates)}

# ==================== ROOT ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "FirstHire.ai API", "version": "2.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
