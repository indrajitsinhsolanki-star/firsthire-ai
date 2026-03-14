import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Users, Plus, Trash2, UserPlus, Crown, Eye, Mail, CheckCircle, Clock } from 'lucide-react';

export default function TeamsPage() {
  const { api, user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Viewer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchMembers(selectedTeam.id);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const res = await api.get('/api/teams');
      setTeams(res.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (teamId) => {
    try {
      const res = await api.get(`/api/teams/${teamId}/members`);
      setMembers(res.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      const res = await api.post('/api/teams', { name: newTeamName });
      setNewTeamName('');
      setShowCreate(false);
      fetchTeams();
      setSelectedTeam(res.data);
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await api.post(`/api/teams/${selectedTeam.id}/invite`, {
        email: inviteEmail,
        role: inviteRole
      });
      setInviteEmail('');
      setInviteRole('Viewer');
      setShowInvite(false);
      fetchMembers(selectedTeam.id);
      alert('Invitation sent! The user can accept when they log in.');
    } catch (error) {
      if (error.response?.data?.detail === 'Already invited') {
        alert('This email has already been invited');
      } else {
        console.error('Error inviting member:', error);
      }
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/api/teams/${selectedTeam.id}/members/${memberId}`);
      fetchMembers(selectedTeam.id);
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  return (
    <div className="p-6" data-testid="teams-page">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="text-violet-400" />
            Team Collaboration
          </h1>
          <p className="text-slate-400">Invite team members, share shortlists, and collaborate on candidates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams List */}
          <div className="card p-5">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-semibold text-white">Your Teams</h2>
              <button
                onClick={() => setShowCreate(true)}
                className="btn-primary text-sm flex items-center gap-1.5"
                data-testid="create-team-btn"
              >
                <Plus size={16} />
                <span>New Team</span>
              </button>
            </div>

            <div className="space-y-2">
              {teams.length === 0 && !loading ? (
                <div className="text-center py-8">
                  <Users size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-500">No teams yet</p>
                  <p className="text-sm text-slate-600 mt-1">Create one to start collaborating</p>
                </div>
              ) : (
                teams.map(team => (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedTeam?.id === team.id
                        ? 'bg-violet-600/20 border border-violet-500/30'
                        : 'bg-slate-800/50 hover:bg-slate-700/50'
                    }`}
                    data-testid={`team-${team.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white flex items-center gap-2">
                          {team.name}
                          {team.is_owner && <Crown size={14} className="text-amber-400" />}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {showCreate && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Team name..."
                  className="input-field mb-3"
                  data-testid="team-name-input"
                />
                <div className="flex gap-2">
                  <button onClick={createTeam} className="flex-1 btn-primary" data-testid="create-team-submit">
                    Create
                  </button>
                  <button onClick={() => { setShowCreate(false); setNewTeamName(''); }} className="flex-1 btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Team Details */}
          <div className="lg:col-span-2">
            {selectedTeam ? (
              <div className="card p-5">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      {selectedTeam.name}
                      {selectedTeam.is_owner && (
                        <span className="badge badge-warning text-xs">Owner</span>
                      )}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      Created {new Date(selectedTeam.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedTeam.is_owner && (
                    <button
                      onClick={() => setShowInvite(true)}
                      className="btn-primary text-sm flex items-center gap-1.5"
                      data-testid="invite-member-btn"
                    >
                      <UserPlus size={16} />
                      Invite Member
                    </button>
                  )}
                </div>

                {/* Members List */}
                <h3 className="text-sm font-medium text-slate-300 mb-3">Team Members</h3>
                <div className="space-y-2">
                  {members.map(member => (
                    <div key={member.id} className="bg-slate-900/50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-600/30 flex items-center justify-center">
                          <span className="text-sm font-medium text-violet-300">
                            {member.user?.full_name?.charAt(0) || member.invited_email?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white flex items-center gap-2">
                            {member.user?.full_name || member.invited_email}
                            {member.status === 'pending' && (
                              <span className="badge badge-warning text-xs flex items-center gap-1">
                                <Clock size={10} />
                                Pending
                              </span>
                            )}
                            {member.status === 'active' && member.user && (
                              <CheckCircle size={14} className="text-emerald-400" />
                            )}
                          </p>
                          <p className="text-sm text-slate-500">{member.user?.email || member.invited_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`badge ${member.role === 'Admin' ? 'badge-primary' : 'badge-info'} flex items-center gap-1`}>
                          {member.role === 'Admin' ? <Crown size={12} /> : <Eye size={12} />}
                          {member.role}
                        </span>
                        {selectedTeam.is_owner && member.user_id !== user?.id && (
                          <button
                            onClick={() => removeMember(member.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                            data-testid={`remove-member-${member.id}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Role Info */}
                <div className="mt-6 p-4 bg-slate-900/30 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Role Permissions</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-violet-400 flex items-center gap-1 mb-1">
                        <Crown size={14} /> Admin
                      </p>
                      <ul className="text-slate-500 space-y-1 text-xs">
                        <li>View shared shortlists</li>
                        <li>Add comments</li>
                        <li>Invite new members</li>
                        <li>Manage team settings</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-cyan-400 flex items-center gap-1 mb-1">
                        <Eye size={14} /> Viewer
                      </p>
                      <ul className="text-slate-500 space-y-1 text-xs">
                        <li>View shared shortlists</li>
                        <li>Add comments</li>
                        <li>Read-only access</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <Users size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-500">Select a team to view members</p>
              </div>
            )}
          </div>
        </div>

        {/* Invite Modal */}
        {showInvite && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 w-full max-w-md animate-slide-up">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Mail className="text-violet-400" />
                Invite Team Member
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-field"
                    placeholder="colleague@company.com"
                    data-testid="invite-email-input"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="input-field"
                    data-testid="invite-role-select"
                  >
                    <option value="Viewer">Viewer - Can view and comment</option>
                    <option value="Admin">Admin - Can manage team</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={inviteMember} className="flex-1 btn-primary" data-testid="send-invite-btn">
                  Send Invitation
                </button>
                <button onClick={() => { setShowInvite(false); setInviteEmail(''); }} className="flex-1 btn-secondary">
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
