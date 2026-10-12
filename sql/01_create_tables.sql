-- Database: PostgreSQL

-- =========================================
-- STEP 1: INDEPENDENT ENTITY TABLES
-- =========================================

CREATE TABLE "Director" (
    "DirectorID" INTEGER PRIMARY KEY,
    "DirectorName" VARCHAR(100),
    "DirectorDOB" DATE,
    "DirectorNationality" VARCHAR(60)
);

CREATE TABLE "User" (
    "UserID" INTEGER PRIMARY KEY,
    "Username" VARCHAR(50),
    "Password" VARCHAR(255),
    "User_DOB" DATE,
    "Email" VARCHAR(255),
    "Country" VARCHAR(60)
);

CREATE TABLE "Genre" (
    "GenreID" INTEGER PRIMARY KEY,
    "GenreName" VARCHAR(50)
);

CREATE TABLE "Actor" (
    "ActorID" INTEGER PRIMARY KEY,
    "ActorName" VARCHAR(100),
    "ActorDOB" DATE,
    "Nationality" VARCHAR(60)
);

CREATE TABLE "Award" (
    "AwardID" INTEGER PRIMARY KEY,
    "AwardName" VARCHAR(150),
    "Category" VARCHAR(100)
);

CREATE TABLE "Studio" (
    "StudioID" INTEGER PRIMARY KEY,
    "StudioName" VARCHAR(150),
    "Country" VARCHAR(60),
    "FoundedYear" INTEGER
);

-- =========================================
-- STEP 2: MOVIE ENTITY
-- =========================================

CREATE TABLE "Movie" (
    "MovieID" INTEGER PRIMARY KEY,
    "Title" VARCHAR(200),
    "Languages" VARCHAR(100),
    "AgeRating" VARCHAR(20),
    "ReleaseYear" INTEGER,
    "Duration" INTEGER,
    "Description" TEXT,
    "DirectorID" INTEGER,
    CONSTRAINT fk_movie_director
        FOREIGN KEY ("DirectorID")
        REFERENCES "Director" ("DirectorID")
);

-- =========================================
-- STEP 3: MOVIE-GENRE RELATIONSHIP
-- =========================================

CREATE TABLE "HasGenre" (
    "MovieID" INTEGER,
    "GenreID" INTEGER,
    PRIMARY KEY ("MovieID", "GenreID"),
    CONSTRAINT fk_hasgenre_movie
        FOREIGN KEY ("MovieID")
        REFERENCES "Movie" ("MovieID"),
    CONSTRAINT fk_hasgenre_genre
        FOREIGN KEY ("GenreID")
        REFERENCES "Genre" ("GenreID")
);

-- =========================================
-- STEP 4: ACTOR-MOVIE RELATIONSHIP
-- =========================================

CREATE TABLE "ActedIn" (
    "ActorID" INTEGER,
    "MovieID" INTEGER,
    PRIMARY KEY ("ActorID", "MovieID"),
    CONSTRAINT fk_actedin_actor
        FOREIGN KEY ("ActorID")
        REFERENCES "Actor" ("ActorID"),
    CONSTRAINT fk_actedin_movie
        FOREIGN KEY ("MovieID")
        REFERENCES "Movie" ("MovieID")
);

-- =========================================
-- STEP 5: MOVIE-STUDIO RELATIONSHIP
-- =========================================

CREATE TABLE "ProducedBy" (
    "MovieID" INTEGER,
    "StudioID" INTEGER,
    PRIMARY KEY ("MovieID", "StudioID"),
    CONSTRAINT fk_producedby_movie
        FOREIGN KEY ("MovieID")
        REFERENCES "Movie" ("MovieID"),
    CONSTRAINT fk_producedby_studio
        FOREIGN KEY ("StudioID")
        REFERENCES "Studio" ("StudioID")
);

-- =========================================
-- STEP 6: USER WATCHLIST
-- =========================================

CREATE TABLE "Adds_to_watchlist" (
    "UserID" INTEGER,
    "MovieID" INTEGER,
    PRIMARY KEY ("UserID", "MovieID"),
    CONSTRAINT fk_watchlist_user
        FOREIGN KEY ("UserID")
        REFERENCES "User" ("UserID"),
    CONSTRAINT fk_watchlist_movie
        FOREIGN KEY ("MovieID")
        REFERENCES "Movie" ("MovieID")
);

-- =========================================
-- STEP 7: USER WATCH HISTORY
-- =========================================

CREATE TABLE "Watches" (
    "UserID" INTEGER,
    "MovieID" INTEGER,
    "WatchDate" DATE,
    PRIMARY KEY ("UserID", "MovieID", "WatchDate"),
    CONSTRAINT fk_watches_user
        FOREIGN KEY ("UserID")
        REFERENCES "User" ("UserID"),
    CONSTRAINT fk_watches_movie
        FOREIGN KEY ("MovieID")
        REFERENCES "Movie" ("MovieID")
);

-- =========================================
-- STEP 8: USER RATINGS
-- =========================================

CREATE TABLE "Rates" (
    "UserID" INTEGER,
    "MovieID" INTEGER,
    "Rating" NUMERIC(2,1),
    PRIMARY KEY ("UserID", "MovieID"),
    CONSTRAINT fk_rates_user
        FOREIGN KEY ("UserID")
        REFERENCES "User" ("UserID"),
    CONSTRAINT fk_rates_movie
        FOREIGN KEY ("MovieID")
        REFERENCES "Movie" ("MovieID")
);

-- =========================================
-- STEP 9: AWARD WINNERS
-- =========================================

CREATE TABLE "Wins" (
    "AwardID" INTEGER,
    "MovieID" INTEGER,
    PRIMARY KEY ("AwardID", "MovieID"),
    CONSTRAINT fk_wins_award
        FOREIGN KEY ("AwardID")
        REFERENCES "Award" ("AwardID"),
    CONSTRAINT fk_wins_movie
        FOREIGN KEY ("MovieID")
        REFERENCES "Movie" ("MovieID")
);

-- =========================================
-- STEP 10: MOVIE REVIEWS
-- =========================================

CREATE TABLE "Review" (
    "ReviewID" INTEGER PRIMARY KEY,
    "UserID" INTEGER,
    "MovieID" INTEGER,
    "ReviewText" TEXT,
    "ReviewDate" DATE,
    CONSTRAINT fk_review_user
        FOREIGN KEY ("UserID")
        REFERENCES "User" ("UserID"),
    CONSTRAINT fk_review_movie
        FOREIGN KEY ("MovieID")
        REFERENCES "Movie" ("MovieID")
);
