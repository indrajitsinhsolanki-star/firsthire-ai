import React from 'react';
import { useAuth } from '../App';
import { LogOut, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="glass sticky top-0 z-50 border-b border-slate-700/50" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="/" className="flex items-center gap-2" data-testid="nav-logo">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <span className="font-bold text-xl text-gradient">TalentGPT</span>
          </a>

          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center">
                  <span className="text-sm font-medium text-violet-300">
                    {user.full_name?.charAt(0) || user.email?.charAt(0)}
                  </span>
                </div>
                <span className="text-sm text-slate-400">{user.email}</span>
              </div>
              <button
                onClick={logout}
                className="btn-ghost flex items-center gap-2 text-slate-400 hover:text-red-400"
                data-testid="logout-btn"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
