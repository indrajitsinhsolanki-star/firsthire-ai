import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Shield, Search, AlertTriangle, CheckCircle, XCircle, Github, Loader, ChevronDown, ChevronUp, User, Code, Star, GitBranch, Clock, MapPin, Building, ExternalLink, MessageSquare, Sparkles } from 'lucide-react';

export default function VerifyCandidatePage() {
  const { api } = useAuth();
  const [username, setUsername] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    skills: true,
    flags: true,
    questions: false,
    projects: false
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/verification-history?limit=5');
      setHistory(res.data);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/api/verify-candidate', {
        github_username: username.trim(),
        job_requirements: jobRequirements.trim() || null
      });
      setResult(res.data);
      fetchHistory();
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`GitHub user "${username}" not found. Please check the username.`);
      } else if (err.response?.status === 429) {
        setError('GitHub API rate limit reached. Please try again in a few minutes.');
      } else {
        setError(err.response?.data?.detail || 'An error occurred during verification');
      }
    } finally {
      setLoading(false);
    }
  };

  const tryExample = (exampleUsername) => {
    setUsername(exampleUsername);
    setJobRequirements('Senior Software Engineer with experience in Python, system architecture, and open source development.');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({...prev, [section]: !prev[section]}));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'from-emerald-500/20 to-emerald-500/5';
    if (score >= 60) return 'from-yellow-500/20 to-yellow-500/5';
    if (score >= 40) return 'from-orange-500/20 to-orange-500/5';
    return 'from-red-500/20 to-red-500/5';
  };

  const getRecommendationStyle = (rec) => {
    switch (rec?.toLowerCase()) {
      case 'interview':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'screen further':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'pass':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="p-6" data-testid="verify-candidate-page">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30">
              <Shield className="w-8 h-8 text-violet-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                Authenticity Engine
                <span className="badge badge-primary text-xs">NEW</span>
              </h1>
              <p className="text-slate-400">AI-powered GitHub profile verification</p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="card p-6 mb-6">
          <form onSubmit={handleVerify}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Github size={16} className="inline mr-2" />
                  GitHub Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., torvalds"
                  className="input-field"
                  data-testid="github-username-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Code size={16} className="inline mr-2" />
                  Job Requirements (optional)
                </label>
                <input
                  type="text"
                  value={jobRequirements}
                  onChange={(e) => setJobRequirements(e.target.value)}
                  placeholder="e.g., Senior Python Engineer, ML experience..."
                  className="input-field"
                  data-testid="job-requirements-input"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
                data-testid="verify-btn"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Analyzing Profile...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Verify Candidate
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Try:</span>
                <button
                  type="button"
                  onClick={() => tryExample('torvalds')}
                  className="text-violet-400 hover:text-violet-300"
                >
                  torvalds
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => tryExample('gvanrossum')}
                  className="text-violet-400 hover:text-violet-300"
                >
                  gvanrossum
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => tryExample('sindresorhus')}
                  className="text-violet-400 hover:text-violet-300"
                >
                  sindresorhus
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="card p-4 mb-6 bg-red-500/10 border-red-500/30">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card p-12 text-center mb-6">
            <Loader size={48} className="animate-spin text-violet-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Analyzing GitHub Profile</h3>
            <p className="text-slate-400 text-sm">
              Fetching repositories, analyzing contributions, and generating AI assessment...
            </p>
            <p className="text-slate-500 text-xs mt-2">This may take 10-15 seconds</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6 animate-slide-up">
            {/* Profile Header */}
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <img
                  src={result.github_data?.avatar_url || '/placeholder-avatar.png'}
                  alt={result.github_username}
                  className="w-20 h-20 rounded-full border-2 border-slate-700"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {result.github_data?.name || result.github_username}
                      </h2>
                      <a
                        href={result.github_data?.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-violet-400 flex items-center gap-1"
                      >
                        @{result.github_username}
                        <ExternalLink size={14} />
                      </a>
                    </div>
                    <span className={`badge px-4 py-2 text-lg font-bold ${getRecommendationStyle(result.recommendation)}`}>
                      {result.recommendation}
                    </span>
                  </div>
                  
                  {result.github_data?.bio && (
                    <p className="text-slate-300 mt-2">{result.github_data.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-400">
                    {result.github_data?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {result.github_data.location}
                      </span>
                    )}
                    {result.github_data?.company && (
                      <span className="flex items-center gap-1">
                        <Building size={14} />
                        {result.github_data.company}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {result.github_data?.followers || 0} followers
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      Account age: {Math.round((result.github_data?.account_age_days || 0) / 365)} years
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`card p-6 bg-gradient-to-br ${getScoreBg(result.authenticity_score)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 font-medium">Authenticity Score</span>
                  <Shield className={getScoreColor(result.authenticity_score)} size={24} />
                </div>
                <div className={`text-5xl font-bold ${getScoreColor(result.authenticity_score)}`}>
                  {result.authenticity_score}
                  <span className="text-2xl text-slate-500">/100</span>
                </div>
                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      result.authenticity_score >= 80 ? 'bg-emerald-500' :
                      result.authenticity_score >= 60 ? 'bg-yellow-500' :
                      result.authenticity_score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{width: `${result.authenticity_score}%`}}
                  />
                </div>
              </div>

              <div className={`card p-6 bg-gradient-to-br ${getScoreBg(result.skill_match_score)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 font-medium">Skill Match Score</span>
                  <Sparkles className={getScoreColor(result.skill_match_score)} size={24} />
                </div>
                <div className={`text-5xl font-bold ${getScoreColor(result.skill_match_score)}`}>
                  {result.skill_match_score}
                  <span className="text-2xl text-slate-500">/100</span>
                </div>
                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      result.skill_match_score >= 80 ? 'bg-emerald-500' :
                      result.skill_match_score >= 60 ? 'bg-yellow-500' :
                      result.skill_match_score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{width: `${result.skill_match_score}%`}}
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <MessageSquare size={18} className="text-violet-400" />
                AI Assessment
              </h3>
              <p className="text-slate-300 leading-relaxed">{result.summary}</p>
              {result.recommendation_reason && (
                <p className="text-slate-400 text-sm mt-2 italic">
                  {result.recommendation_reason}
                </p>
              )}
            </div>

            {/* GitHub Stats */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">GitHub Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                  <GitBranch className="mx-auto text-violet-400 mb-2" size={24} />
                  <p className="text-2xl font-bold text-white">{result.github_data?.total_repos || 0}</p>
                  <p className="text-xs text-slate-500">Total Repos</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                  <Code className="mx-auto text-cyan-400 mb-2" size={24} />
                  <p className="text-2xl font-bold text-white">{result.github_data?.original_repos || 0}</p>
                  <p className="text-xs text-slate-500">Original</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                  <Star className="mx-auto text-yellow-400 mb-2" size={24} />
                  <p className="text-2xl font-bold text-white">{result.github_data?.total_stars_received || 0}</p>
                  <p className="text-xs text-slate-500">Stars Received</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                  <Clock className="mx-auto text-emerald-400 mb-2" size={24} />
                  <p className="text-2xl font-bold text-white">{result.github_data?.recent_commits || 0}</p>
                  <p className="text-xs text-slate-500">Recent Commits</p>
                </div>
              </div>

              {result.github_data?.top_languages?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-slate-400 mb-2">Top Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {result.github_data.top_languages.slice(0, 8).map((lang, i) => (
                      <span key={i} className="badge badge-info">{lang}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Red Flags & Green Flags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-5">
                <button
                  onClick={() => toggleSection('flags')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-400" />
                    Red Flags ({result.red_flags?.length || 0})
                  </h3>
                  {expandedSections.flags ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expandedSections.flags && (
                  <div className="mt-3 space-y-2">
                    {result.red_flags?.length > 0 ? (
                      result.red_flags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-300">{flag}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm">No red flags detected</p>
                    )}
                  </div>
                )}
              </div>

              <div className="card p-5">
                <button
                  onClick={() => toggleSection('flags')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-400" />
                    Green Flags ({result.green_flags?.length || 0})
                  </h3>
                  {expandedSections.flags ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expandedSections.flags && (
                  <div className="mt-3 space-y-2">
                    {result.green_flags?.length > 0 ? (
                      result.green_flags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-300">{flag}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm">No notable green flags</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Skill Evidence */}
            {result.skill_evidence && Object.keys(result.skill_evidence).length > 0 && (
              <div className="card p-5">
                <button
                  onClick={() => toggleSection('skills')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Code size={18} className="text-cyan-400" />
                    Skill Evidence
                  </h3>
                  {expandedSections.skills ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expandedSections.skills && (
                  <div className="mt-3 space-y-3">
                    {Object.entries(result.skill_evidence).map(([skill, evidence], i) => (
                      <div key={i} className="bg-slate-900/50 rounded-lg p-3">
                        <span className="badge badge-primary mb-2">{skill}</span>
                        <p className="text-sm text-slate-300">{evidence}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Interview Questions */}
            {result.interview_questions?.length > 0 && (
              <div className="card p-5">
                <button
                  onClick={() => toggleSection('questions')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MessageSquare size={18} className="text-violet-400" />
                    Suggested Interview Questions
                  </h3>
                  {expandedSections.questions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expandedSections.questions && (
                  <div className="mt-3 space-y-2">
                    {result.interview_questions.map((q, i) => (
                      <div key={i} className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-3">
                        <span className="text-violet-400 font-bold">{i + 1}.</span>
                        <p className="text-slate-300 text-sm">{q}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Substantial Projects */}
            {result.github_data?.substantial_projects?.length > 0 && (
              <div className="card p-5">
                <button
                  onClick={() => toggleSection('projects')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <GitBranch size={18} className="text-cyan-400" />
                    Notable Projects ({result.github_data.substantial_projects.length})
                  </h3>
                  {expandedSections.projects ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expandedSections.projects && (
                  <div className="mt-3 space-y-2">
                    {result.github_data.substantial_projects.map((proj, i) => (
                      <a
                        key={i}
                        href={proj.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-slate-900/50 rounded-lg p-3 hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">{proj.name}</span>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            {proj.language && <span className="badge badge-info text-xs">{proj.language}</span>}
                            <span className="flex items-center gap-1">
                              <Star size={12} />
                              {proj.stars}
                            </span>
                          </div>
                        </div>
                        {proj.description && (
                          <p className="text-sm text-slate-400 mt-1">{proj.description}</p>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recent History (when no result shown) */}
        {!result && !loading && history.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Verifications</h3>
            <div className="space-y-3">
              {history.map(v => (
                <div
                  key={v.id}
                  className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3 hover:bg-slate-800/50 cursor-pointer transition-colors"
                  onClick={() => setUsername(v.github_username)}
                >
                  <div>
                    <p className="font-medium text-white">@{v.github_username}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(v.analyzed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-bold ${getScoreColor(v.authenticity_score)}`}>
                        {v.authenticity_score}/100
                      </p>
                      <p className="text-xs text-slate-500">Authenticity</p>
                    </div>
                    <span className={`badge ${getRecommendationStyle(v.recommendation)}`}>
                      {v.recommendation}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
