import React, { useState } from 'react';
import { useAuth } from '../App';
import { Heart, Send, ExternalLink, MapPin, Clock, Briefcase, Loader } from 'lucide-react';

export default function CandidateCard({ candidate, onAddToShortlist }) {
  const { api } = useAuth();
  const [saved, setSaved] = useState(false);
  const [showLists, setShowLists] = useState(false);
  const [lists, setLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [sendingOutreach, setSendingOutreach] = useState(false);
  const [summary, setSummary] = useState(candidate.summary || null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const handleSave = async () => {
    setLoadingLists(true);
    try {
      const res = await api.get('/api/shortlists');
      setLists(res.data);
      setShowLists(true);
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoadingLists(false);
    }
  };

  const addToList = async (listId) => {
    try {
      await api.post(`/api/shortlists/${listId}/candidates`, {
        shortlist_id: listId,
        candidate_id: candidate.id
      });
      setSaved(true);
      setShowLists(false);
      if (onAddToShortlist) onAddToShortlist();
    } catch (error) {
      if (error.response?.data?.detail === 'Candidate already in shortlist') {
        alert('Candidate already in this list');
      } else {
        console.error('Error adding to list:', error);
      }
    }
  };

  const handleStartOutreach = async () => {
    setSendingOutreach(true);
    try {
      await api.post('/api/outreach', { candidate_id: candidate.id });
      alert('Outreach sequence created! Go to Outreach page to send emails.');
    } catch (error) {
      if (error.response?.data?.detail !== 'Outreach sequence already exists') {
        console.error('Error creating sequence:', error);
        alert('Error creating outreach sequence');
      } else {
        alert('Outreach sequence already exists for this candidate');
      }
    } finally {
      setSendingOutreach(false);
    }
  };

  const loadSummary = async () => {
    if (summary) return;
    setLoadingSummary(true);
    try {
      const res = await api.post(`/api/candidates/${candidate.id}/summary`);
      setSummary(res.data.summary);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const getAvailabilityBadge = () => {
    switch (candidate.availability) {
      case 'Open to Work':
        return 'badge-success';
      case 'Active':
        return 'badge-info';
      default:
        return 'badge-warning';
    }
  };

  return (
    <div 
      className="card card-hover p-5 relative animate-slide-up" 
      data-testid={`candidate-card-${candidate.id}`}
      onMouseEnter={loadSummary}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{candidate.name}</h3>
          <p className="text-sm text-slate-400">{candidate.title}</p>
          <p className="text-xs text-slate-500 mt-1">{candidate.company}</p>
        </div>
        <div className="text-right">
          <div className="badge badge-primary text-lg font-bold px-3 py-1">
            {candidate.match_score || 0}%
          </div>
          <span className={`badge ${getAvailabilityBadge()} mt-2 block`}>
            {candidate.availability}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <MapPin size={14} />
          <span>{candidate.location}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Clock size={14} />
          <span>{candidate.years_exp}+ years experience</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Briefcase size={14} />
          <span>{candidate.seniority} Level</span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-slate-300 mb-2">Top Skills</p>
        <div className="flex flex-wrap gap-1.5">
          {candidate.skills?.slice(0, 4).map((skill, i) => (
            <span key={i} className="badge badge-info">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {loadingSummary ? (
        <div className="bg-slate-900/50 rounded-lg p-3 mb-4 flex items-center gap-2">
          <Loader size={14} className="animate-spin text-violet-400" />
          <span className="text-xs text-slate-400">Generating AI summary...</span>
        </div>
      ) : summary && (
        <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
          <p className="text-xs text-slate-300 leading-relaxed">{summary}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleSave}
          disabled={loadingLists}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm ${
            saved 
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' 
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
          data-testid={`save-candidate-${candidate.id}`}
        >
          <Heart size={14} fill={saved ? 'currentColor' : 'none'} />
          <span>{saved ? 'Saved' : 'Save'}</span>
        </button>
        <button
          onClick={handleStartOutreach}
          disabled={sendingOutreach}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-all disabled:opacity-50 text-sm"
          data-testid={`outreach-candidate-${candidate.id}`}
        >
          <Send size={14} />
          <span>Reach</span>
        </button>
        <a
          href={candidate.linkedin_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all text-sm"
        >
          <ExternalLink size={14} />
          <span>Profile</span>
        </a>
      </div>

      {showLists && (
        <div className="absolute left-0 right-0 top-full mt-2 mx-4 card p-2 z-20 shadow-2xl">
          <p className="text-xs text-slate-400 px-2 py-1 mb-1">Add to shortlist:</p>
          {lists.length === 0 ? (
            <p className="text-sm text-slate-500 p-2">No shortlists yet. Create one first!</p>
          ) : (
            lists.map(list => (
              <button
                key={list.id}
                onClick={() => addToList(list.id)}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
              >
                {list.name}
              </button>
            ))
          )}
          <button
            onClick={() => setShowLists(false)}
            className="w-full text-center px-3 py-2 text-xs text-slate-500 hover:text-slate-300 mt-1"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
