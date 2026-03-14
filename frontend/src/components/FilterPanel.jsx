import React from 'react';
import { Filter } from 'lucide-react';

export default function FilterPanel({ filters }) {
  return (
    <div className="w-64 flex-shrink-0 hidden lg:block" data-testid="filter-panel">
      <div className="card p-5 sticky top-36">
        <div className="flex items-center gap-2 mb-5">
          <Filter size={18} className="text-violet-400" />
          <h2 className="font-semibold text-white">Filters Applied</h2>
        </div>

        <div className="space-y-4">
          {filters.seniority && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Seniority</p>
              <span className="badge badge-primary">{filters.seniority}</span>
            </div>
          )}

          {filters.location && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Location</p>
              <span className="badge badge-primary">{filters.location}</span>
            </div>
          )}

          {filters.skills && filters.skills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {filters.skills.map((skill, i) => (
                  <span key={i} className="badge badge-info">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {filters.industry && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Industry</p>
              <span className="badge badge-primary">{filters.industry}</span>
            </div>
          )}

          {filters.experience_years && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Experience</p>
              {filters.experience_years.min && (
                <p className="text-sm text-slate-300">Min: {filters.experience_years.min} years</p>
              )}
              {filters.experience_years.max && (
                <p className="text-sm text-slate-300">Max: {filters.experience_years.max} years</p>
              )}
            </div>
          )}

          {!Object.keys(filters || {}).length && (
            <p className="text-sm text-slate-500 text-center py-4">
              AI will extract filters from your search query
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
