'use client';

import React from 'react';
import { ReactionBar } from './reaction-bar';

interface FeedPostProps {
  id: string;
  title: string | null;
  content: string;
  createdAt: Date;
  likes: number;
  comments: number;
  isPinned?: boolean;
  isAnnouncement?: boolean;
  posterName: string;
  posterAvatarUrl: string | null;
  posterBadge?: 'CREATOR' | 'MEMBER' | 'STAFF';
  onLike: () => void;
}

/**
 * Premium Community Feed Post displaying avatar initials, title, body content,
 * announcement/pin tags, and integrated reaction bar controls.
 */
export function FeedPost(props: FeedPostProps) {
  // Safe parsing for avatar initials
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="w-full bg-surface border border-border rounded-medium p-6 shadow-card hover:border-text-secondary transition-colors duration-150">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {props.posterAvatarUrl ? (
            <img
              src={props.posterAvatarUrl}
              alt={props.posterName}
              className="w-10 h-10 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {getInitials(props.posterName)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary text-sm">{props.posterName}</span>
              {props.posterBadge && (
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    props.posterBadge === 'CREATOR'
                      ? 'bg-primary/20 text-primary'
                      : props.posterBadge === 'STAFF'
                      ? 'bg-warning/20 text-warning'
                      : 'bg-secondary/20 text-secondary'
                  }`}
                >
                  {props.posterBadge}
                </span>
              )}
            </div>
            <span className="text-xs text-text-secondary">
              {new Date(props.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Status Badges */}
        {(props.isPinned || props.isAnnouncement) && (
          <div className="flex gap-1.5">
            {props.isPinned && (
              <span className="text-[10px] px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full font-semibold flex items-center gap-1 select-none">
                📌 Pinned
              </span>
            )}
            {props.isAnnouncement && (
              <span className="text-[10px] px-2.5 py-0.5 bg-warning/10 text-warning border border-warning/20 rounded-full font-semibold flex items-center gap-1 select-none">
                📢 Announcement
              </span>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        {props.title && (
          <h3 className="text-base font-bold mb-1 text-text-primary">{props.title}</h3>
        )}
        <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">
          {props.content}
        </p>
      </div>

      {/* Reaction & Action Controls */}
      <ReactionBar
        postId={props.id}
        initialLikes={props.likes}
        initialComments={props.comments}
        onLike={props.onLike}
      />
    </div>
  );
}
export default FeedPost;
