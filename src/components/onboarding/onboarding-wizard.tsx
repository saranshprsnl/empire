'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type OnboardingStep =
  | 'BUSINESS_IDENTITY'
  | 'TOOL_STACK'
  | 'STRIPE_CONNECT'
  | 'MEMBER_IMPORT'
  | 'TEAM_INVITE'
  | 'AI_GENERATION';

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('BUSINESS_IDENTITY');
  
  // Form State
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [niche, setNiche] = useState('fitness');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isStripeConnected, setIsStripeConnected] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [teamEmails, setTeamEmails] = useState<string[]>(['']);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Computed Values
  const stepsOrder: OnboardingStep[] = [
    'BUSINESS_IDENTITY',
    'TOOL_STACK',
    'STRIPE_CONNECT',
    'MEMBER_IMPORT',
    'TEAM_INVITE',
    'AI_GENERATION',
  ];
  const stepIndex = stepsOrder.indexOf(currentStep);

  const handleNext = () => {
    if (currentStep === 'TEAM_INVITE') {
      setCurrentStep('AI_GENERATION');
      triggerAIGeneration();
    } else {
      const nextIndex = stepIndex + 1;
      if (nextIndex < stepsOrder.length) {
        setCurrentStep(stepsOrder[nextIndex]);
      }
    }
  };

  const handleBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(stepsOrder[prevIndex]);
    }
  };

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const addTeamEmailField = () => {
    setTeamEmails((prev) => [...prev, '']);
  };

  const updateTeamEmail = (index: number, val: string) => {
    setTeamEmails((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const triggerAIGeneration = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setGenerationProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        // Cache the newly active tenant slug for testing convenience
        localStorage.setItem('active_tenant_slug', slug || 'fitness-coaching');
        router.push('/dashboard');
      }
    }, 300);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-surface border border-border rounded-medium p-8 shadow-card">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-text-secondary">
            Step {stepIndex + 1} of {stepsOrder.length}
          </span>
          <span className="text-sm font-bold text-primary">
            {Math.round(((stepIndex + 1) / stepsOrder.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / stepsOrder.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px] mb-8">
        {currentStep === 'BUSINESS_IDENTITY' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Identify your space</h2>
            <p className="text-text-secondary mb-6 text-sm">
              Let's create the branding and web access path for your new community platform.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Training Academy"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  className="w-full px-4 py-2 border border-border rounded-small bg-background text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Portal Web Link (slug)</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-border rounded-l-small bg-border text-text-secondary text-sm">
                    empire.com/community/
                  </span>
                  <input
                    type="text"
                    placeholder="apex-academy"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                    className="w-full px-4 py-2 border border-border rounded-r-small bg-background text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Niche Niche</label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-small bg-background text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="fitness">Fitness & Athletics</option>
                  <option value="courses">Business & Career Coaching</option>
                  <option value="crypto">Crypto & Finance</option>
                  <option value="hobbies">Creative Arts & Hobbies</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'TOOL_STACK' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Select your current stack</h2>
            <p className="text-text-secondary mb-6 text-sm">
              Select the systems you currently use. AI will calculate the migration effort.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {['Skool', 'Circle', 'Kajabi', 'Patreon', 'ConvertKit', 'Teachable'].map((tool) => (
                <button
                  key={tool}
                  onClick={() => toggleTool(tool)}
                  className={`flex items-center justify-between p-4 border rounded-medium text-left transition-all ${
                    selectedTools.includes(tool)
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-background text-text-primary hover:border-text-secondary'
                  }`}
                >
                  <span>{tool}</span>
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                      selectedTools.includes(tool)
                        ? 'border-primary bg-primary text-white'
                        : 'border-border'
                    }`}
                  >
                    {selectedTools.includes(tool) && '✓'}
                  </span>
                </button>
              ))}
            </div>

            {selectedTools.length > 0 && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-medium">
                <h4 className="text-sm font-bold text-primary mb-1">⚡ AI Migration Estimate</h4>
                <p className="text-xs text-text-secondary">
                  Based on your selected stack ({selectedTools.join(', ')}), AI estimates migration will take{' '}
                  <span className="font-semibold text-text-primary">~15 minutes</span> with{' '}
                  <span className="font-semibold text-text-primary">100% data fidelity</span> (members, course structure, and history).
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep === 'STRIPE_CONNECT' && (
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold mb-2">Setup payouts</h2>
            <p className="text-text-secondary mb-8 text-sm">
              Connect your bank account via Stripe to collect membership subscriptions.
            </p>
            <div className="max-w-sm mx-auto p-8 border border-border rounded-medium bg-background">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                💳
              </div>
              <h3 className="font-bold mb-2">Stripe Connect</h3>
              <p className="text-xs text-text-secondary mb-6">
                Receive credit card payouts instantly. Empire keeps 100% of your earnings minus standard Stripe fees.
              </p>
              {isStripeConnected ? (
                <div className="p-3 bg-secondary/10 text-secondary rounded-small border border-secondary/20 text-sm font-semibold flex items-center justify-center gap-2">
                  ✓ Stripe Linked Successfully
                </div>
              ) : (
                <button
                  onClick={() => setIsStripeConnected(true)}
                  className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-small font-semibold transition-all shadow-card cursor-pointer"
                >
                  Connect Stripe Account
                </button>
              )}
            </div>
          </div>
        )}

        {currentStep === 'MEMBER_IMPORT' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Import your members</h2>
            <p className="text-text-secondary mb-6 text-sm">
              Upload a members CSV export from Skool, Circle, or Kajabi.
            </p>
            <div className="border-2 border-dashed border-border hover:border-primary rounded-medium p-8 text-center cursor-pointer bg-background transition-all">
              <div className="text-3xl mb-2">📁</div>
              <h4 className="font-bold text-sm mb-1">Drag and drop your members CSV here</h4>
              <p className="text-xs text-text-secondary mb-4">Or click to select file from finder</p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setCsvFile(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="px-4 py-2 bg-surface hover:bg-border text-text-primary border border-border rounded-small text-xs font-semibold cursor-pointer"
              >
                Choose File
              </label>
              {csvFile && (
                <p className="mt-4 text-xs font-semibold text-secondary">
                  Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          </div>
        )}

        {currentStep === 'TEAM_INVITE' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Invite your crew</h2>
            <p className="text-text-secondary mb-6 text-sm">
              Send passwordless magic links to your editors, community managers, or VAs.
            </p>
            <div className="space-y-3">
              {teamEmails.map((email, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="crew@youracademy.com"
                    value={email}
                    onChange={(e) => updateTeamEmail(idx, e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-small bg-background text-text-primary focus:outline-none focus:border-primary"
                  />
                  <select className="px-3 border border-border rounded-small bg-background text-text-primary">
                    <option value="COMMUNITY_MANAGER">Moderator</option>
                    <option value="EDITOR">Editor</option>
                    <option value="VA">VA Support</option>
                  </select>
                </div>
              ))}
              <button
                onClick={addTeamEmailField}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                + Add Another Email
              </button>
            </div>
          </div>
        )}

        {currentStep === 'AI_GENERATION' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">AI Business Manager Config</h2>
            <p className="text-text-secondary mb-8 text-sm">
              Generating welcome sequences, setting up default channels, and drafting your first 30-day content calendar.
            </p>
            <div className="max-w-md mx-auto">
              <div className="w-full h-3 bg-border rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <span className="text-sm font-bold text-primary">{generationProgress}% Completed</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      {currentStep !== 'AI_GENERATION' && (
        <div className="flex justify-between border-t border-border pt-6">
          <button
            onClick={handleBack}
            disabled={stepIndex === 0}
            className="px-6 py-2 bg-surface hover:bg-border border border-border rounded-small text-text-primary font-semibold disabled:opacity-40 cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={currentStep === 'BUSINESS_IDENTITY' && (!businessName || !slug)}
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-small font-semibold transition-all shadow-card disabled:opacity-40 cursor-pointer"
          >
            {currentStep === 'TEAM_INVITE' ? 'Finish & Launch' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}
export default OnboardingWizard;
