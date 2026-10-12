-- ============================================
-- CineGraph: Database Validation
-- ============================================

-- 1. Count records in the main tables
SELECT 'Movie' AS table_name, COUNT(*) AS total_records FROM "Movie"
UNION ALL
SELECT 'Director', COUNT(*) FROM "Director"
UNION ALL
SELECT 'Genre', COUNT(*) FROM "Genre"
UNION ALL
SELECT 'User', COUNT(*) FROM "User"
UNION ALL
SELECT 'Rates', COUNT(*) FROM "Rates"
ORDER BY table_name;

-- 2. Check for movies without a valid director
SELECT m."MovieID", m."Title", m."DirectorID"
FROM "Movie" m
LEFT JOIN "Director" d
    ON m."DirectorID" = d."DirectorID"
WHERE d."DirectorID" IS NULL;

-- 3. Check for ratings outside the valid range (1–5)
SELECT *
FROM "Rates"
WHERE "Rating" < 1 OR "Rating" > 5;

-- 4. Check for movies with no genre association
SELECT m."MovieID", m."Title"
FROM "Movie" m
LEFT JOIN "HasGenre" hg
    ON m."MovieID" = hg."MovieID"
WHERE hg."MovieID" IS NULL;

-- 5. Verify the three PL/pgSQL programs exist
SELECT
    to_regprocedure('public.get_movie_average_rating(integer)') AS average_rating_function,
    to_regprocedure('public.display_movie_details(integer)') AS movie_details_procedure,
    to_regprocedure('public.count_movies_by_year(integer)') AS movies_by_year_function;