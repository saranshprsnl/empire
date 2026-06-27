'use client';

import React, { useState } from 'react';

interface ReactionBarProps {
  postId: string;
  initialLikes: number;
  initialComments: number;
  onLike: () => void;
}

/**
 * Premium Reaction Bar with micro-animations and local optimistic state updates.
 */
export function ReactionBar({ initialLikes, initialComments, onLike }: ReactionBarProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);

  const handleLike = () => {
    if (hasLiked) {
      setLikes((prev) => prev - 1);
    } else {
      setLikes((prev) => prev + 1);
    }
    setHasLiked((prev) => !prev);
    onLike();
  };

  return (
    <div className="flex items-center gap-6 border-t border-border pt-4 mt-4 text-sm text-text-secondary select-none">
      <button
        onClick={handleLike}
        className={`flex items-center gap-2 cursor-pointer transition-colors duration-150 ${
          hasLiked ? 'text-primary font-semibold' : 'hover:text-text-primary'
        }`}
      >
        <span className={`transform transition-transform active:scale-150 duration-150`}>
          {hasLiked ? '❤️' : '🤍'}
        </span>
        <span>
          {likes} {likes === 1 ? 'Like' : 'Likes'}
        </span>
      </button>

      <button className="flex items-center gap-2 hover:text-text-primary cursor-pointer transition-colors duration-150">
        <span>💬</span>
        <span>
          {initialComments} {initialComments === 1 ? 'Comment' : 'Comments'}
        </span>
      </button>
    </div>
  );
}
export default ReactionBar;
