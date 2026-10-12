-- CineGraph: Advanced SQL Queries
-- Database: PostgreSQL
-- Purpose: Advanced analysis of movie data.
-- Schema: Uses the existing tables without modification.


-- Query 1: Find genres containing more than 5 movies
SELECT
    g."GenreName",
    COUNT(hg."MovieID") AS movie_count
FROM "Genre" AS g
JOIN "HasGenre" AS hg
    ON g."GenreID" = hg."GenreID"
GROUP BY g."GenreID", g."GenreName"
HAVING COUNT(hg."MovieID") > 5
ORDER BY movie_count DESC, g."GenreName";


-- Query 2: Find movies rated above the overall average rating
SELECT
    m."Title",
    ROUND(AVG(r."Rating"), 2) AS average_rating
FROM "Movie" AS m
JOIN "Rates" AS r
    ON m."MovieID" = r."MovieID"
GROUP BY m."MovieID", m."Title"
HAVING AVG(r."Rating") > (
    SELECT AVG("Rating")
    FROM "Rates"
)
ORDER BY average_rating DESC, m."Title";


-- Query 3: Find movies that have never received a rating
SELECT
    m."MovieID",
    m."Title"
FROM "Movie" AS m
WHERE NOT EXISTS (
    SELECT 1
    FROM "Rates" AS r
    WHERE r."MovieID" = m."MovieID"
)
ORDER BY m."Title";


-- Query 4: Rank movies by average user rating
WITH MovieRatings AS (
    SELECT
        m."MovieID",
        m."Title",
        AVG(r."Rating") AS average_rating,
        COUNT(r."UserID") AS rating_count
    FROM "Movie" AS m
    JOIN "Rates" AS r
        ON m."MovieID" = r."MovieID"
    GROUP BY m."MovieID", m."Title"
)
SELECT
    "MovieID",
    "Title",
    ROUND(average_rating, 2) AS average_rating,
    rating_count,
    RANK() OVER (
        ORDER BY average_rating DESC
    ) AS rating_rank
FROM MovieRatings
ORDER BY rating_rank, "Title";
