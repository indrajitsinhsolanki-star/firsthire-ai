"""
GitHub Service - Fetches and analyzes GitHub profile data
"""
import os
import httpx
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

GITHUB_API_BASE = "https://api.github.com"
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')  # Optional, for higher rate limits

def get_headers() -> Dict[str, str]:
    """Get headers for GitHub API requests"""
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "FirstHire-AI-Verification"
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    return headers

async def fetch_user_profile(username: str) -> Optional[Dict[str, Any]]:
    """Fetch basic user profile information"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GITHUB_API_BASE}/users/{username}",
                headers=get_headers(),
                timeout=30.0
            )
            if response.status_code == 404:
                return None
            if response.status_code == 403:
                logger.warning("GitHub API rate limit reached")
                return {"error": "rate_limit", "message": "GitHub API rate limit reached. Try again later."}
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        logger.error(f"Error fetching user profile: {e}")
        return None

async def fetch_repositories(username: str, max_repos: int = 100) -> List[Dict[str, Any]]:
    """Fetch user repositories"""
    repos = []
    page = 1
    try:
        async with httpx.AsyncClient() as client:
            while len(repos) < max_repos:
                response = await client.get(
                    f"{GITHUB_API_BASE}/users/{username}/repos",
                    params={"per_page": 100, "page": page, "sort": "updated"},
                    headers=get_headers(),
                    timeout=30.0
                )
                if response.status_code != 200:
                    break
                data = response.json()
                if not data:
                    break
                repos.extend(data)
                page += 1
                if len(data) < 100:
                    break
    except httpx.HTTPError as e:
        logger.error(f"Error fetching repositories: {e}")
    return repos[:max_repos]

async def fetch_recent_commits(username: str, repo_name: str, owner: str) -> int:
    """Fetch recent commit count for a repository"""
    try:
        async with httpx.AsyncClient() as client:
            # Get commits from last year
            since = (datetime.now() - timedelta(days=365)).isoformat()
            response = await client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo_name}/commits",
                params={"author": username, "since": since, "per_page": 100},
                headers=get_headers(),
                timeout=30.0
            )
            if response.status_code == 200:
                return len(response.json())
            return 0
    except httpx.HTTPError:
        return 0

async def fetch_contribution_stats(username: str) -> Dict[str, Any]:
    """Fetch contribution statistics using events API"""
    events = []
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GITHUB_API_BASE}/users/{username}/events/public",
                params={"per_page": 100},
                headers=get_headers(),
                timeout=30.0
            )
            if response.status_code == 200:
                events = response.json()
    except httpx.HTTPError as e:
        logger.error(f"Error fetching events: {e}")
    
    # Analyze events
    push_events = [e for e in events if e.get('type') == 'PushEvent']
    pr_events = [e for e in events if e.get('type') == 'PullRequestEvent']
    issue_events = [e for e in events if e.get('type') == 'IssuesEvent']
    
    # Calculate recent activity
    recent_commits = sum(len(e.get('payload', {}).get('commits', [])) for e in push_events)
    
    return {
        "recent_commits": recent_commits,
        "recent_prs": len(pr_events),
        "recent_issues": len(issue_events),
        "total_recent_events": len(events),
        "last_active": events[0].get('created_at') if events else None
    }

def analyze_languages(repos: List[Dict[str, Any]]) -> Dict[str, int]:
    """Analyze languages across repositories"""
    language_counts = {}
    for repo in repos:
        lang = repo.get('language')
        if lang:
            language_counts[lang] = language_counts.get(lang, 0) + 1
    return dict(sorted(language_counts.items(), key=lambda x: x[1], reverse=True))

def analyze_repos(repos: List[Dict[str, Any]], username: str) -> Dict[str, Any]:
    """Analyze repository patterns"""
    original_repos = []
    forked_repos = []
    starred_repos = []
    
    total_stars = 0
    total_forks = 0
    
    for repo in repos:
        if repo.get('fork'):
            forked_repos.append(repo)
        else:
            original_repos.append(repo)
            
        stars = repo.get('stargazers_count', 0)
        forks = repo.get('forks_count', 0)
        total_stars += stars
        total_forks += forks
        
        if stars > 10:
            starred_repos.append(repo)
    
    # Identify potential tutorial/clone repos
    tutorial_indicators = ['tutorial', 'course', 'bootcamp', 'learn', 'practice', 'test', 'demo', 'example', 'clone', 'copy']
    tutorial_repos = []
    for repo in original_repos:
        name_lower = repo.get('name', '').lower()
        desc_lower = (repo.get('description') or '').lower()
        if any(ind in name_lower or ind in desc_lower for ind in tutorial_indicators):
            tutorial_repos.append(repo)
    
    # Identify substantial projects
    substantial_projects = []
    for repo in original_repos:
        # Repos with stars, forks, or decent size
        if (repo.get('stargazers_count', 0) > 0 or 
            repo.get('forks_count', 0) > 0 or 
            repo.get('size', 0) > 100):
            substantial_projects.append({
                "name": repo.get('name'),
                "description": repo.get('description'),
                "language": repo.get('language'),
                "stars": repo.get('stargazers_count', 0),
                "forks": repo.get('forks_count', 0),
                "url": repo.get('html_url')
            })
    
    return {
        "total_repos": len(repos),
        "original_repos": len(original_repos),
        "forked_repos": len(forked_repos),
        "fork_percentage": round(len(forked_repos) / len(repos) * 100, 1) if repos else 0,
        "tutorial_repos": len(tutorial_repos),
        "substantial_projects": substantial_projects[:10],  # Top 10
        "total_stars_received": total_stars,
        "total_forks_received": total_forks,
        "has_popular_repos": len(starred_repos) > 0
    }

async def get_full_github_analysis(username: str) -> Dict[str, Any]:
    """
    Complete GitHub profile analysis
    Returns structured data for Claude analysis
    """
    # Fetch profile
    profile = await fetch_user_profile(username)
    if not profile:
        return {"error": "user_not_found", "message": f"GitHub user '{username}' not found"}
    
    if profile.get("error"):
        return profile
    
    # Fetch repositories
    repos = await fetch_repositories(username)
    
    # Analyze data
    languages = analyze_languages(repos)
    repo_analysis = analyze_repos(repos, username)
    contribution_stats = await fetch_contribution_stats(username)
    
    # Calculate account age
    created_at = profile.get('created_at')
    account_age_days = 0
    if created_at:
        try:
            created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            account_age_days = (datetime.now(created_date.tzinfo) - created_date).days
        except:
            pass
    
    return {
        "username": username,
        "name": profile.get('name'),
        "bio": profile.get('bio'),
        "company": profile.get('company'),
        "location": profile.get('location'),
        "blog": profile.get('blog'),
        "public_repos": profile.get('public_repos', 0),
        "followers": profile.get('followers', 0),
        "following": profile.get('following', 0),
        "created_at": created_at,
        "account_age_days": account_age_days,
        "avatar_url": profile.get('avatar_url'),
        "html_url": profile.get('html_url'),
        
        # Repository analysis
        **repo_analysis,
        
        # Languages
        "top_languages": list(languages.keys())[:10],
        "language_breakdown": languages,
        
        # Activity
        **contribution_stats,
        
        # Quick metrics
        "has_original_work": repo_analysis['original_repos'] > 0,
        "is_active": contribution_stats.get('recent_commits', 0) > 0,
        "profile_completeness": sum([
            bool(profile.get('name')),
            bool(profile.get('bio')),
            bool(profile.get('company')),
            bool(profile.get('location')),
            bool(profile.get('blog'))
        ]) / 5 * 100
    }
