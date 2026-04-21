"""
Claude AI Service - Analyzes GitHub profiles for authenticity
"""
import os
import json
import logging
from typing import Dict, Any
from emergentintegrations.llm.chat import LlmChat, UserMessage
import uuid

logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

async def get_claude_chat(system_message: str) -> LlmChat:
    """Initialize Claude chat with system message"""
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=str(uuid.uuid4()),
        system_message=system_message
    )
    chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
    return chat

async def analyze_candidate(github_data: Dict[str, Any], job_requirements: str) -> Dict[str, Any]:
    """
    Analyze a candidate's GitHub profile against job requirements
    Returns authenticity score and detailed analysis
    """
    
    if github_data.get("error"):
        return {
            "error": github_data.get("error"),
            "message": github_data.get("message"),
            "authenticity_score": 0,
            "recommendation": "Unable to Analyze"
        }
    
    # Build substantial projects summary
    projects_summary = ""
    for proj in github_data.get('substantial_projects', [])[:5]:
        projects_summary += f"\n  - {proj['name']}: {proj.get('description', 'No description')} ({proj['language']}, {proj['stars']} stars)"
    
    if not projects_summary:
        projects_summary = "\n  - No substantial original projects found"
    
    # Create analysis prompt
    prompt = f"""You are a senior technical recruiter's AI assistant. Analyze this GitHub profile to assess the candidate's authenticity and skill level.

## GITHUB PROFILE DATA

**Username:** {github_data.get('username')}
**Name:** {github_data.get('name', 'Not provided')}
**Bio:** {github_data.get('bio', 'Not provided')}
**Location:** {github_data.get('location', 'Not provided')}
**Company:** {github_data.get('company', 'Not provided')}
**Account Age:** {github_data.get('account_age_days', 0)} days
**Followers:** {github_data.get('followers', 0)}

**Repository Stats:**
- Total Repositories: {github_data.get('total_repos', 0)}
- Original Repos: {github_data.get('original_repos', 0)}
- Forked Repos: {github_data.get('forked_repos', 0)} ({github_data.get('fork_percentage', 0)}% forks)
- Tutorial/Practice Repos: {github_data.get('tutorial_repos', 0)}
- Total Stars Received: {github_data.get('total_stars_received', 0)}

**Top Languages:** {', '.join(github_data.get('top_languages', ['None detected'])[:5])}

**Recent Activity (last 90 days):**
- Recent Commits: {github_data.get('recent_commits', 0)}
- Recent PRs: {github_data.get('recent_prs', 0)}
- Recent Issues: {github_data.get('recent_issues', 0)}
- Last Active: {github_data.get('last_active', 'Unknown')}

**Notable Projects:**{projects_summary}

---

## JOB REQUIREMENTS

{job_requirements if job_requirements else "General software engineering position - assess overall technical capability"}

---

## ANALYSIS REQUIRED

Provide a comprehensive assessment with the following:

1. **Authenticity Score (0-100):** How genuine is this developer profile?
   - 90-100: Clearly authentic with strong evidence of real work
   - 70-89: Likely authentic with some evidence
   - 50-69: Mixed signals, needs verification
   - 30-49: Several red flags, proceed with caution
   - 0-29: High likelihood of inflated/fake profile

2. **Skill Match Score (0-100):** How well does this candidate match the job requirements?

3. **Skill Evidence:** Specific evidence from their repos/commits that demonstrates competency

4. **Red Flags:** Any concerning patterns (only forks, tutorial repos, no recent activity, etc.)

5. **Green Flags:** Positive indicators (original projects, community engagement, consistent activity)

6. **Hiring Recommendation:** Interview / Screen Further / Pass

7. **Interview Questions:** 3 technical questions to verify their claimed skills

Respond ONLY with valid JSON in this exact format:
{{
  "authenticity_score": 85,
  "skill_match_score": 78,
  "confidence_level": "high",
  "skill_evidence": {{
    "python": "Built [specific project] with [specific features]",
    "javascript": "Contributed to [repo] with [specific work]"
  }},
  "red_flags": [
    "60% of repositories are forks",
    "No commits in last 3 months"
  ],
  "green_flags": [
    "Has original projects with stars",
    "Active in open source community"
  ],
  "recommendation": "Interview",
  "recommendation_reason": "Strong technical foundation with some concerns about recent activity",
  "interview_questions": [
    "Can you walk me through the architecture of [specific project]?",
    "How did you implement [specific feature]?",
    "What was the most challenging bug you fixed in [repo]?"
  ],
  "summary": "A 2-3 sentence executive summary of the candidate"
}}"""

    try:
        system_message = """You are an expert technical recruiter AI assistant. Your job is to analyze GitHub profiles and provide accurate, unbiased assessments of developer authenticity and skill level. 

Always be fair but thorough. Look for genuine signals of technical competency, not just vanity metrics. Consider that developers may have private repos or contribute to work repos not shown here.

IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanations outside the JSON."""

        chat = await get_claude_chat(system_message)
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse JSON response
        # Try to extract JSON from the response
        response_text = response.strip()
        
        # Handle potential markdown code blocks
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])
        
        # Find JSON object
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx]
            analysis = json.loads(json_str)
            
            # Ensure required fields exist
            analysis.setdefault("authenticity_score", 50)
            analysis.setdefault("skill_match_score", 50)
            analysis.setdefault("recommendation", "Screen Further")
            analysis.setdefault("red_flags", [])
            analysis.setdefault("green_flags", [])
            analysis.setdefault("skill_evidence", {})
            analysis.setdefault("interview_questions", [])
            analysis.setdefault("summary", "Analysis completed.")
            
            return analysis
        else:
            logger.error(f"Could not find JSON in response: {response_text[:200]}")
            return create_fallback_analysis(github_data)
            
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {e}")
        return create_fallback_analysis(github_data)
    except Exception as e:
        logger.error(f"Error in Claude analysis: {e}")
        return create_fallback_analysis(github_data)

