import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Bot, Plus, Play, Pause, Trash2, Clock, Target, RefreshCw, CheckCircle } from 'lucide-react';

export default function AgentsPage() {
  const { api } = useAuth();
  const [agents, setAgents] = useState([]);
  const [shortlists, setShortlists] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [runs, setRuns] = useState([]);

  const [newAgent, setNewAgent] = useState({
    name: '',
    search_criteria: {
      seniority: '',
      location: '',
      skills: [],
      industry: ''
    },
    run_interval_hours: 24,
    target_count: 10,
    shortlist_id: ''
  });

  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    fetchAgents();
    fetchShortlists();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      fetchAgentRuns(selectedAgent.id);
    }
  }, [selectedAgent]);

  const fetchAgents = async () => {
    try {
      const res = await api.get('/api/agents');
      setAgents(res.data);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShortlists = async () => {
    try {
      const res = await api.get('/api/shortlists');
      setShortlists(res.data);
    } catch (error) {
      console.error('Error fetching shortlists:', error);
    }
  };

  const fetchAgentRuns = async (agentId) => {
    try {
      const res = await api.get(`/api/agents/${agentId}/runs`);
      setRuns(res.data);
    } catch (error) {
      console.error('Error fetching runs:', error);
    }
  };

  const createAgent = async () => {
    if (!newAgent.name) return;
    try {
      const payload = {
        ...newAgent,
        shortlist_id: newAgent.shortlist_id || null
      };
      await api.post('/api/agents', payload);
      setShowCreate(false);
      setNewAgent({
        name: '',
        search_criteria: { seniority: '', location: '', skills: [], industry: '' },
        run_interval_hours: 24,
        target_count: 10,
        shortlist_id: ''
      });
      fetchAgents();
    } catch (error) {
      console.error('Error creating agent:', error);
    }
  };

  const triggerRun = async (agentId) => {
    try {
      await api.post(`/api/agents/${agentId}/run`);
      alert('Agent run started! Check back in a moment for results.');
      setTimeout(() => {
        fetchAgents();
        if (selectedAgent?.id === agentId) {
          fetchAgentRuns(agentId);
        }
      }, 3000);
    } catch (error) {
      console.error('Error triggering run:', error);
    }
  };

  const updateStatus = async (agentId, status) => {
    try {
      await api.patch(`/api/agents/${agentId}/status?status=${status}`);
      fetchAgents();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteAgent = async (agentId) => {
    if (!window.confirm('Delete this agent?')) return;
    try {
      await api.delete(`/api/agents/${agentId}`);
      fetchAgents();
      if (selectedAgent?.id === agentId) {
        setSelectedAgent(null);
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !newAgent.search_criteria.skills.includes(skillInput.trim())) {
      setNewAgent({
        ...newAgent,
        search_criteria: {
          ...newAgent.search_criteria,
          skills: [...newAgent.search_criteria.skills, skillInput.trim()]
        }
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setNewAgent({
      ...newAgent,
      search_criteria: {
        ...newAgent.search_criteria,
        skills: newAgent.search_criteria.skills.filter(s => s !== skill)
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return 'badge-success';
      case 'paused': return 'badge-warning';
      case 'completed': return 'badge-info';
      default: return 'badge-info';
    }
  };

  return (
    <div className="p-6" data-testid="agents-page">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Bot className="text-violet-400" />
            AI Recruiting Agents
          </h1>
          <p className="text-slate-400">Autonomous agents that find and shortlist candidates while you sleep</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agents List */}
          <div className="card p-5">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-semibold text-white">Your Agents</h2>
              <button
                onClick={() => setShowCreate(true)}
                className="btn-primary text-sm flex items-center gap-1.5"
                data-testid="create-agent-btn"
              >
                <Plus size={16} />
                <span>New Agent</span>
              </button>
            </div>

            <div className="space-y-3">
              {agents.length === 0 && !loading ? (
                <div className="text-center py-8">
                  <Bot size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-500">No agents yet</p>
                  <p className="text-sm text-slate-600 mt-1">Create one to start autonomous sourcing</p>
                </div>
              ) : (
                agents.map(agent => (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedAgent?.id === agent.id
                        ? 'bg-violet-600/20 border border-violet-500/30'
                        : 'bg-slate-800/50 hover:bg-slate-700/50'
                    }`}
                    data-testid={`agent-${agent.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">{agent.name}</h3>
                      <span className={`badge ${getStatusBadge(agent.status)}`}>{agent.status}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Target size={12} />
                        {agent.candidates_found} found
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        Every {agent.run_interval_hours}h
                      </span>
                    </div>
                    {agent.last_run && (
                      <p className="text-xs text-slate-500 mt-2">
                        Last run: {new Date(agent.last_run).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Agent Details */}
          <div className="lg:col-span-2">
            {selectedAgent ? (
              <div className="card p-5">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{selectedAgent.name}</h2>
                    <span className={`badge ${getStatusBadge(selectedAgent.status)} mt-2`}>
                      {selectedAgent.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerRun(selectedAgent.id)}
                      className="btn-primary text-sm flex items-center gap-1.5"
                      disabled={selectedAgent.status !== 'active'}
                      data-testid="run-agent-btn"
                    >
                      <RefreshCw size={14} />
                      Run Now
                    </button>
                    {selectedAgent.status === 'active' ? (
                      <button
                        onClick={() => updateStatus(selectedAgent.id, 'paused')}
                        className="btn-secondary text-sm flex items-center gap-1.5"
                      >
                        <Pause size={14} />
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(selectedAgent.id, 'active')}
                        className="btn-secondary text-sm flex items-center gap-1.5"
                      >
                        <Play size={14} />
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() => deleteAgent(selectedAgent.id)}
                      className="btn-danger text-sm"
                      data-testid="delete-agent-btn"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Criteria */}
                <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Search Criteria</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedAgent.search_criteria.seniority && (
                      <div>
                        <span className="text-slate-500">Seniority:</span>
                        <span className="text-white ml-2">{selectedAgent.search_criteria.seniority}</span>
                      </div>
                    )}
                    {selectedAgent.search_criteria.location && (
                      <div>
                        <span className="text-slate-500">Location:</span>
                        <span className="text-white ml-2">{selectedAgent.search_criteria.location}</span>
                      </div>
                    )}
                    {selectedAgent.search_criteria.industry && (
                      <div>
                        <span className="text-slate-500">Industry:</span>
                        <span className="text-white ml-2">{selectedAgent.search_criteria.industry}</span>
                      </div>
                    )}
                    {selectedAgent.search_criteria.skills?.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-slate-500">Skills:</span>
                        <span className="text-white ml-2">{selectedAgent.search_criteria.skills.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-violet-400">{selectedAgent.candidates_found}</p>
                    <p className="text-xs text-slate-500">Total Found</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-cyan-400">{selectedAgent.target_count}</p>
                    <p className="text-xs text-slate-500">Target/Run</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{selectedAgent.run_interval_hours}h</p>
                    <p className="text-xs text-slate-500">Interval</p>
                  </div>
                </div>

                {/* Run History */}
                <h3 className="text-sm font-medium text-slate-300 mb-3">Recent Runs</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {runs.length === 0 ? (
                    <p className="text-slate-500 text-sm py-4 text-center">No runs yet</p>
                  ) : (
                    runs.map(run => (
                      <div key={run.id} className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {run.status === 'completed' ? (
                            <CheckCircle size={16} className="text-emerald-400" />
                          ) : run.status === 'running' ? (
                            <RefreshCw size={16} className="text-yellow-400 animate-spin" />
                          ) : (
                            <Clock size={16} className="text-red-400" />
                          )}
                          <div>
                            <p className="text-sm text-white">Found {run.candidates_found} candidates</p>
                            <p className="text-xs text-slate-500">{new Date(run.started_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={`badge ${run.status === 'completed' ? 'badge-success' : run.status === 'running' ? 'badge-warning' : 'badge-primary'}`}>
                          {run.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <Bot size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-500">Select an agent to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">Create AI Agent</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Agent Name</label>
                  <input
                    type="text"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Senior React Engineer Hunter"
                    data-testid="agent-name-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Seniority</label>
                    <select
                      value={newAgent.search_criteria.seniority}
                      onChange={(e) => setNewAgent({
                        ...newAgent,
                        search_criteria: { ...newAgent.search_criteria, seniority: e.target.value }
                      })}
                      className="input-field"
                    >
                      <option value="">Any</option>
                      <option value="Junior">Junior</option>
                      <option value="Mid">Mid</option>
                      <option value="Senior">Senior</option>
                      <option value="Director">Director</option>
                      <option value="VP">VP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Location</label>
                    <input
                      type="text"
                      value={newAgent.search_criteria.location}
                      onChange={(e) => setNewAgent({
                        ...newAgent,
                        search_criteria: { ...newAgent.search_criteria, location: e.target.value }
                      })}
                      className="input-field"
                      placeholder="e.g., San Francisco"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Industry</label>
                  <input
                    type="text"
                    value={newAgent.search_criteria.industry}
                    onChange={(e) => setNewAgent({
                      ...newAgent,
                      search_criteria: { ...newAgent.search_criteria, industry: e.target.value }
                    })}
                    className="input-field"
                    placeholder="e.g., FinTech"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Skills</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      className="input-field flex-1"
                      placeholder="Add skill..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <button onClick={addSkill} className="btn-secondary">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newAgent.search_criteria.skills.map(skill => (
                      <span key={skill} className="badge badge-info flex items-center gap-1">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="hover:text-red-400">&times;</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Run Every (hours)</label>
                    <input
                      type="number"
                      value={newAgent.run_interval_hours}
                      onChange={(e) => setNewAgent({ ...newAgent, run_interval_hours: parseInt(e.target.value) || 24 })}
                      className="input-field"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Target per Run</label>
                    <input
                      type="number"
                      value={newAgent.target_count}
                      onChange={(e) => setNewAgent({ ...newAgent, target_count: parseInt(e.target.value) || 10 })}
                      className="input-field"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Add to Shortlist (optional)</label>
                  <select
                    value={newAgent.shortlist_id}
                    onChange={(e) => setNewAgent({ ...newAgent, shortlist_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Don't add to list</option>
                    {shortlists.map(list => (
                      <option key={list.id} value={list.id}>{list.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={createAgent} className="flex-1 btn-primary" data-testid="create-agent-submit">
                  Create Agent
                </button>
                <button onClick={() => setShowCreate(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
