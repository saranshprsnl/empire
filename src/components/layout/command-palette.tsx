'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  category: string;
  name: string;
  shortcut?: string;
  action: () => void;
}

/**
 * Premium Command Palette (Cmd+K) dialogue overlay providing instant,
 * searchable routing redirects across the Creator Admin panel.
 */
export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input field immediately upon overlay trigger
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    {
      id: 'feed',
      category: 'Community',
      name: 'Go to Community Feed',
      shortcut: 'G F',
      action: () => {
        router.push('/dashboard/community/feed');
        onClose();
      },
    },
    {
      id: 'members',
      category: 'CRM',
      name: 'Go to Member Directory',
      shortcut: 'G M',
      action: () => {
        router.push('/dashboard/crm/members');
        onClose();
      },
    },
    {
      id: 'courses',
      category: 'Content',
      name: 'Go to Courses Builder',
      shortcut: 'G C',
      action: () => {
        router.push('/dashboard/content/courses');
        onClose();
      },
    },
    {
      id: 'tasks',
      category: 'Team',
      name: 'Go to Operations Tasks',
      shortcut: 'G T',
      action: () => {
        router.push('/dashboard/team/tasks');
        onClose();
      },
    },
    {
      id: 'settings',
      category: 'Settings',
      name: 'Go to Workspace Settings',
      shortcut: 'G S',
      action: () => {
        router.push('/dashboard/settings/general');
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  // Setup click listeners and escape routes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/70 backdrop-blur-xs z-50 flex items-start justify-center pt-24 px-4 select-none">
      <div
        className="w-full max-w-lg bg-surface border border-border shadow-elevated rounded-medium overflow-hidden transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center gap-3 border-b border-border p-4 bg-background">
          <span className="text-text-secondary text-sm">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search page..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent text-text-primary border-0 focus:outline-none placeholder:text-text-secondary"
          />
          <button
            onClick={onClose}
            className="text-[10px] px-2 py-1 bg-border border border-border rounded-small text-text-secondary font-semibold hover:bg-border/80 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1 bg-surface">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className="w-full flex justify-between items-center px-4 py-2.5 hover:bg-primary/10 hover:text-primary rounded-small text-left text-xs text-text-primary transition-all cursor-pointer font-semibold"
              >
                <div className="flex gap-2.5 items-center">
                  <span className="text-[10px] uppercase font-bold text-text-secondary bg-border px-1.5 py-0.5 rounded-small select-none">
                    {cmd.category}
                  </span>
                  <span>{cmd.name}</span>
                </div>
                {cmd.shortcut && (
                  <span className="font-mono text-[9px] opacity-60 bg-border px-1.5 py-0.5 rounded-small select-none">
                    {cmd.shortcut}
                  </span>
                )}
              </button>
            ))
          ) : (
            <p className="text-xs text-text-secondary italic text-center py-6">
              No matching commands found.
            </p>
          )}
        </div>
      </div>
      {/* Click outside to close helper */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
export default CommandPalette;
