import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Plus, Trash2, MessageCircle, Send, Users, Share2 } from 'lucide-react';

export default function ShortlistsPage() {
  const { api, user } = useAuth();
  const [shortlists, setShortlists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [teams, setTeams] = useState([]);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [commentText, setCommentText] = useState({});

  useEffect(() => {
    fetchShortlists();
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedList) {
      fetchListCandidates(selectedList.id);
    }
  }, [selectedList]);

  const fetchShortlists = async () => {
    try {
      const res = await api.get('/api/shortlists');
      setShortlists(res.data);
    } catch (error) {
      console.error('Error fetching shortlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await api.get('/api/teams');
      setTeams(res.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchListCandidates = async (listId) => {
    try {
      const res = await api.get(`/api/shortlists/${listId}/candidates`);
      setCandidates(res.data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  const createList = async () => {
    if (!newListName.trim()) return;
    try {
      await api.post('/api/shortlists', { name: newListName });
      setNewListName('');
      setShowNewList(false);
      fetchShortlists();
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const deleteList = async (listId) => {
    try {
      await api.delete(`/api/shortlists/${listId}`);
      fetchShortlists();
      if (selectedList?.id === listId) {
        setSelectedList(null);
        setCandidates([]);
      }
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const removeCandidate = async (itemId) => {
    try {
      await api.delete(`/api/shortlist-candidates/${itemId}`);
      fetchListCandidates(selectedList.id);
    } catch (error) {
      console.error('Error removing candidate:', error);
    }
  };

  const updateStage = async (itemId, stage) => {
    try {
      await api.patch(`/api/shortlist-candidates/${itemId}/stage`, { stage });
      fetchListCandidates(selectedList.id);
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  const addComment = async (itemId) => {
    const text = commentText[itemId];
    if (!text?.trim()) return;
    try {
      await api.post(`/api/shortlist-candidates/${itemId}/comments`, { text });
      setCommentText({ ...commentText, [itemId]: '' });
      fetchListCandidates(selectedList.id);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await api.delete(`/api/comments/${commentId}`);
      fetchListCandidates(selectedList.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const shareWithTeam = async (teamId) => {
    try {
      await api.post(`/api/shortlists/${selectedList.id}/share`, { team_id: teamId });
      setShowShareModal(false);
      fetchShortlists();
    } catch (error) {
      console.error('Error sharing shortlist:', error);
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'Sourced': return 'badge-info';
      case 'Contacted': return 'badge-warning';
      case 'Replied': return 'badge-primary';
      case 'Hired': return 'badge-success';
      default: return 'badge-info';
    }
  };

  return (
    <div className="p-6" data-testid="shortlists-page">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Shortlists</h1>
          <p className="text-slate-400">Save and organize candidates. Share with your team.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lists Panel */}
          <div className="card p-5">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-semibold text-white">Lists</h2>
              <button
                onClick={() => setShowNewList(true)}
                className="btn-primary text-sm flex items-center gap-1.5"
                data-testid="new-list-btn"
              >
                <Plus size={16} />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-2">
              {shortlists.length === 0 && !loading ? (
                <p className="text-slate-500 text-center py-8">No lists yet</p>
              ) : (
                shortlists.map(list => (
                  <div
                    key={list.id}
                    onClick={() => setSelectedList(list)}
                    className={`p-3 rounded-lg cursor-pointer transition-all flex justify-between items-center group ${
                      selectedList?.id === list.id
                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                        : 'hover:bg-slate-700/50 text-slate-300'
                    }`}
                    data-testid={`shortlist-${list.id}`}
                  >
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {list.name}
                        {list.is_shared && (
                          <Users size={14} className="text-cyan-400" title="Shared with team" />
                        )}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(list.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteList(list.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                      data-testid={`delete-list-${list.id}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {showNewList && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="List name..."
                  className="input-field mb-3"
                  data-testid="new-list-name-input"
                />
                <div className="flex gap-2">
                  <button onClick={createList} className="flex-1 btn-primary">Create</button>
                  <button onClick={() => { setShowNewList(false); setNewListName(''); }} className="flex-1 btn-secondary">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Candidates Panel */}
          <div className="lg:col-span-2">
            {selectedList ? (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-semibold text-white">{selectedList.name}</h2>
                  {teams.length > 0 && !selectedList.is_shared && (
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="btn-secondary text-sm flex items-center gap-1.5"
                      data-testid="share-list-btn"
                    >
                      <Share2 size={14} />
                      Share with Team
                    </button>
                  )}
                </div>

                {candidates.length === 0 ? (
                  <p className="text-slate-500 text-center py-12">No candidates in this list</p>
                ) : (
                  <div className="space-y-4">
                    {candidates.map(item => (
                      <div key={item.id} className="bg-slate-900/50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-white">{item.candidate?.name}</h3>
                            <p className="text-sm text-slate-400">{item.candidate?.title} at {item.candidate?.company}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={item.stage}
                              onChange={(e) => updateStage(item.id, e.target.value)}
                              className={`badge ${getStageColor(item.stage)} cursor-pointer border-none bg-opacity-100`}
                            >
                              <option value="Sourced">Sourced</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Replied">Replied</option>
                              <option value="Hired">Hired</option>
                            </select>
                            <button
                              onClick={() => removeCandidate(item.id)}
                              className="text-slate-500 hover:text-red-400 transition-colors"
                              data-testid={`remove-candidate-${item.id}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Comments Section */}
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageCircle size={14} className="text-slate-500" />
                            <span className="text-xs text-slate-500">Comments ({item.comments?.length || 0})</span>
                          </div>
                          
                          {item.comments?.map(comment => (
                            <div key={comment.id} className="bg-slate-800/50 rounded-lg p-2 mb-2 text-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-medium text-violet-300">{comment.user_name}</span>
                                  <span className="text-slate-500 ml-2 text-xs">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                {comment.user_id === user?.id && (
                                  <button
                                    onClick={() => deleteComment(comment.id)}
                                    className="text-slate-500 hover:text-red-400"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                              <p className="text-slate-300 mt-1">{comment.text}</p>
                            </div>
                          ))}

                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              value={commentText[item.id] || ''}
                              onChange={(e) => setCommentText({ ...commentText, [item.id]: e.target.value })}
                              placeholder="Add a comment..."
                              className="flex-1 input-field text-sm py-2"
                              onKeyPress={(e) => e.key === 'Enter' && addComment(item.id)}
                            />
                            <button
                              onClick={() => addComment(item.id)}
                              className="btn-primary p-2"
                              data-testid={`add-comment-${item.id}`}
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-12 text-center">
                <p className="text-slate-500">Select a list to view candidates</p>
              </div>
            )}
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="card p-6 w-full max-w-md animate-slide-up">
              <h3 className="text-lg font-semibold text-white mb-4">Share with Team</h3>
              <div className="space-y-2">
                {teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => shareWithTeam(team.id)}
                    className="w-full p-3 text-left bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <p className="font-medium text-white">{team.name}</p>
                    <p className="text-sm text-slate-400">{team.member_count} members</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full btn-secondary mt-4"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
