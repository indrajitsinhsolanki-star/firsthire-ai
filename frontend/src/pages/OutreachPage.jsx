import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Mail, Clock, CheckCircle, Send, Loader } from 'lucide-react';

export default function OutreachPage() {
  const { api } = useAuth();
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState({});

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    try {
      const res = await api.get('/api/outreach');
      setSequences(res.data);
    } catch (error) {
      console.error('Error fetching sequences:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async (sequenceId, emailType) => {
    setSendingEmail({ ...sendingEmail, [sequenceId]: true });
    try {
      await api.post(`/api/outreach/${sequenceId}/send`, { email_type: emailType });
      fetchSequences();
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email');
    } finally {
      setSendingEmail({ ...sendingEmail, [sequenceId]: false });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Not Started':
        return <Mail size={20} className="text-slate-500" />;
      case 'In Progress':
        return <Clock size={20} className="text-amber-400" />;
      case 'Completed':
        return <CheckCircle size={20} className="text-emerald-400" />;
      default:
        return <Mail size={20} />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Not Started': return 'badge-info';
      case 'In Progress': return 'badge-warning';
      case 'Completed': return 'badge-success';
      default: return 'badge-info';
    }
  };

  return (
    <div className="p-6" data-testid="outreach-page">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Send className="text-violet-400" />
            Outreach Sequences
          </h1>
          <p className="text-slate-400">AI-generated emails for candidate outreach</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader className="animate-spin mx-auto mb-4 text-violet-400" size={32} />
            <p className="text-slate-400">Loading sequences...</p>
          </div>
        ) : sequences.length === 0 ? (
          <div className="card p-12 text-center" data-testid="no-sequences">
            <Mail size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">No outreach sequences yet</p>
            <p className="text-sm text-slate-500 mt-2">
              Start reaching out to candidates from search results
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sequences.map(sequence => (
              <div key={sequence.id} className="card p-6 animate-slide-up" data-testid={`sequence-${sequence.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getStatusIcon(sequence.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {sequence.candidate?.name}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {sequence.candidate?.title} at {sequence.candidate?.company}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {sequence.candidate?.email}
                      </p>
                    </div>
                  </div>

                  <span className={`badge ${getStatusBadge(sequence.status)}`}>
                    {sequence.status}
                  </span>
                </div>

                {/* Email 1 */}
                {sequence.email_1_sent_at ? (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={14} className="text-emerald-400" />
                      <p className="text-xs font-medium text-slate-300">
                        Email 1 sent {new Date(sequence.email_1_sent_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {sequence.email_1_content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => sendEmail(sequence.id, 'initial')}
                    disabled={sendingEmail[sequence.id]}
                    className="mt-4 btn-primary flex items-center gap-2"
                    data-testid={`send-email-1-${sequence.id}`}
                  >
                    {sendingEmail[sequence.id] ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Generate & Send Email 1
                  </button>
                )}

                {/* Email 2 */}
                {sequence.email_1_sent_at && (
                  <>
                    {sequence.email_2_sent_at ? (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle size={14} className="text-emerald-400" />
                          <p className="text-xs font-medium text-slate-300">
                            Follow-up sent {new Date(sequence.email_2_sent_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {sequence.email_2_content}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => sendEmail(sequence.id, 'followup')}
                        disabled={sendingEmail[sequence.id]}
                        className="mt-4 btn-secondary flex items-center gap-2"
                        data-testid={`send-email-2-${sequence.id}`}
                      >
                        {sendingEmail[sequence.id] ? (
                          <Loader size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                        Generate & Send Follow-up
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
