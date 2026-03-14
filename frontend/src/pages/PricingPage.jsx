import React from 'react';
import { Check, Sparkles, Bot, Users } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      searches: '5 searches/month',
      features: [
        'AI-powered natural language search',
        'Candidate profiles',
        'Basic filtering',
        'Save up to 3 shortlists',
        'Email support',
      ]
    },
    {
      name: 'Growth',
      price: '$99',
      period: '/month',
      searches: 'Unlimited searches',
      features: [
        'Everything in Free',
        'Unlimited AI searches',
        'AI-generated outreach emails',
        'Outreach sequences',
        'Talent insights dashboard',
        'Priority support',
      ],
      highlighted: true
    },
    {
      name: 'Business',
      price: '$299',
      period: '/month',
      searches: 'Unlimited everything',
      features: [
        'Everything in Growth',
        'AI Recruiting Agents',
        'Team collaboration',
        'Shared shortlists',
        'Role-based access',
        'CSV exports',
        'API access',
        'Dedicated account manager',
      ]
    }
  ];

  return (
    <div className="p-6" data-testid="pricing-page">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-slate-400">Choose the plan that fits your recruiting needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`card overflow-hidden transition-all hover:scale-105 ${
                plan.highlighted 
                  ? 'ring-2 ring-violet-500 shadow-lg shadow-violet-500/20' 
                  : ''
              }`}
              data-testid={`pricing-plan-${plan.name.toLowerCase()}`}
            >
              {plan.highlighted && (
                <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-2 text-center text-sm font-bold">
                  MOST POPULAR
                </div>
              )}

              <div className="p-8">
                <h2 className="text-2xl font-bold text-white mb-2">{plan.name}</h2>
                <div className="mb-1">
                  <span className="text-4xl font-bold text-gradient">{plan.price}</span>
                  {plan.period && <span className="text-lg text-slate-400">{plan.period}</span>}
                </div>
                <p className="text-sm text-slate-500 mb-6">{plan.searches}</p>

                <button
                  className={`w-full py-3 px-4 rounded-lg font-medium mb-8 transition-all ${
                    plan.highlighted
                      ? 'btn-primary'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  Get Started
                </button>

                <div className="space-y-4">
                  {plan.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-start gap-3">
                      <Check size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-violet-400" />
            </div>
            <h3 className="font-bold text-white mb-2">AI-Powered Search</h3>
            <p className="text-sm text-slate-400">
              Natural language queries powered by Claude AI for intelligent candidate matching
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
              <Bot className="text-cyan-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Recruiting Agents</h3>
            <p className="text-sm text-slate-400">
              Autonomous AI agents that source candidates 24/7 based on your criteria
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <Users className="text-emerald-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Team Collaboration</h3>
            <p className="text-sm text-slate-400">
              Share shortlists, add comments, and collaborate with your hiring team
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 card p-8">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-white mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-slate-400 text-sm">Yes! You can change your plan at any time. Changes take effect immediately.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">What payment methods do you accept?</h3>
              <p className="text-slate-400 text-sm">We accept all major credit cards and bank transfers for annual plans.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Is there a free trial?</h3>
              <p className="text-slate-400 text-sm">Yes! Start with our Free plan to explore FirstHire.ai with no credit card required.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">How do AI Recruiting Agents work?</h3>
              <p className="text-slate-400 text-sm">Agents run autonomously based on your criteria, finding and shortlisting candidates even when you're offline.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
