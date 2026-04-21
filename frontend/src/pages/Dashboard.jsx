import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Search, Heart, BarChart3, Send, Bot, Users, DollarSign, Shield } from 'lucide-react';
import SearchPage from './SearchPage';
import ShortlistsPage from './ShortlistsPage';
import InsightsPage from './InsightsPage';
import OutreachPage from './OutreachPage';
import AgentsPage from './AgentsPage';
import TeamsPage from './TeamsPage';
import PricingPage from './PricingPage';
import VerifyCandidatePage from './VerifyCandidatePage';

export default function Dashboard() {
  const { api } = useAuth();
  const [currentPage, setCurrentPage] = useState('search');

  // Seed database on first load
  useEffect(() => {
    api.post('/api/seed').catch(() => {});
  }, [api]);

  const navItems = [
    { id: 'search', label: 'Search', icon: Search },
    { id: 'verify', label: 'Verify', icon: Shield, isNew: true },
    { id: 'shortlists', label: 'Shortlists', icon: Heart },
    { id: 'agents', label: 'AI Agents', icon: Bot },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'outreach', label: 'Outreach', icon: Send },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'search':
        return <SearchPage />;
      case 'verify':
        return <VerifyCandidatePage />;
      case 'shortlists':
        return <ShortlistsPage />;
      case 'agents':
        return <AgentsPage />;
      case 'teams':
        return <TeamsPage />;
      case 'outreach':
        return <OutreachPage />;
      case 'insights':
        return <InsightsPage />;
      case 'pricing':
        return <PricingPage />;
      default:
        return <SearchPage />;
    }
  };

  return (
    <div data-testid="dashboard">
      {/* Mobile Navigation */}
      <div className="md:hidden glass border-b border-slate-700/50 sticky top-16 z-40 overflow-x-auto">
        <div className="flex px-2 py-2 gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all text-sm ${
                  currentPage === item.id
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                data-testid={`nav-${item.id}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.isNew && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-full">
                    NEW
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 min-h-[calc(100vh-4rem)] glass border-r border-slate-700/50 p-4 sticky top-16">
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full nav-item justify-between ${currentPage === item.id ? 'nav-item-active' : ''}`}
                  data-testid={`nav-${item.id}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {item.isNew && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-full animate-pulse">
                      NEW
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] flex flex-col">
          <div className="flex-1">
            {renderPage()}
          </div>
          {/* Footer */}
          <footer className="border-t border-slate-700/50 py-6 px-6 text-center">
            <p className="text-sm text-slate-500">
              © 2026 FirstHire.ai. All rights reserved.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
