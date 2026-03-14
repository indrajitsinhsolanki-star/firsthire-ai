#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class TalentGPTAPITester:
    def __init__(self, base_url="https://ai-sourcing-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        prefix = "✅" if status == "SUCCESS" else "❌" if status == "ERROR" else "🔍"
        print(f"[{timestamp}] {prefix} {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        
        # Add token to params if authenticated
        if self.token:
            if not params:
                params = {}
            params['token'] = self.token

        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, params=params)
            elif method == 'POST':
                response = self.session.post(url, json=data, params=params)
            elif method == 'DELETE':
                response = self.session.delete(url, params=params)
            elif method == 'PATCH':
                response = self.session.patch(url, json=data, params=params)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"{name} - Status: {response.status_code}", "SUCCESS")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                self.log(f"{name} - Expected {expected_status}, got {response.status_code}", "ERROR")
                try:
                    error_detail = response.json() if response.text else "No response body"
                    self.log(f"Error details: {error_detail}", "ERROR")
                except:
                    self.log(f"Raw response: {response.text[:200]}", "ERROR")

            return success, {}

        except Exception as e:
            self.log(f"{name} - Error: {str(e)}", "ERROR")
            return False, {}

    def test_health_check(self):
        """Test basic API health"""
        success, response = self.run_test("Health Check", "GET", "", 200)
        return success

    def test_seed_data(self):
        """Seed database with test candidates"""
        success, response = self.run_test("Seed Database", "POST", "seed", 200)
        if success:
            self.log(f"Seeded: {response.get('count', 0)} candidates")
        return success

    def test_register_user(self, email, password, full_name):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"email": email, "password": password, "full_name": full_name}
        )
        return success, response

    def test_login(self, email, password):
        """Test login and get token"""
        success, response = self.run_test(
            "User Login",
            "POST", 
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            self.log(f"Authenticated as: {response['user']['full_name']}")
            return True, response
        return False, {}

    def test_get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test("Get Current User", "GET", "auth/me", 200)
        return success, response

    def test_get_candidates(self):
        """Test getting all candidates"""
        success, response = self.run_test("Get All Candidates", "GET", "candidates", 200)
        if success:
            self.log(f"Found {len(response)} candidates")
        return success, response

    def test_search_candidates(self, query):
        """Test AI-powered candidate search"""
        success, response = self.run_test(
            "Search Candidates",
            "POST",
            "candidates/search",
            200,
            data={"query": query}
        )
        if success:
            candidates = response.get('candidates', [])
            filters = response.get('filters', {})
            self.log(f"Search found {len(candidates)} candidates with filters: {filters}")
        return success, response

    def test_create_shortlist(self, name, description=None):
        """Test creating a shortlist"""
        success, response = self.run_test(
            "Create Shortlist",
            "POST",
            "shortlists",
            200,
            data={"name": name, "description": description}
        )
        return success, response

    def test_get_shortlists(self):
        """Test getting user's shortlists"""
        success, response = self.run_test("Get Shortlists", "GET", "shortlists", 200)
        if success:
            self.log(f"Found {len(response)} shortlists")
        return success, response

    def test_add_to_shortlist(self, shortlist_id, candidate_id):
        """Test adding candidate to shortlist"""
        success, response = self.run_test(
            "Add to Shortlist",
            "POST",
            f"shortlists/{shortlist_id}/candidates",
            200,
            data={"shortlist_id": shortlist_id, "candidate_id": candidate_id}
        )
        return success, response

    def test_get_shortlist_candidates(self, shortlist_id):
        """Test getting candidates in a shortlist"""
        success, response = self.run_test(
            "Get Shortlist Candidates",
            "GET",
            f"shortlists/{shortlist_id}/candidates",
            200
        )
        return success, response

    def test_add_comment(self, shortlist_candidate_id, text):
        """Test adding comment to shortlist candidate"""
        success, response = self.run_test(
            "Add Comment",
            "POST",
            f"shortlist-candidates/{shortlist_candidate_id}/comments",
            200,
            data={"text": text}
        )
        return success, response

    def test_create_team(self, name):
        """Test creating a team"""
        success, response = self.run_test(
            "Create Team",
            "POST",
            "teams",
            200,
            data={"name": name}
        )
        return success, response

    def test_get_teams(self):
        """Test getting user's teams"""
        success, response = self.run_test("Get Teams", "GET", "teams", 200)
        return success, response

    def test_invite_member(self, team_id, email, role="Viewer"):
        """Test inviting a team member"""
        success, response = self.run_test(
            "Invite Team Member",
            "POST",
            f"teams/{team_id}/invite",
            200,
            data={"email": email, "role": role}
        )
        return success, response

    def test_create_agent(self, name, search_criteria):
        """Test creating an AI recruiting agent"""
        success, response = self.run_test(
            "Create AI Agent",
            "POST",
            "agents",
            200,
            data={
                "name": name,
                "search_criteria": search_criteria,
                "run_interval_hours": 24,
                "target_count": 5
            }
        )
        return success, response

    def test_get_agents(self):
        """Test getting user's AI agents"""
        success, response = self.run_test("Get AI Agents", "GET", "agents", 200)
        return success, response

    def test_trigger_agent_run(self, agent_id):
        """Test triggering an agent run"""
        success, response = self.run_test(
            "Trigger Agent Run",
            "POST",
            f"agents/{agent_id}/run",
            200
        )
        return success, response

    def test_create_outreach(self, candidate_id):
        """Test creating outreach sequence"""
        success, response = self.run_test(
            "Create Outreach Sequence",
            "POST",
            "outreach",
            200,
            data={"candidate_id": candidate_id}
        )
        return success, response

    def test_get_outreach(self):
        """Test getting outreach sequences"""
        success, response = self.run_test("Get Outreach Sequences", "GET", "outreach", 200)
        return success, response

    def test_get_insights(self):
        """Test getting insights dashboard data"""
        success, response = self.run_test("Get Insights", "GET", "insights", 200)
        if success:
            skills = len(response.get('skills', []))
            locations = len(response.get('locations', []))
            seniorities = len(response.get('seniorities', []))
            self.log(f"Insights: {skills} skills, {locations} locations, {seniorities} seniorities")
        return success, response

    def test_candidate_summary(self, candidate_id):
        """Test AI-generated candidate summary"""
        success, response = self.run_test(
            "Generate Candidate Summary",
            "POST",
            f"candidates/{candidate_id}/summary",
            200
        )
        if success:
            summary = response.get('summary', '')
            self.log(f"AI Summary length: {len(summary)} characters")
        return success, response

def main():
    print("🚀 Starting TalentGPT API Tests")
    print("=" * 50)
    
    tester = TalentGPTAPITester()
    
    # Test basic health
    if not tester.test_health_check():
        print("❌ API health check failed. Stopping tests.")
        return 1

    # Seed data first
    tester.test_seed_data()

    # Test authentication flow
    test_email = "test@example.com"
    test_password = "password123"
    
    # Try to login first (user might already exist)
    login_success, login_response = tester.test_login(test_email, test_password)
    
    if not login_success:
        # If login fails, try to register
        tester.log("Login failed, attempting registration...")
        reg_success, reg_response = tester.test_register_user(test_email, test_password, "Test User")
        if not reg_success:
            print("❌ Both login and registration failed. Stopping tests.")
            return 1
    
    # Test getting current user
    tester.test_get_current_user()

    # Test candidate operations
    candidates_success, candidates = tester.test_get_candidates()
    if not candidates_success or not candidates:
        print("❌ No candidates available. Stopping tests.")
        return 1

    # Test search functionality
    search_success, search_results = tester.test_search_candidates("Senior React engineer in San Francisco")
    
    # Test shortlist operations
    shortlist_success, shortlist = tester.test_create_shortlist("Test Shortlist", "Testing shortlist creation")
    if shortlist_success:
        shortlist_id = shortlist.get('id')
        
        # Get some candidates to add
        if candidates:
            candidate_id = candidates[0]['id']
            
            # Add candidate to shortlist
            add_success, add_result = tester.test_add_to_shortlist(shortlist_id, candidate_id)
            if add_success:
                # Test getting shortlist candidates
                list_candidates_success, list_candidates = tester.test_get_shortlist_candidates(shortlist_id)
                if list_candidates_success and list_candidates:
                    # Test adding a comment
                    shortlist_candidate_id = list_candidates[0]['id']
                    tester.test_add_comment(shortlist_candidate_id, "Great candidate for React position!")
    
    # Test shortlists retrieval
    tester.test_get_shortlists()

    # Test team operations
    team_success, team = tester.test_create_team("Test Engineering Team")
    if team_success:
        team_id = team.get('id')
        # Test inviting a member
        tester.test_invite_member(team_id, "colleague@example.com", "Admin")
    
    # Test teams retrieval
    tester.test_get_teams()

    # Test AI agent operations
    agent_criteria = {
        "seniority": "Senior",
        "location": "San Francisco", 
        "skills": ["React", "TypeScript"],
        "industry": "Tech"
    }
    agent_success, agent = tester.test_create_agent("Senior React Hunter", agent_criteria)
    if agent_success:
        agent_id = agent.get('id')
        # Test triggering agent run
        tester.test_trigger_agent_run(agent_id)
    
    # Test agents retrieval
    tester.test_get_agents()

    # Test outreach operations
    if candidates:
        candidate_id = candidates[0]['id']
        outreach_success, outreach = tester.test_create_outreach(candidate_id)
    
    # Test outreach retrieval
    tester.test_get_outreach()

    # Test insights dashboard
    tester.test_get_insights()

    # Test AI features if we have candidates
    if candidates:
        candidate_id = candidates[0]['id']
        tester.test_candidate_summary(candidate_id)

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        failed = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())