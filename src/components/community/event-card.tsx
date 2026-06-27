'use client';

import React, { useState } from 'react';

interface EventCardProps {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  timezone: string;
  meetingUrl: string | null;
  price: number;
  isVirtual: boolean;
  initialRsvpStatus?: 'YES' | 'NO' | 'MAYBE' | null;
  onRsvp: (eventId: string, status: 'YES' | 'NO' | 'MAYBE') => Promise<void>;
}

/**
 * Premium Event Card supporting RSVP selections, virtual meeting link integrations
 * (Calendly, Zoom), and date formatting.
 */
export function EventCard(props: EventCardProps) {
  const [rsvpStatus, setRsvpStatus] = useState<'YES' | 'NO' | 'MAYBE' | null>(
    props.initialRsvpStatus || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRsvp = async (status: 'YES' | 'NO' | 'MAYBE') => {
    setIsSubmitting(true);
    try {
      await props.onRsvp(props.id, status);
      setRsvpStatus(status);
    } catch (err) {
      console.error('RSVP failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCalendly = props.meetingUrl?.includes('calendly.com');

  return (
    <div className="w-full bg-surface border border-border rounded-medium p-6 shadow-card hover:border-text-secondary transition-colors duration-150 select-none">
      {/* Event Header */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
            {props.isVirtual ? '🌐 Virtual Event' : '📍 In-Person Event'}
          </span>
          <h3 className="text-base font-bold text-text-primary mt-1">{props.title}</h3>
        </div>
        {props.price > 0 ? (
          <span className="bg-secondary/10 text-secondary text-xs font-bold px-2.5 py-1 rounded-full border border-secondary/20">
            ${Number(props.price).toFixed(2)}
          </span>
        ) : (
          <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full border border-primary/20">
            Free
          </span>
        )}
      </div>

      {/* Date & Time */}
      <div className="flex gap-4 items-center bg-background/50 border border-border rounded-small p-3 text-xs mb-4 text-text-primary">
        <div className="text-center bg-primary/10 text-primary px-3 py-1.5 rounded-small font-bold">
          <div className="text-base leading-none">
            {new Date(props.startAt).getDate()}
          </div>
          <div className="text-[9px] uppercase mt-0.5">
            {new Date(props.startAt).toLocaleDateString(undefined, { month: 'short' })}
          </div>
        </div>
        <div>
          <div className="font-semibold">
            {new Date(props.startAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {props.endAt && (
              <>
                {' '}
                -{' '}
                {new Date(props.endAt).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </>
            )}
          </div>
          <div className="text-text-secondary text-[10px] mt-0.5">
            Timezone: {props.timezone}
          </div>
        </div>
      </div>

      {/* Description */}
      {props.description && (
        <p className="text-xs text-text-secondary leading-relaxed mb-4 whitespace-pre-wrap">
          {props.description}
        </p>
      )}

      {/* External Scheduling Button (Calendly etc.) */}
      {props.meetingUrl && (
        <div className="mb-4">
          <a
            href={props.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center w-full py-2 rounded-small text-xs font-semibold border border-border bg-background hover:bg-border text-text-primary transition-colors cursor-pointer`}
          >
            {isCalendly ? '📅 Book Session on Calendly' : '📹 Join Meeting Room'}
          </a>
        </div>
      )}

      {/* RSVP Controls */}
      <div className="border-t border-border pt-4 select-none">
        <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block mb-2">
          Are you attending?
        </span>
        <div className="grid grid-cols-3 gap-2">
          {(['YES', 'NO', 'MAYBE'] as const).map((status) => (
            <button
              key={status}
              disabled={isSubmitting}
              onClick={() => handleRsvp(status)}
              className={`py-1.5 rounded-small text-xs font-semibold transition-all cursor-pointer ${
                rsvpStatus === status
                  ? status === 'YES'
                    ? 'bg-secondary text-white shadow-card'
                    : status === 'NO'
                    ? 'bg-danger text-white shadow-card'
                    : 'bg-warning text-white shadow-card'
                  : 'bg-background hover:bg-border border border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {status === 'YES' ? 'Yes' : status === 'NO' ? 'No' : 'Maybe'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
export default EventCard;
