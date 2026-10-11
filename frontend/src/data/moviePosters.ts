/**
 * TMDB poster paths for all 30 CineGraph seed movies.
 * Base URL: https://image.tmdb.org/t/p/w500{path}
 */

const TMDB_BASE = 'https://image.tmdb.org/t/p/w500';

const POSTER_PATHS: Record<string, string> = {
  m01: '/edv5CZvWj09paE7E0nSN57q00Gz.jpg',   // Inception
  m02: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',   // Interstellar
  m03: '/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg',   // Arrival
  m04: '/gajva2L0rPYkEWjvMSNA2v7JBjI.jpg',   // Blade Runner 2049
  m05: '/34m2tygAYBGqA9MXKhRDtzYd4Lx.jpg',   // The Wolf of Wall Street
  m06: '/nT97ifVT2J1yMQmeq20Qblg61T.jpg',    // The Departed
  m07: '/7sfbEnaARXDDhKm0CZ7D7uc2sbo.jpg',   // Inglourious Basterds
  m08: '/8j58iEBw9pOXFD2L0nt0ZXeHviB.jpg',   // Once Upon a Time in Hollywood
  m09: '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',   // La La Land
  m10: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg',   // Whiplash
  m11: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',   // Fight Club
  m12: '/n0ybibhJtQ5icDqTp8eRytcIHso.jpg',   // The Social Network
  m13: '/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',   // Gladiator
  m14: '/5BHuvQ6p9kfc091Z8RiFNhCwL4b.jpg',   // The Martian
  m15: '/uqx37cS8cpHg8U35f9U5IBlrCV3.jpg',   // Saving Private Ryan
  m16: '/wkQ1ajdHZEMCfCzqHpLCQV4aHNh.jpg',   // Catch Me If You Can
  m17: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',   // Parasite
  m18: '/qXt8DCFDD2n5Ic0kIVc3hJnFMk2.jpg',   // Snowpiercer
  m19: '/iuFNMS8vlodoZ0GxdYEsSzAVFvQ.jpg',   // Barbie
  m20: '/yn9hQfZjOcBNr8WHTXR4WcGWamq.jpg',   // Little Women
  m21: '/azjnJZRbAGX5UgFiJfBTjmdlB2f.jpg',   // The Shape of Water
  m22: '/szzMkFKQLpGntpG3JYMYMOKdPzW.jpg',   // Pan's Labyrinth
  m23: '/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg',   // Mad Max: Fury Road
  m24: '/iADOJ8Zymht2JPMoy3R7xceZprc.jpg',   // Furiosa
  m25: '/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg',   // The Grand Budapest Hotel
  m26: '/8oCjFBrQB22oHIpRXHJkDKGO7wz.jpg',   // Fantastic Mr. Fox
  m27: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',   // Spirited Away
  m28: '/jHarwood2l9gX3QgKS2gKEncKdA.jpg',   // Princess Mononoke
  m29: '/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg',   // Avatar
  m30: '/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg',   // Titanic
};

/** Returns a full TMDB poster URL for a given movie_id, or null if not mapped. */
export function getPosterUrl(movieId: string): string | null {
  const path = POSTER_PATHS[movieId];
  return path ? `${TMDB_BASE}${path}` : null;
}

/** Returns poster URL or undefined so callers can fall back to gradient art. */
export function getPosterUrlOrUndefined(movieId: string): string | undefined {
  return getPosterUrl(movieId) ?? undefined;
}
