import React from 'react';
import { MatchBreakdown } from '../../types';
import { X, CheckCircle2, AlertTriangle, Sparkles, MapPin, Briefcase, IndianRupee, Clock, Award } from 'lucide-react';

interface MatchScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  matchBreakdown?: MatchBreakdown;
  matchScore?: number;
}

export const MatchScoreModal: React.FC<MatchScoreModalProps> = ({
  isOpen,
  onClose,
  jobTitle,
  matchBreakdown,
  matchScore
}) => {
  if (!isOpen || !matchBreakdown) return null;

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const scoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const pillars = [
    { label: 'Skills Match', weight: '35%', score: matchBreakdown.skills_match, icon: Award },
    { label: 'Experience Match', weight: '25%', score: matchBreakdown.experience_match, icon: Clock },
    { label: 'Location Proximity', weight: '15%', score: matchBreakdown.location_match, icon: MapPin },
    { label: 'Salary Compatibility', weight: '15%', score: matchBreakdown.salary_match, icon: IndianRupee },
    { label: 'Profession Alignment', weight: '10%', score: matchBreakdown.profession_match, icon: Briefcase },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">AI Match Analysis</h3>
              <p className="text-xs text-slate-400 truncate max-w-sm">{jobTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Main Score Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-800/80 to-slate-800/40 border border-indigo-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Overall AI Compatibility
              </span>
              <p className="text-sm text-slate-300 mt-1">
                Multi-dimensional match based on your verified credentials & job parameters.
              </p>
            </div>
            <div className={`px-4 py-3 rounded-2xl font-black text-3xl border ${scoreColor(matchScore || matchBreakdown.overall_match)}`}>
              {matchScore || matchBreakdown.overall_match}%
            </div>
          </div>

          {/* 5 Pillars Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              5-Pillar Score Breakdown
            </h4>
            <div className="space-y-3">
              {pillars.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.label} className="bg-slate-800/40 border border-slate-700/50 p-3.5 rounded-xl">
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Icon className="w-4 h-4 text-indigo-400" />
                        <span>{p.label}</span>
                        <span className="text-slate-500 text-[11px]">({p.weight})</span>
                      </div>
                      <span className="font-bold text-white">{p.score}%</span>
                    </div>
                    <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(p.score)}`}
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Why this job matches: Explanation bullets */}
          {matchBreakdown.explanations && matchBreakdown.explanations.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Why This Job Matches You
              </h4>
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-4 space-y-2.5">
                {matchBreakdown.explanations.map((exp, idx) => {
                  const isPositive = exp.startsWith('✓');
                  return (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                      {isPositive ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={isPositive ? 'text-slate-200' : 'text-slate-400'}>
                        {exp.replace(/^[✓△]\s*/, '')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};

