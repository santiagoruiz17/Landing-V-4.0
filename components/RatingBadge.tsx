import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

const FACEBOOK_REVIEW_URL = 'https://www.facebook.com/106460525837472/reviews/';

// Curado manualmente desde /admin (tabla site_config) — no se inventa un
// rating: si el equipo no lo ha cargado todavía, no se muestra nada.
export const RatingBadge: React.FC = () => {
  const [rating, setRating] = useState<number | null>(null);
  const [reviews, setReviews] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('site_config')
      .select('rating_facebook, rating_facebook_reviews')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        setRating(data?.rating_facebook ?? null);
        setReviews(data?.rating_facebook_reviews ?? null);
      });
  }, []);

  if (rating == null) return null;

  return (
    <a
      href={FACEBOOK_REVIEW_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 py-1 px-3 mb-6 border border-gray-200 rounded-full text-xs font-semibold text-charcoal bg-white hover:border-firma-green/30 transition-colors no-underline"
    >
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={12} className={i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'} fill="currentColor" />
        ))}
      </span>
      {rating.toFixed(1)}{reviews != null && ` · +${reviews} reseñas en Facebook`}
    </a>
  );
};
