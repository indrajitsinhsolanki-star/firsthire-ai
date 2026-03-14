import React, { useState } from 'react';
import { useAuth } from '../App';
import { Search, Loader, Sparkles } from 'lucide-react';
import CandidateCard from '../components/CandidateCard';
import FilterPanel from '../components/FilterPanel';

export default function SearchPage() {
  const { api } = useAuth();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await api.post('/api/candidates/search', { query });
      setCandidates(res.data.candidates || []);
      setFilters(res.data.filters || {});
    } catch (error) {
      console.error('Search error:', error);
      alert('Error performing search');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6" data-testid="search-page">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Sparkles className="text-violet-400" />
            Find Top Talent
          </h1>
          <p className="text-slate-400">Search for candidates using natural language powered by AI</p>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-4 text-slate-500" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Senior React engineer in NYC with startup experience"
              className="w-full pl-12 pr-32 py-4 input-field text-lg"
              data-testid="search-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 btn-primary disabled:opacity-50"
              data-testid="search-btn"
            >
              {loading ? <Loader size={20} className="animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>

        {searched && (
          <div className="flex gap-6">
            <FilterPanel filters={filters} />

            <div className="flex-1">
              {loading ? (
                <div className="text-center py-12">
                  <Loader className="animate-spin mx-auto mb-4 text-violet-400" size={32} />
                  <p className="text-slate-400">Searching candidates with AI...</p>
                </div>
              ) : candidates.length === 0 ? (
                <div className="card p-12 text-center" data-testid="no-results">
                  <p className="text-slate-400 mb-2">No candidates found matching your criteria</p>
                  <p className="text-sm text-slate-500">Try adjusting your search filters</p>
                </div>
              ) : (
                <div data-testid="search-results">
                  <p className="text-sm text-slate-400 mb-4">
                    Found {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {candidates.map(candidate => (
                      <CandidateCard key={candidate.id} candidate={candidate} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!searched && (
          <div className="card p-12 text-center gradient-bg" data-testid="search-placeholder">
            <Sparkles className="mx-auto text-violet-400 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-white mb-2">AI-Powered Candidate Search</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Use natural language to find the perfect candidates. Our AI understands context
              like "senior engineer with startup experience who knows React".
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
