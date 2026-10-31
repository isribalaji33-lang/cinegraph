
-- CineGraph: PL/pgSQL Programs
-- Database: PostgreSQL
-- Purpose: Demonstrate procedural SQL using the existing schema.


-- Program 1: Function to calculate a movie's average rating
CREATE OR REPLACE FUNCTION get_movie_average_rating(p_movie_id INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_average NUMERIC;
BEGIN
    SELECT AVG("Rating")
    INTO v_average
    FROM "Rates"
    WHERE "MovieID" = p_movie_id;

    RETURN ROUND(v_average, 2);
END;
$$;


-- Program 2: Procedure to display movie details
CREATE OR REPLACE PROCEDURE display_movie_details(p_movie_id INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    v_title TEXT;
    v_year INTEGER;
    v_languages TEXT;
BEGIN
    SELECT "Title", "ReleaseYear", "Languages"
    INTO v_title, v_year, v_languages
    FROM "Movie"
    WHERE "MovieID" = p_movie_id;

    IF NOT FOUND THEN
        RAISE NOTICE 'No movie found with ID %', p_movie_id;
    ELSE
        RAISE NOTICE 'Title: %, Year: %, Languages: %',
            v_title, v_year, v_languages;
    END IF;
END;
$$;


-- Program 3: Function to count movies released in a year
CREATE OR REPLACE FUNCTION count_movies_by_year(p_year INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM "Movie"
    WHERE "ReleaseYear" = p_year;

    RETURN v_count;
END;
$$;
