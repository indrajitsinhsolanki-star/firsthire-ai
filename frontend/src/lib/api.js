import axios from 'axios'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

const callEdgeFunction = async (functionName, payload, token) => {
  try {
    const response = await axios.post(
      `${SUPABASE_URL}/functions/v1/${functionName}`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    )
    return response.data
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error)
    throw error
  }
}

export async function parseSearchQuery(query, token) {
  try {
    const data = await callEdgeFunction('parse-query', { query }, token)
    return data.filters || {}
  } catch (error) {
    console.error('Error parsing search query:', error)
    return parseQueryLocally(query)
  }
}

function parseQueryLocally(query) {
  const filters = {
    skills: [],
    experience_years: {}
  }

  const seniorities = ['intern', 'junior', 'mid', 'senior', 'director', 'vp', 'c-suite']
  seniorities.forEach(s => {
    if (query.toLowerCase().includes(s)) {
      filters.seniority = s.charAt(0).toUpperCase() + s.slice(1)
    }
  })

  const locations = ['NYC', 'San Francisco', 'New York', 'SF', 'Los Angeles', 'Seattle', 'Boston', 'remote', 'Remote']
  locations.forEach(loc => {
    if (query.toLowerCase().includes(loc.toLowerCase())) {
      filters.location = loc
    }
  })

  const skillsKeywords = ['react', 'python', 'typescript', 'node', 'aws', 'java', 'c#', 'go', 'rust', 'javascript']
  skillsKeywords.forEach(skill => {
    if (query.toLowerCase().includes(skill)) {
      filters.skills.push(skill.charAt(0).toUpperCase() + skill.slice(1))
    }
  })

  const industries = ['fintech', 'saas', 'ai', 'media', 'ecommerce', 'startup', 'enterprise']
  industries.forEach(ind => {
    if (query.toLowerCase().includes(ind)) {
      filters.industry = ind.charAt(0).toUpperCase() + ind.slice(1)
    }
  })

  return filters
}

export async function generateCandidateSummary(candidate, token) {
  try {
    const data = await callEdgeFunction('generate-summary', { candidate }, token)
    return data.summary
  } catch (error) {
    console.error('Error generating summary:', error)
    return `${candidate.name} is a ${candidate.seniority} ${candidate.title} at ${candidate.company} with expertise in ${candidate.skills.slice(0, 2).join(' and ')}.`
  }
}

export async function generateOutreachEmail(candidate, token, type = 'initial') {
  try {
    const data = await callEdgeFunction('generate-email', { candidate, type }, token)
    return data.email
  } catch (error) {
    console.error('Error generating email:', error)
    return `Hi ${candidate.name},\n\nI'm impressed by your background in ${candidate.skills[0] || 'technology'}. I think there's a great opportunity that aligns with your experience.\n\nLet's connect!`
  }
}

export function calculateMatchScore(candidate, filters) {
  let score = 0
  let maxScore = 0

  if (filters.seniority) {
    maxScore += 20
    if (candidate.seniority?.toLowerCase() === filters.seniority.toLowerCase()) {
      score += 20
    } else if ((filters.seniority === 'Senior' && ['Director', 'VP', 'C-Suite'].includes(candidate.seniority)) ||
               (filters.seniority === 'Mid' && ['Senior', 'Mid'].includes(candidate.seniority))) {
      score += 10
    }
  }

  if (filters.location) {
    maxScore += 20
    const locationMatch = candidate.location?.toLowerCase().includes(filters.location.toLowerCase()) ||
                         filters.location.toLowerCase() === 'remote' && candidate.location?.toLowerCase() === 'remote'
    if (locationMatch) score += 20
  }

  if (filters.skills && filters.skills.length > 0) {
    maxScore += 30
    const matchedSkills = filters.skills.filter(skill =>
      candidate.skills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
    )
    score += (matchedSkills.length / filters.skills.length) * 30
  }

  if (filters.experience_years) {
    maxScore += 20
    if (filters.experience_years.min && candidate.years_exp >= filters.experience_years.min) {
      score += 10
    }
    if (filters.experience_years.max && candidate.years_exp <= filters.experience_years.max) {
      score += 10
    }
  }

  if (filters.industry) {
    maxScore += 10
    if (candidate.industry?.toLowerCase() === filters.industry.toLowerCase()) {
      score += 10
    }
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
}
