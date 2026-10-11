import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { fetchJson } from '../api/client';

interface RatingModalProps {
  movieId: string | null;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({ movieId, userId, onClose, onSuccess }) => {
  const [rating, setRating] = useState<number>(5.0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!movieId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetchJson(`/movies/${movieId}/rate`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          movie_id: movieId,
          rating_value: rating,
        }),
      });
      setMessage('Rating persisted successfully to Neo4j!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full rounded-2xl p-6 border border-cine-border relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-heading font-bold text-xl text-white">Rate Movie</h3>
        <p className="text-xs text-slate-400 mt-1">
          Persists live to Neo4j as an atomic <code className="text-rose-400 font-mono">MERGE (u)-[:RATED]-&gt;(m)</code> edge.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col items-center">
          {/* Star selector */}
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((starVal) => (
              <button
                key={starVal}
                type="button"
                onClick={() => setRating(starVal)}
                className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
              >
                <Star
                  className={`w-8 h-8 transition-all ${
                    starVal <= rating
                      ? 'fill-amber-400 text-amber-400 scale-110'
                      : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-lg font-mono font-bold text-amber-400 mb-6">
            {rating.toFixed(1)} ★
          </span>

          {message && (
            <div className="mb-4 text-xs font-mono text-center px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
              {message}
            </div>
          )}

          <div className="w-full flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving to Neo4j...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
