/**
 * Verified Movie Cover Poster URLs for all 30 CineGraph seed movies.
 * Each entry uses high-resolution artwork from TMDB / Wikimedia Commons.
 */

const POSTER_URLS: Record<string, string> = {
  m01: 'https://image.tmdb.org/t/p/w500/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg',                             // Inception
  m02: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',                             // Interstellar
  m03: 'https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg',                             // Arrival
  m04: 'https://upload.wikimedia.org/wikipedia/en/9/9b/Blade_Runner_2049_poster.png',                  // Blade Runner 2049
  m05: 'https://upload.wikimedia.org/wikipedia/en/d/d8/The_Wolf_of_Wall_Street_%282013%29.png',        // The Wolf of Wall Street
  m06: 'https://image.tmdb.org/t/p/w500/nT97ifVT2J1yMQmeq20Qblg61T.jpg',                             // The Departed
  m07: 'https://image.tmdb.org/t/p/w500/7sfbEnaARXDDhKm0CZ7D7uc2sbo.jpg',                             // Inglourious Basterds
  m08: 'https://image.tmdb.org/t/p/w500/8j58iEBw9pOXFD2L0nt0ZXeHviB.jpg',                             // Once Upon a Time in Hollywood
  m09: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',                             // La La Land
  m10: 'https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg',                             // Whiplash
  m11: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',                             // Fight Club
  m12: 'https://upload.wikimedia.org/wikipedia/en/8/8c/The_Social_Network_film_poster.png',             // The Social Network
  m13: 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',                             // Gladiator
  m14: 'https://image.tmdb.org/t/p/w500/5BHuvQ6p9kfc091Z8RiFNhCwL4b.jpg',                             // The Martian
  m15: 'https://image.tmdb.org/t/p/w500/uqx37cS8cpHg8U35f9U5IBlrCV3.jpg',                             // Saving Private Ryan
  m16: 'https://upload.wikimedia.org/wikipedia/en/4/4d/Catch_Me_If_You_Can_2002_movie.jpg',             // Catch Me If You Can
  m17: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',                             // Parasite
  m18: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Snowpiercer_poster.jpg',                         // Snowpiercer
  m19: 'https://upload.wikimedia.org/wikipedia/en/0/0b/Barbie_2023_poster.jpg',                         // Barbie
  m20: 'https://upload.wikimedia.org/wikipedia/en/9/9d/Little_Women_%282019_film%29.jpeg',             // Little Women
  m21: 'https://upload.wikimedia.org/wikipedia/en/3/37/The_Shape_of_Water_%28film%29.png',              // The Shape of Water
  m22: 'https://upload.wikimedia.org/wikipedia/en/6/67/Pan%27s_Labyrinth.jpg',                         // Pan's Labyrinth
  m23: 'https://image.tmdb.org/t/p/w500/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg',                             // Mad Max: Fury Road
  m24: 'https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xceZprc.jpg',                             // Furiosa
  m25: 'https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg',                             // The Grand Budapest Hotel
  m26: 'https://upload.wikimedia.org/wikipedia/en/a/af/Fantastic_mr_fox.jpg',                          // Fantastic Mr. Fox
  m27: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',                             // Spirited Away
  m28: 'https://upload.wikimedia.org/wikipedia/en/8/8c/Princess_Mononoke_Japanese_poster.png',         // Princess Mononoke
  m29: 'https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg',                             // Avatar
  m30: 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg',                             // Titanic
};

/** Returns a full poster URL for a given movie_id, or null if not mapped. */
export function getPosterUrl(movieId: string): string | null {
  return POSTER_URLS[movieId] || null;
}

/** Returns poster URL or undefined so callers can fall back to gradient art. */
export function getPosterUrlOrUndefined(movieId: string): string | undefined {
  return getPosterUrl(movieId) ?? undefined;
}
