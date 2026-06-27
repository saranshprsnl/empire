'use client';

import React, { useState } from 'react';

interface PostComposerProps {
  onSubmit: (data: { title: string; content: string; isAnnouncement: boolean }) => void;
  isStaff: boolean;
}

/**
 * Premium Post Composer with dynamic expansion, inline markdown focus helper,
 * and announcements switches for creators or community managers.
 */
export function PostComposer({ onSubmit, isStaff }: PostComposerProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSubmit({ title, content, isAnnouncement });
    setTitle('');
    setContent('');
    setIsAnnouncement(false);
    setIsExpanded(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-surface border border-border rounded-medium p-4 shadow-card transition-all duration-200"
    >
      <div className="space-y-3">
        {/* Dynamic Title Input */}
        {isExpanded && (
          <input
            type="text"
            placeholder="Post Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border-b border-border bg-transparent text-text-primary focus:outline-none focus:border-primary placeholder:text-text-secondary font-semibold"
          />
        )}

        {/* Text Area */}
        <textarea
          placeholder="Share something with the community..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          rows={isExpanded ? 4 : 1}
          className="w-full px-3 py-1.5 text-sm bg-transparent border-0 text-text-primary focus:outline-none placeholder:text-text-secondary resize-none"
        />

        {/* Control Footer */}
        {isExpanded && (
          <div className="flex items-center justify-between border-t border-border pt-3 select-none">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="text-xs font-medium text-text-secondary hover:text-text-primary flex items-center gap-1 cursor-pointer transition-colors duration-150"
              >
                📸 Add Media
              </button>
              {isStaff && (
                <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary cursor-pointer hover:text-text-primary transition-colors duration-150">
                  <input
                    type="checkbox"
                    checked={isAnnouncement}
                    onChange={(e) => setIsAnnouncement(e.target.checked)}
                    className="accent-primary w-3.5 h-3.5"
                  />
                  <span>Announce</span>
                </label>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-4 py-1.5 text-xs border border-border hover:bg-border rounded-small font-semibold text-text-primary cursor-pointer transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!content.trim()}
                className="px-4 py-1.5 text-xs bg-primary hover:bg-primary-dark text-white rounded-small font-semibold shadow-card transition-all duration-150 disabled:opacity-40 cursor-pointer"
              >
                Post
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
export default PostComposer;
