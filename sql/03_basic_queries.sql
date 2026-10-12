-- CineGraph: Basic SQL Queries
-- Database: PostgreSQL
-- Purpose: Retrieve and filter movie database information.
-- Schema: Uses the existing tables without modification.


-- Query 1: Display all movies
SELECT *
FROM "Movie";


-- Query 2: Search for a movie by title
SELECT "MovieID", "Title", "ReleaseYear", "Languages", "AgeRating"
FROM "Movie"
WHERE "Title" ILIKE '%inception%';


-- Query 3: Find movies released after 2010
SELECT "MovieID", "Title", "ReleaseYear"
FROM "Movie"
WHERE "ReleaseYear" > 2010
ORDER BY "ReleaseYear" DESC;


-- Query 4: Display directors and their movies
SELECT
    d."DirectorName",
    m."Title",
    m."ReleaseYear"
FROM "Director" AS d
JOIN "Movie" AS m
    ON d."DirectorID" = m."DirectorID"
ORDER BY d."DirectorName", m."Title";


-- Query 5: Display movies with their genres
SELECT
    m."Title",
    g."GenreName"
FROM "Movie" AS m
JOIN "HasGenre" AS hg
    ON m."MovieID" = hg."MovieID"
JOIN "Genre" AS g
    ON hg."GenreID" = g."GenreID"
ORDER BY m."Title", g."GenreName";


-- Query 6: Find all movies rated by a particular user
-- Change 1 to another UserID if required.
SELECT
    u."Username",
    m."Title",
    r."Rating"
FROM "Rates" AS r
JOIN "User" AS u
    ON r."UserID" = u."UserID"
JOIN "Movie" AS m
    ON r."MovieID" = m."MovieID"
WHERE u."UserID" = 1
ORDER BY r."Rating" DESC, m."Title";


-- Query 7: Display movies in ascending release-year order
SELECT "Title", "ReleaseYear"
FROM "Movie"
ORDER BY "ReleaseYear" ASC, "Title" ASC;


-- Query 8: Display movies with their average user rating
SELECT
    m."Title",
    ROUND(AVG(r."Rating"), 2) AS average_rating,
    COUNT(r."UserID") AS number_of_ratings
FROM "Movie" AS m
LEFT JOIN "Rates" AS r
    ON m."MovieID" = r."MovieID"
GROUP BY m."MovieID", m."Title"
ORDER BY average_rating DESC NULLS LAST, m."Title";


-- Query 9: Display movies released after 2010 in English
SELECT
    "MovieID",
    "Title",
    "ReleaseYear",
    "Languages"
FROM "Movie"
WHERE "ReleaseYear" > 2010
  AND "Languages" = 'English'
ORDER BY "ReleaseYear" ASC;


-- Query 10: Display movies in English or released after 2010
SELECT
    "MovieID",
    "Title",
    "ReleaseYear",
    "Languages"
FROM "Movie"
WHERE "Languages" = 'English'
   OR "ReleaseYear" > 2010
ORDER BY "ReleaseYear" ASC;


-- Query 11: Filter movies by release year and age rating
SELECT
    "MovieID",
    "Title",
    "ReleaseYear",
    "AgeRating"
FROM "Movie"
WHERE "ReleaseYear" BETWEEN 2000 AND 2020
  AND "AgeRating" IN ('PG-13', 'R')
  AND "Title" NOT IN ('Inception', 'Interstellar')
ORDER BY "ReleaseYear" DESC;
