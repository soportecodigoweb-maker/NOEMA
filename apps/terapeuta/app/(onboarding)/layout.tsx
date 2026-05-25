import { Vesica } from '@/components/ui/Vesica';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-8 py-6 border-b border-noema-deep/[0.06]">
        <div className="flex items-center gap-3 text-noema-deep">
          <Vesica size={24} color="currentColor" strokeWidth={1.5} />
          <span className="font-serif text-lg tracking-[0.34em]">NOEMA</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">{children}</div>
      </main>
    </div>
  );
}
