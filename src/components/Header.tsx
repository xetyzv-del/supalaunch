import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export type WorkspaceTab = 'crux' | 'classroom' | 'prelims' | 'mains' | 'hub' | 'admin';

interface HeaderProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenPortal: () => void;
  userDisplayName: string;
  isStaff?: boolean;
}

const BASE_NAV_ITEMS: { id: WorkspaceTab; label: string }[] = [
  { id: 'crux', label: 'Daily Crux' },
  { id: 'classroom', label: 'Classroom' },
  { id: 'prelims', label: 'Prelims' },
  { id: 'mains', label: 'Mains Lab' },
  { id: 'hub', label: 'Study Hub' },
];

export function Header({ activeTab, onSelectTab, onOpenPortal, userDisplayName, isStaff }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = isStaff
    ? [...BASE_NAV_ITEMS, { id: 'admin' as const, label: 'Admin Dashboard' }]
    : BASE_NAV_ITEMS;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => onSelectTab('crux')}
          className="font-serif text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap hover:text-amber-700 transition-colors cursor-pointer"
        >
          CivilEdge <span className="text-amber-600 font-extrabold">IAS</span>
        </button>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-7">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive ? 'text-amber-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {item.id === 'admin' ? (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Pro
                  </span>
                ) : null}
                {isActive ? (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-amber-600 rounded-full" />
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenPortal}
            title={`Signed in as ${userDisplayName}`}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 whitespace-nowrap hover:bg-amber-400 shadow-xs transition-all cursor-pointer"
          >
            {isStaff ? 'Faculty Portal' : 'Aspirant Portal'}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="md:hidden rounded-lg p-2 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  isActive ? 'bg-amber-50 text-amber-800 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </header>
  );
}
