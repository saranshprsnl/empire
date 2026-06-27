import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export const metadata = {
  title: 'Onboarding - Empire',
  description: 'Launch your community-first business operating system in minutes.',
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">EMPIRE</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Build, monetize, and scale your audience on native channels.
        </p>
      </div>
      <OnboardingWizard />
    </div>
  );
}
