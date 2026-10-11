import React, { useState } from 'react';
import { Star, X, Database } from 'lucide-react';
import { fetchJson } from '../api/client';

interface RatingModalProps {
  movieId: string | null;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({ movieId, userId, onClose, onSuccess }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  if (!movieId) return null;

  const displayRating = hoverRating || rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    try {
      await fetchJson(`/movies/${movieId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, movie_id: movieId, rating_value: rating }),
      });
      setMessage({ text: `Rating of ${rating}★ persisted to Neo4j!`, ok: true });
      setTimeout(() => { onSuccess(); onClose(); }, 900);
    } catch (err: any) {
      setMessage({ text: `Error: ${err.message}`, ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  const LABELS: Record<number, string> = {
    1: 'Terrible', 2: 'Poor', 3: 'Okay', 4: 'Good', 5: 'Excellent',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background: '#111118' }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h3 className="font-heading font-bold text-white">Rate This Film</h3>
            <p className="text-[11px] text-[#5a5a6e] mt-0.5 font-mono">
              MERGE (u)-[:RATED]→(m) · Live Neo4j write
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5a5a6e] hover:text-white hover:bg-white/8 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col items-center gap-4">
          {/* Star Row */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setRating(v)}
                onMouseEnter={() => setHoverRating(v)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-9 h-9 transition-colors duration-100 ${
                    v <= displayRating ? 'fill-amber-400 text-amber-400' : 'text-[#2a2a3a]'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Label */}
          <div className="h-6 flex items-center">
            {displayRating > 0 ? (
              <span className="text-base font-bold font-heading text-amber-400">
                {displayRating}★ — {LABELS[displayRating]}
              </span>
            ) : (
              <span className="text-sm text-[#5a5a6e]">Select your rating</span>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className={`w-full text-xs font-mono text-center px-3 py-2 rounded-lg border ${
              message.ok
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-red-950/40 border-red-500/30 text-red-300'
            }`}>
              {message.text}
            </div>
          )}

          {/* Buttons */}
          <div className="w-full flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#a3a3b3] hover:text-white border border-white/8 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !rating}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              style={{ background: rating ? '#e50914' : '#2a2a3a' }}
            >
              <Database className="w-4 h-4" />
              {submitting ? 'Saving…' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