def create_fallback_analysis(github_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a basic analysis when AI fails"""
    
    # Calculate basic authenticity score
    score = 50  # Base score
    
    # Adjust based on data
    if github_data.get('original_repos', 0) > 5:
        score += 15
    if github_data.get('total_stars_received', 0) > 10:
        score += 10
    if github_data.get('recent_commits', 0) > 5:
        score += 10
    if github_data.get('fork_percentage', 0) > 70:
        score -= 20
    if github_data.get('account_age_days', 0) > 365:
        score += 5
    if github_data.get('followers', 0) > 50:
        score += 5
    
    score = max(0, min(100, score))
    
    red_flags = []
    green_flags = []
    
    if github_data.get('fork_percentage', 0) > 50:
        red_flags.append(f"{github_data.get('fork_percentage')}% of repositories are forks")
    if github_data.get('recent_commits', 0) == 0:
        red_flags.append("No recent commit activity")
    if github_data.get('original_repos', 0) < 3:
        red_flags.append("Very few original repositories")
    
    if github_data.get('total_stars_received', 0) > 10:
        green_flags.append(f"Has received {github_data.get('total_stars_received')} stars on projects")
    if github_data.get('original_repos', 0) > 10:
        green_flags.append(f"Has {github_data.get('original_repos')} original repositories")
    if github_data.get('account_age_days', 0) > 730:
        green_flags.append("Account is over 2 years old")
    
    recommendation = "Interview" if score >= 70 else "Screen Further" if score >= 50 else "Pass"
    
    return {
        "authenticity_score": score,
        "skill_match_score": 50,
        "confidence_level": "low",
        "skill_evidence": {lang: "Present in repositories" for lang in github_data.get('top_languages', [])[:3]},
        "red_flags": red_flags if red_flags else ["No significant red flags detected"],
        "green_flags": green_flags if green_flags else ["Profile appears standard"],
        "recommendation": recommendation,
        "recommendation_reason": "Basic analysis - AI detailed analysis unavailable",
        "interview_questions": [
            "Tell me about a challenging project you've worked on.",
            "How do you approach debugging complex issues?",
            "What's your experience with the technologies in our stack?"
        ],
        "summary": f"Candidate has {github_data.get('original_repos', 0)} original repos and {github_data.get('top_languages', ['various'])[0] if github_data.get('top_languages') else 'various'} as primary language. Basic analysis suggests {'positive' if score >= 60 else 'further review needed'}."
    }
