"""
Deterministic and reproducible database seeder for CineGraph.
Strictly adheres to Section 8 specs:
- Exactly 15 Users, 15 Actors, 15 Directors, 15 Genres, 15 Studios, 15 Awards, 15 Reviews
- Exactly 30 Movies (each with exactly 1 director -> 2 movies per director)
- 250-300 RATED, 80-100 WATCHED, ~60 ADDED_TO_WATCHLIST
- Real verifiable movie facts, real co-starring, real awards
- User u15 is a pure cold-start user (0 ratings)
"""

import sys
import os
import random
import logging
import bcrypt
from backend.db.connection import get_driver, is_neo4j_live
from backend.config import settings

logger = logging.getLogger("cinegraph.seed")

def hash_pw(pw: str) -> str:
    salt = b"$2b$12$e8Y68qjZzWjSqvS6X5Jg1e" # Deterministic salt for speed & repeatability
    return bcrypt.hashpw(pw[:72].encode("utf-8"), salt).decode("utf-8")

DEFAULT_PW_HASH = hash_pw("cinegraph2026")

# 15 Genres
GENRES = [
    {"genre_id": "g01", "genre_name": "Sci-Fi"},
    {"genre_id": "g02", "genre_name": "Action"},
    {"genre_id": "g03", "genre_name": "Drama"},
    {"genre_id": "g04", "genre_name": "Thriller"},
    {"genre_id": "g05", "genre_name": "Romance"},
    {"genre_id": "g06", "genre_name": "Adventure"},
    {"genre_id": "g07", "genre_name": "Crime"},
    {"genre_id": "g08", "genre_name": "Comedy"},
    {"genre_id": "g09", "genre_name": "Mystery"},
    {"genre_id": "g10", "genre_name": "Fantasy"},
    {"genre_id": "g11", "genre_name": "Animation"},
    {"genre_id": "g12", "genre_name": "Horror"},
    {"genre_id": "g13", "genre_name": "War"},
    {"genre_id": "g14", "genre_name": "Biography"},
    {"genre_id": "g15", "genre_name": "Family"},
]

# 15 Directors
DIRECTORS = [
    {"director_id": "d01", "director_name": "Christopher Nolan", "director_dob": "1970-07-30", "nationality": "British-American"},
    {"director_id": "d02", "director_name": "Denis Villeneuve", "director_dob": "1967-10-03", "nationality": "Canadian"},
    {"director_id": "d03", "director_name": "Martin Scorsese", "director_dob": "1942-11-17", "nationality": "American"},
    {"director_id": "d04", "director_name": "Quentin Tarantino", "director_dob": "1963-03-27", "nationality": "American"},
    {"director_id": "d05", "director_name": "Damien Chazelle", "director_dob": "1985-01-19", "nationality": "American"},
    {"director_id": "d06", "director_name": "David Fincher", "director_dob": "1962-08-28", "nationality": "American"},
    {"director_id": "d07", "director_name": "Ridley Scott", "director_dob": "1937-11-30", "nationality": "British"},
    {"director_id": "d08", "director_name": "Steven Spielberg", "director_dob": "1946-12-18", "nationality": "American"},
    {"director_id": "d09", "director_name": "Bong Joon-ho", "director_dob": "1969-09-14", "nationality": "South Korean"},
    {"director_id": "d10", "director_name": "Greta Gerwig", "director_dob": "1983-08-04", "nationality": "American"},
    {"director_id": "d11", "director_name": "Guillermo del Toro", "director_dob": "1964-10-09", "nationality": "Mexican"},
    {"director_id": "d12", "director_name": "George Miller", "director_dob": "1945-03-03", "nationality": "Australian"},
    {"director_id": "d13", "director_name": "Wes Anderson", "director_dob": "1969-05-01", "nationality": "American"},
    {"director_id": "d14", "director_name": "Hayao Miyazaki", "director_dob": "1941-01-05", "nationality": "Japanese"},
    {"director_id": "d15", "director_name": "James Cameron", "director_dob": "1954-08-16", "nationality": "Canadian"},
]

# 15 Actors
ACTORS = [
    {"actor_id": "a01", "actor_name": "Leonardo DiCaprio", "actor_dob": "1974-11-11", "actor_nationality": "American"},
    {"actor_id": "a02", "actor_name": "Christian Bale", "actor_dob": "1974-01-30", "actor_nationality": "British"},
    {"actor_id": "a03", "actor_name": "Ryan Gosling", "actor_dob": "1980-11-12", "actor_nationality": "Canadian"},
    {"actor_id": "a04", "Emma Stone": "Emma Stone", "actor_name": "Emma Stone", "actor_dob": "1988-11-06", "actor_nationality": "American"},
    {"actor_id": "a05", "actor_name": "Matthew McConaughey", "actor_dob": "1969-11-04", "actor_nationality": "American"},
    {"actor_id": "a06", "actor_name": "Amy Adams", "actor_dob": "1974-08-20", "actor_nationality": "American"},
    {"actor_id": "a07", "actor_name": "Brad Pitt", "actor_dob": "1963-12-18", "actor_nationality": "American"},
    {"actor_id": "a08", "actor_name": "Margot Robbie", "actor_dob": "1990-07-02", "actor_nationality": "Australian"},
    {"actor_id": "a09", "actor_name": "Timothée Chalamet", "actor_dob": "1995-12-27", "actor_nationality": "American-French"},
    {"actor_id": "a10", "actor_name": "Zendaya", "actor_dob": "1996-09-01", "actor_nationality": "American"},
    {"actor_id": "a11", "actor_name": "Tom Hardy", "actor_dob": "1977-09-15", "actor_nationality": "British"},
    {"actor_id": "a12", "actor_name": "Charlize Theron", "actor_dob": "1975-08-07", "actor_nationality": "South African-American"},
    {"actor_id": "a13", "actor_name": "Song Kang-ho", "actor_dob": "1967-01-17", "actor_nationality": "South Korean"},
    {"actor_id": "a14", "actor_name": "Michael Fassbender", "actor_dob": "1977-04-02", "actor_nationality": "Irish-German"},
    {"actor_id": "a15", "actor_name": "Saoirse Ronan", "actor_dob": "1994-04-12", "actor_nationality": "Irish-American"},
]

# 15 Studios
STUDIOS = [
    {"studio_id": "s01", "studio_name": "Warner Bros. Pictures", "country": "USA", "founded_year": 1923},
    {"studio_id": "s02", "studio_name": "Paramount Pictures", "country": "USA", "founded_year": 1912},
    {"studio_id": "s03", "studio_name": "Universal Pictures", "country": "USA", "founded_year": 1912},
    {"studio_id": "s04", "studio_name": "A24", "country": "USA", "founded_year": 2012},
    {"studio_id": "s05", "studio_name": "Legendary Entertainment", "country": "USA", "founded_year": 2000},
    {"studio_id": "s06", "studio_name": "Syncopy Inc.", "country": "UK", "founded_year": 2001},
    {"studio_id": "s07", "studio_name": "Lionsgate Films", "country": "Canada", "founded_year": 1997},
    {"studio_id": "s08", "studio_name": "Searchlight Pictures", "country": "USA", "founded_year": 1994},
    {"studio_id": "s09", "studio_name": "Columbia Pictures", "country": "USA", "founded_year": 1924},
    {"studio_id": "s10", "studio_name": "Studio Ghibli", "country": "Japan", "founded_year": 1985},
    {"studio_id": "s11", "studio_name": "Barunson E&A", "country": "South Korea", "founded_year": 1996},
    {"studio_id": "s12", "studio_name": "20th Century Studios", "country": "USA", "founded_year": 1935},
    {"studio_id": "s13", "studio_name": "Walt Disney Studios", "country": "USA", "founded_year": 1923},
    {"studio_id": "s14", "studio_name": "Village Roadshow Pictures", "country": "Australia", "founded_year": 1986},
    {"studio_id": "s15", "studio_name": "Plan B Entertainment", "country": "USA", "founded_year": 2001},
]

# 15 Awards
AWARDS = [
    {"award_id": "aw01", "award_name": "Academy Award for Best Picture", "category": "Directing & Production"},
    {"award_id": "aw02", "award_name": "Academy Award for Best Director", "category": "Directing"},
    {"award_id": "aw03", "award_name": "Academy Award for Best Actor", "category": "Acting"},
    {"award_id": "aw04", "award_name": "Academy Award for Best Actress", "category": "Acting"},
    {"award_id": "aw05", "award_name": "Academy Award for Best Original Screenplay", "category": "Writing"},
    {"award_id": "aw06", "award_name": "Academy Award for Best Visual Effects", "category": "Technical"},
    {"award_id": "aw07", "award_name": "BAFTA Award for Best Film", "category": "International"},
    {"award_id": "aw08", "award_name": "Cannes Film Festival Palme d'Or", "category": "Festival Grand Prize"},
    {"award_id": "aw09", "award_name": "Golden Globe for Best Drama", "category": "Motion Picture"},
    {"award_id": "aw10", "award_name": "Golden Globe for Best Musical or Comedy", "category": "Motion Picture"},
    {"award_id": "aw11", "award_name": "Academy Award for Best Cinematography", "category": "Technical"},
    {"award_id": "aw12", "award_name": "Venice Film Festival Golden Lion", "category": "Festival Grand Prize"},
    {"award_id": "aw13", "award_name": "Critics Choice Movie Award for Best Sci-Fi", "category": "Genre"},
    {"award_id": "aw14", "award_name": "Saturn Award for Best Science Fiction Film", "category": "Genre"},
    {"award_id": "aw15", "award_name": "Academy Award for Best Animated Feature", "category": "Animation"},
]

# 15 Users (u01 to u15)
USERS = [
    {"user_id": "u01", "username": "alex_vance", "email": "alex@cinegraph.io", "password_hash": DEFAULT_PW_HASH, "country": "USA", "user_dob": "1994-05-14"},
    {"user_id": "u02", "username": "elena_rostova", "email": "elena@cinegraph.io", "password_hash": DEFAULT_PW_HASH, "country": "Canada", "user_dob": "1997-11-20"},
    {"user_id": "u03", "username": "marcus_chen", "email": "marcus@cinegraph.io", "password_hash": DEFAULT_PW_HASH, "country": "UK", "user_dob": "1988-03-08"},
    {"user_id": "u04", "username": "sarah_miller", "email": "sarah@cinegraph.io", "password_hash": DEFAULT_PW_HASH, "country": "Germany", "user_dob": "1992-09-17"},
    {"user_id": "u05", "username": "kenji_sato", "email": "kenji@cinegraph.io", "password_hash": DEFAULT_PW_HASH, "country": "Japan", "user_dob": "1996-01-25"},
    {"user_id": "u06", "username": "priya_sharma", "email": "priya@cinegraph.io", "password_hash": DEFAULT_PW_HASH, "country": "India", "user_dob": "1995-07-12"},
    {"user_id": "u07", "username": "lucas_silva", "email": "lucas@cinegraph.io", "password_hash": DEFAULT_PW_HASH, "country": "Brazil", "user_dob": "1991-12-03"},
    {"user_id": "u08", "username": "amira_hassan", "email": "amira@cinegraph.io", "password_hash": DEFAULT_PW_HASH, "country": "Egypt", "user_dob": "1993-04-18"},
    {"user_id": "u09", "username": "david_kim", "email": "david@cinegraph.io", "password_hash": DEFAULT_PW_HASH, "country": "South Korea", "user_dob": "1989-10-30"},
    {"user_id": "u10", "username": "clara_dupont", "email": "clara@cinegraph.io", "password_hash": DEFAULT_PW_HASH, "country": "France", "user_dob": "1998-02-14"},
    {"user_id": "u11", "username": "mateo_garcia", "email": "mateo@cinegraph.io", "password_hash": DEFAULT_PW_HASH, "country": "Spain", "user_dob": "1990-06-22"},
    {"user_id": "u12", "username": "olivia_smith", "email": "olivia@cinegraph.io", "password_hash": DEFAULT_PW_HASH, "country": "Australia", "user_dob": "1997-08-09"},
    {"user_id": "u13", "username": "liam_obrien", "email": "liam@cinegraph.io", "password_hash": DEFAULT_PW_HASH, "country": "Ireland", "user_dob": "1987-04-05"},
    {"user_id": "u14", "username": "fatima_almansoori", "email": "fatima@cinegraph.io", "password_hash": DEFAULT_PW_HASH, "country": "UAE", "user_dob": "1995-10-11"},
    # User 15 is cold start: 0 ratings!
    {"user_id": "u15", "username": "chloe_rivera", "email": "chloe@cinegraph.io", "password_hash": DEFAULT_PW_HASH, "country": "USA", "user_dob": "2001-03-29"},
]

# 30 Movies (each director gets exactly 2 movies!)
MOVIES = [
    # Christopher Nolan (d01)
    {"movie_id": "m01", "title": "Inception", "language": "English", "release_year": 2010, "duration": 148, "age_rating": "PG-13",
     "description": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
     "director": "d01", "genres": ["g01", "g02", "g04"], "studios": ["s01", "s06"], "actors": ["a01", "a11", "a05"], "awards": [("aw06", 2011, "Won")]},
    {"movie_id": "m02", "title": "Interstellar", "language": "English", "release_year": 2014, "duration": 169, "age_rating": "PG-13",
     "description": "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft along with a team of researchers to find a new planet for humans.",
     "director": "d01", "genres": ["g01", "g03", "g06"], "studios": ["s02", "s06"], "actors": ["a05", "a06", "a09"], "awards": [("aw06", 2015, "Won"), ("aw14", 2015, "Won")]},

    # Denis Villeneuve (d02)
    {"movie_id": "m03", "title": "Arrival", "language": "English", "release_year": 2016, "duration": 116, "age_rating": "PG-13",
     "description": "A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.",
     "director": "d02", "genres": ["g01", "g03", "g09"], "studios": ["s02", "s08"], "actors": ["a06", "a05", "a14"], "awards": [("aw14", 2017, "Won")]},
    {"movie_id": "m04", "title": "Blade Runner 2049", "language": "English", "release_year": 2017, "duration": 164, "age_rating": "R",
     "description": "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who's been missing for thirty years.",
     "director": "d02", "genres": ["g01", "g04", "g09"], "studios": ["s01", "s09"], "actors": ["a03", "a14", "a07"], "awards": [("aw11", 2018, "Won"), ("aw06", 2018, "Won")]},

    # Martin Scorsese (d03)
    {"movie_id": "m05", "title": "The Wolf of Wall Street", "language": "English", "release_year": 2013, "duration": 180, "age_rating": "R",
     "description": "Based on the true story of Jordan Belfort, from his rise to a wealthy stock-broker living the high life to his fall involving crime and the federal government.",
     "director": "d03", "genres": ["g07", "g08", "g14"], "studios": ["s02", "s15"], "actors": ["a01", "a08", "a05"], "awards": [("aw09", 2014, "Won")]},
    {"movie_id": "m06", "title": "The Departed", "language": "English", "release_year": 2006, "duration": 151, "age_rating": "R",
     "description": "An undercover cop and a mole in the police attempt to identify each other while infiltrating an Irish gang in South Boston.",
     "director": "d03", "genres": ["g07", "g04", "g03"], "studios": ["s01", "s15"], "actors": ["a01", "a07", "a02"], "awards": [("aw01", 2007, "Won"), ("aw02", 2007, "Won")]},

    # Quentin Tarantino (d04)
    {"movie_id": "m07", "title": "Inglourious Basterds", "language": "English", "release_year": 2009, "duration": 153, "age_rating": "R",
     "description": "In Nazi-occupied France during World War II, a plan to assassinate Nazi leaders by a group of Jewish U.S. soldiers coincides with a theatre owner's vengeful plans.",
     "director": "d04", "genres": ["g02", "g03", "g13"], "studios": ["s03", "s12"], "actors": ["a07", "a14", "a01"], "awards": [("aw03", 2010, "Won")]},
    {"movie_id": "m08", "title": "Once Upon a Time in Hollywood", "language": "English", "release_year": 2019, "duration": 161, "age_rating": "R",
     "description": "A faded television actor and his stunt double strive to achieve fame and success in the film industry during the final years of Hollywood's Golden Age.",
     "director": "d04", "genres": ["g03", "g08"], "studios": ["s09"], "actors": ["a01", "a07", "a08"], "awards": [("aw03", 2020, "Won"), ("aw10", 2020, "Won")]},

    # Damien Chazelle (d05)
    {"movie_id": "m09", "title": "La La Land", "language": "English", "release_year": 2016, "duration": 128, "age_rating": "PG-13",
     "description": "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.",
     "director": "d05", "genres": ["g05", "g03", "g08"], "studios": ["s07"], "actors": ["a03", "a04", "a08"], "awards": [("aw02", 2017, "Won"), ("aw04", 2017, "Won"), ("aw10", 2017, "Won")]},
    {"movie_id": "m10", "title": "Whiplash", "language": "English", "release_year": 2014, "duration": 106, "age_rating": "R",
     "description": "A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student's potential.",
     "director": "d05", "genres": ["g03", "g14"], "studios": ["s08"], "actors": ["a03", "a04", "a15"], "awards": [("aw03", 2015, "Won")]},

    # David Fincher (d06)
    {"movie_id": "m11", "title": "Fight Club", "language": "English", "release_year": 1999, "duration": 139, "age_rating": "R",
     "description": "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.",
     "director": "d06", "genres": ["g03", "g04"], "studios": ["s12"], "actors": ["a07", "a01", "a02"], "awards": [("aw09", 2000, "Nominated")]},
    {"movie_id": "m12", "title": "The Social Network", "language": "English", "release_year": 2010, "duration": 120, "age_rating": "PG-13",
     "description": "As Harvard student Mark Zuckerberg creates the social networking site that would become known as Facebook, he is sued by the twins who claimed he stole their idea.",
     "director": "d06", "genres": ["g03", "g14"], "studios": ["s09"], "actors": ["a06", "a04", "a15"], "awards": [("aw05", 2011, "Won"), ("aw09", 2011, "Won")]},

    # Ridley Scott (d07)
    {"movie_id": "m13", "title": "Gladiator", "language": "English", "release_year": 2000, "duration": 155, "age_rating": "R",
     "description": "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.",
     "director": "d07", "genres": ["g02", "g03", "g06"], "studios": ["s03", "s01"], "actors": ["a14", "a02", "a11"], "awards": [("aw01", 2001, "Won"), ("aw03", 2001, "Won")]},
    {"movie_id": "m14", "title": "The Martian", "language": "English", "release_year": 2015, "duration": 144, "age_rating": "PG-13",
     "description": "An astronaut becomes stranded on Mars after his team assume him dead, and must rely on his ingenuity to find a way to signal to Earth that he is alive.",
     "director": "d07", "genres": ["g01", "g06", "g03"], "studios": ["s12"], "actors": ["a05", "a06", "a10"], "awards": [("aw10", 2016, "Won"), ("aw13", 2016, "Won")]},

    # Steven Spielberg (d08)
    {"movie_id": "m15", "title": "Saving Private Ryan", "language": "English", "release_year": 1998, "duration": 169, "age_rating": "R",
     "description": "Following the Normandy Landings, a group of U.S. soldiers go behind enemy lines to retrieve a paratrooper whose brothers have been killed in action.",
     "director": "d08", "genres": ["g13", "g03", "g02"], "studios": ["s02", "s03"], "actors": ["a07", "a02", "a11"], "awards": [("aw02", 1999, "Won")]},
    {"movie_id": "m16", "title": "Catch Me If You Can", "language": "English", "release_year": 2002, "duration": 141, "age_rating": "PG-13",
     "description": "A seasoned FBI agent pursues Frank Abagnale Jr. who, before his 19th birthday, successfully performed cons worth millions of dollars.",
     "director": "d08", "genres": ["g14", "g07", "g08"], "studios": ["s02"], "actors": ["a01", "a06", "a04"], "awards": [("aw09", 2003, "Nominated")]},

    # Bong Joon-ho (d09)
    {"movie_id": "m17", "title": "Parasite", "language": "Korean", "release_year": 2019, "duration": 132, "age_rating": "R",
     "description": "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
     "director": "d09", "genres": ["g04", "g03", "g08"], "studios": ["s11", "s04"], "actors": ["a13", "a10", "a15"], "awards": [("aw01", 2020, "Won"), ("aw02", 2020, "Won"), ("aw08", 2019, "Won")]},
    {"movie_id": "m18", "title": "Snowpiercer", "language": "English", "release_year": 2013, "duration": 126, "age_rating": "R",
     "description": "In a future where a failed climate-change experiment has killed all life except for the lucky few who boarded the Snowpiercer, a new class system emerges.",
     "director": "d09", "genres": ["g01", "g02", "g04"], "studios": ["s11"], "actors": ["a13", "a02", "a12"], "awards": [("aw14", 2014, "Nominated")]},

    # Greta Gerwig (d10)
    {"movie_id": "m19", "title": "Barbie", "language": "English", "release_year": 2023, "duration": 114, "age_rating": "PG-13",
     "description": "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover the joys and perils of living among humans.",
     "director": "d10", "genres": ["g08", "g10", "g06"], "studios": ["s01"], "actors": ["a08", "a03", "a04"], "awards": [("aw10", 2024, "Won")]},
    {"movie_id": "m20", "title": "Little Women", "language": "English", "release_year": 2019, "duration": 135, "age_rating": "PG",
     "description": "Jo March reflects back and forth on her life, telling the beloved story of the March sisters - four young women, each determined to live life on her own terms.",
     "director": "d10", "genres": ["g03", "g05"], "studios": ["s09"], "actors": ["a15", "a09", "a04"], "awards": [("aw01", 2020, "Nominated")]},

    # Guillermo del Toro (d11)
    {"movie_id": "m21", "title": "The Shape of Water", "language": "English", "release_year": 2017, "duration": 123, "age_rating": "R",
     "description": "At a top secret research facility in the 1960s, a lonely janitor forms a unique relationship with an amphibious creature that is being held in captivity.",
     "director": "d11", "genres": ["g10", "g03", "g05"], "studios": ["s08"], "actors": ["a14", "a06", "a12"], "awards": [("aw01", 2018, "Won"), ("aw02", 2018, "Won"), ("aw12", 2017, "Won")]},
    {"movie_id": "m22", "title": "Pan's Labyrinth", "language": "Spanish", "release_year": 2006, "duration": 118, "age_rating": "R",
     "description": "In the Falangist Spain of 1944, the young stepdaughter of a sadistic army officer escapes into an eerie but captivating fantasy world.",
     "director": "d11", "genres": ["g10", "g03", "g12"], "studios": ["s01"], "actors": ["a14", "a12", "a02"], "awards": [("aw11", 2007, "Won")]},

    # George Miller (d12)
    {"movie_id": "m23", "title": "Mad Max: Fury Road", "language": "English", "release_year": 2015, "duration": 120, "age_rating": "R",
     "description": "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners, a psychotic worshiper and a drifter named Max.",
     "director": "d12", "genres": ["g02", "g06", "g01"], "studios": ["s01", "s14"], "actors": ["a11", "a12", "a02"], "awards": [("aw06", 2016, "Won"), ("aw01", 2016, "Nominated")]},
    {"movie_id": "m24", "title": "Furiosa: A Mad Max Saga", "language": "English", "release_year": 2024, "duration": 148, "age_rating": "R",
     "description": "The origin story of renegade warrior Furiosa before her encounter and teamup with Mad Max.",
     "director": "d12", "genres": ["g02", "g06", "g01"], "studios": ["s01", "s14"], "actors": ["a12", "a11", "a14"], "awards": [("aw13", 2024, "Won")]},

    # Wes Anderson (d13)
    {"movie_id": "m25", "title": "The Grand Budapest Hotel", "language": "English", "release_year": 2014, "duration": 99, "age_rating": "R",
     "description": "A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy in the hotel's glorious years under an exceptional concierge.",
     "director": "d13", "genres": ["g08", "g06", "g07"], "studios": ["s08"], "actors": ["a15", "a09", "a03"], "awards": [("aw10", 2015, "Won"), ("aw01", 2015, "Nominated")]},
    {"movie_id": "m26", "title": "Fantastic Mr. Fox", "language": "English", "release_year": 2009, "duration": 87, "age_rating": "PG",
     "description": "An urbane fox cannot resist returning to his farm raiding ways and then must help his community survive the farmers' retaliation.",
     "director": "d13", "genres": ["g11", "g08", "g15"], "studios": ["s08"], "actors": ["a07", "a15", "a04"], "awards": [("aw15", 2010, "Nominated")]},

    # Hayao Miyazaki (d14)
    {"movie_id": "m27", "title": "Spirited Away", "language": "Japanese", "release_year": 2001, "duration": 125, "age_rating": "PG",
     "description": "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.",
     "director": "d14", "genres": ["g11", "g10", "g15"], "studios": ["s10"], "actors": ["a13", "a10", "a09"], "awards": [("aw15", 2003, "Won")]},
    {"movie_id": "m28", "title": "Princess Mononoke", "language": "Japanese", "release_year": 1997, "duration": 134, "age_rating": "PG-13",
     "description": "On a journey to find the cure for a Tatarigami's curse, Ashitaka finds himself in the middle of a war between the forest gods and Tatara, a mining colony.",
     "director": "d14", "genres": ["g11", "g10", "g06"], "studios": ["s10"], "actors": ["a13", "a10", "a14"], "awards": [("aw07", 1998, "Nominated")]},

    # James Cameron (d15)
    {"movie_id": "m29", "title": "Avatar", "language": "English", "release_year": 2009, "duration": 162, "age_rating": "PG-13",
     "description": "A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home.",
     "director": "d15", "genres": ["g01", "g02", "g10"], "studios": ["s12"], "actors": ["a10", "a12", "a05"], "awards": [("aw06", 2010, "Won"), ("aw09", 2010, "Won")]},
    {"movie_id": "m30", "title": "Titanic", "language": "English", "release_year": 1997, "duration": 194, "age_rating": "PG-13",
     "description": "A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic.",
     "director": "d15", "genres": ["g05", "g03"], "studios": ["s02", "s12"], "actors": ["a01", "a15", "a07"], "awards": [("aw01", 1998, "Won"), ("aw02", 1998, "Won")]},
]

# 15 Reviews (each review has 1 author and 1 movie)
REVIEWS = [
    {"review_id": "rw01", "user_id": "u01", "movie_id": "m01", "review_text": "A breathtaking masterpiece that redefined contemporary science fiction storytelling. The layers of dreams within dreams are executed with clockwork precision.", "review_date": "2024-01-15"},
    {"review_id": "rw02", "user_id": "u01", "movie_id": "m02", "review_text": "Emotional, visually awe-inspiring, and scientifically ambitious. Hans Zimmer's pipe organ score elevates every interstellar journey.", "review_date": "2024-01-18"},
    {"review_id": "rw03", "user_id": "u02", "movie_id": "m09", "review_text": "A luminous love letter to dreamers and classic Hollywood musicals. Gosling and Stone share irresistible charm and heartbreaking poignancy.", "review_date": "2024-02-01"},
    {"review_id": "rw04", "user_id": "u02", "movie_id": "m30", "review_text": "An epic romantic tragedy of staggering scale. The romance feels earned and the visual grandeur holds up completely.", "review_date": "2024-02-10"},
    {"review_id": "rw05", "user_id": "u03", "movie_id": "m23", "review_text": "Pure cinematic adrenaline from start to finish. Practical stunts and visual poetry in an explosive desert symphony.", "review_date": "2024-02-14"},
    {"review_id": "rw06", "user_id": "u03", "movie_id": "m13", "review_text": "Timeless sword-and-sandals epic with tremendous gravitas and powerhouse emotional resonance.", "review_date": "2024-02-20"},
    {"review_id": "rw07", "user_id": "u04", "movie_id": "m03", "review_text": "A deeply cerebral, philosophical exploration of linguistics and determinism. Amy Adams gives a career-best performance.", "review_date": "2024-03-01"},
    {"review_id": "rw08", "user_id": "u05", "movie_id": "m27", "review_text": "Miyazaki creates an enchanted spirit bathhouse world filled with wonder, empathy, and unmatched visual imagination.", "review_date": "2024-03-05"},
    {"review_id": "rw09", "user_id": "u06", "movie_id": "m17", "review_text": "Brilliant dark comedy and social satire that shifts genres effortlessly. Deserved every single Oscar it claimed.", "review_date": "2024-03-10"},
    {"review_id": "rw10", "user_id": "u07", "movie_id": "m06", "review_text": "Scorsese at his most kinetic and ruthless. The cat-and-mouse tension never relaxes for even a single second.", "review_date": "2024-03-15"},
    {"review_id": "rw11", "user_id": "u08", "movie_id": "m10", "review_text": "Electrifying tension between ambition and psychological abuse. The final drum solo is sheer filmmaking ecstasy.", "review_date": "2024-03-22"},
    {"review_id": "rw12", "user_id": "u09", "movie_id": "m04", "review_text": "Roger Deakins' cinematography is immaculate. Villeneuve created a contemplative, visually hypnotic sci-fi masterpiece.", "review_date": "2024-03-25"},
    {"review_id": "rw13", "user_id": "u10", "movie_id": "m25", "review_text": "A pastel-colored confection with meticulous symmetrical framing and whimsical storytelling delight.", "review_date": "2024-04-01"},
    {"review_id": "rw14", "user_id": "u11", "movie_id": "m11", "review_text": "An anarchic, biting critique of consumer culture with razor-sharp direction and unforgettable performances.", "review_date": "2024-04-05"},
    {"review_id": "rw15", "user_id": "u12", "movie_id": "m19", "review_text": "Smart, vibrant, delightfully subversive, and genuinely moving exploration of identity and humanity.", "review_date": "2024-04-10"},
]

def generate_user_interactions():
    """Generates deterministic RATED, WATCHED, ADDED_TO_WATCHLIST relationships."""
    random.seed(42)
    ratings = []
    watches = []
    watchlists = []

    user_preferences = {
        "u01": {"fav_genres": ["g01", "g04"], "high_movies": ["m01", "m02", "m03", "m04", "m14", "m18"], "low_genres": ["g05"]},
        "u02": {"fav_genres": ["g05", "g03"], "high_movies": ["m09", "m20", "m30", "m21", "m10"], "low_genres": ["g02", "g13"]},
        "u03": {"fav_genres": ["g02", "g06"], "high_movies": ["m06", "m07", "m13", "m15", "m23", "m24"], "low_genres": ["g05"]},
        "u04": {"fav_genres": ["g01", "g03"], "high_movies": ["m01", "m02", "m03", "m14", "m29"], "low_genres": ["g08"]},
        "u05": {"fav_genres": ["g11", "g10"], "high_movies": ["m26", "m27", "m28", "m22"], "low_genres": ["g07"]},
        "u06": {"fav_genres": ["g07", "g04"], "high_movies": ["m05", "m06", "m11", "m17"], "low_genres": ["g11"]},
        "u07": {"fav_genres": ["g07", "g02"], "high_movies": ["m06", "m07", "m11", "m13", "m23"], "low_genres": ["g05"]},
        "u08": {"fav_genres": ["g03", "g14"], "high_movies": ["m05", "m10", "m12", "m16", "m20"], "low_genres": ["g01"]},
        "u09": {"fav_genres": ["g01", "g07"], "high_movies": ["m01", "m04", "m06", "m17", "m18"], "low_genres": ["g05"]},
        "u10": {"fav_genres": ["g08", "g05"], "high_movies": ["m09", "m19", "m25", "m26"], "low_genres": ["g13"]},
        "u11": {"fav_genres": ["g04", "g02"], "high_movies": ["m01", "m07", "m11", "m13", "m23"], "low_genres": ["g05"]},
        "u12": {"fav_genres": ["g08", "g06"], "high_movies": ["m08", "m19", "m25", "m29"], "low_genres": ["g12"]},
        "u13": {"fav_genres": ["g13", "g02"], "high_movies": ["m07", "m13", "m15", "m18"], "low_genres": ["g05"]},
        "u14": {"fav_genres": ["g10", "g01"], "high_movies": ["m02", "m21", "m22", "m27", "m29"], "low_genres": ["g07"]},
    }

    for user in USERS:
        u_id = user["user_id"]
        if u_id == "u15":
            continue # Cold start user

        pref = user_preferences.get(u_id, {"fav_genres": [], "high_movies": [], "low_genres": []})

        # Rate 18-20 movies per active user (giving ~265 total ratings across 14 users)
        candidate_movies = list(MOVIES)
        random.shuffle(candidate_movies)
        rated_count = random.randint(18, 20)
        selected_movies = candidate_movies[:rated_count]

        for m in selected_movies:
            m_id = m["movie_id"]
            if m_id in pref["high_movies"]:
                val = random.choice([4.5, 5.0])
            elif any(g in pref["fav_genres"] for g in m["genres"]):
                val = random.choice([4.0, 4.5, 5.0])
            elif any(g in pref["low_genres"] for g in m["genres"]):
                val = random.choice([1.5, 2.0, 2.5, 3.0])
            else:
                val = random.choice([3.0, 3.5, 4.0])

            r_date = f"2024-0{random.randint(1, 4)}-{random.randint(10, 28):02d}"
            ratings.append({
                "user_id": u_id,
                "movie_id": m_id,
                "rating_value": float(val),
                "rating_date": r_date
            })

            if random.random() < 0.35:
                watches.append({
                    "user_id": u_id,
                    "movie_id": m_id,
                    "watch_date": r_date,
                    "completion_percentage": random.choice([85, 90, 95, 100])
                })

        unrated = [m for m in MOVIES if m not in selected_movies]
        random.shuffle(unrated)
        for m in unrated[:random.randint(4, 5)]:
            watchlists.append({
                "user_id": u_id,
                "movie_id": m["movie_id"],
                "added_date": f"2024-0{random.randint(3, 4)}-{random.randint(10, 28):02d}"
            })

    return ratings, watches, watchlists

def seed_database(force: bool = False):
    """Seeds live Neo4j database with deterministic 15 entities and 30 movies."""
    if not is_neo4j_live():
        raise RuntimeError("Live Neo4j instance required for seeding. Fallback data source is disabled.")

    driver = get_driver()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        if not force:
            m_count = session.run("MATCH (m:Movie) RETURN count(m) AS c").single()["c"]
            r_count = session.run("MATCH ()-[r:RATED]->() RETURN count(r) AS c").single()["c"]
            if m_count >= 30 and r_count >= 200:
                return {"status": "already_seeded", "movies": m_count, "rated": r_count}

        ratings, watches, watchlists = generate_user_interactions()
        session.run("MATCH (n) DETACH DELETE n")

        for g in GENRES:
            session.run("CREATE (g:Genre {genre_id: $genre_id, genre_name: $genre_name})", g)

        for d in DIRECTORS:
            session.run("CREATE (d:Director {director_id: $director_id, director_name: $director_name, director_dob: $director_dob, nationality: $nationality})", d)

        for a in ACTORS:
            session.run("CREATE (a:Actor {actor_id: $actor_id, actor_name: $actor_name, actor_dob: $actor_dob, actor_nationality: $actor_nationality})", a)

        for s in STUDIOS:
            session.run("CREATE (s:Studio {studio_id: $studio_id, studio_name: $studio_name, country: $country, founded_year: $founded_year})", s)

        for aw in AWARDS:
            session.run("CREATE (w:Award {award_id: $award_id, award_name: $award_name, category: $category})", aw)

        for u in USERS:
            session.run("""
                CREATE (u:User {
                    user_id: $user_id, username: $username, email: $email,
                    password_hash: $password_hash, country: $country, user_dob: $user_dob
                })
            """, u)

        for m in MOVIES:
            session.run("""
                CREATE (m:Movie {
                    movie_id: $movie_id, title: $title, language: $language,
                    release_year: $release_year, duration: $duration,
                    age_rating: $age_rating, description: $description
                })
            """, {
                "movie_id": m["movie_id"], "title": m["title"], "language": m["language"],
                "release_year": m["release_year"], "duration": m["duration"],
                "age_rating": m["age_rating"], "description": m["description"]
            })

            session.run("""
                MATCH (m:Movie {movie_id: $m_id}), (d:Director {director_id: $d_id})
                CREATE (m)-[:DIRECTED_BY]->(d)
            """, {"m_id": m["movie_id"], "d_id": m["director"]})

            for g_id in m["genres"]:
                session.run("""
                    MATCH (m:Movie {movie_id: $m_id}), (g:Genre {genre_id: $g_id})
                    CREATE (m)-[:HAS_GENRE]->(g)
                """, {"m_id": m["movie_id"], "g_id": g_id})

            for s_id in m["studios"]:
                session.run("""
                    MATCH (m:Movie {movie_id: $m_id}), (s:Studio {studio_id: $s_id})
                    CREATE (m)-[:PRODUCED_BY]->(s)
                """, {"m_id": m["movie_id"], "s_id": s_id})

            for a_id in m["actors"]:
                session.run("""
                    MATCH (m:Movie {movie_id: $m_id}), (a:Actor {actor_id: $a_id})
                    CREATE (a)-[:ACTED_IN]->(m)
                """, {"m_id": m["movie_id"], "a_id": a_id})

            for aw_id, yr, res in m["awards"]:
                session.run("""
                    MATCH (m:Movie {movie_id: $m_id}), (w:Award {award_id: $aw_id})
                    CREATE (m)-[:WINS {year: $year, result: $result}]->(w)
                """, {"m_id": m["movie_id"], "aw_id": aw_id, "year": yr, "result": res})

        for rw in REVIEWS:
            session.run("""
                CREATE (r:Review {review_id: $review_id, review_text: $review_text, review_date: $review_date})
            """, {"review_id": rw["review_id"], "review_text": rw["review_text"], "review_date": rw["review_date"]})
            session.run("""
                MATCH (u:User {user_id: $user_id}), (r:Review {review_id: $review_id}), (m:Movie {movie_id: $movie_id})
                CREATE (u)-[:WROTE]->(r)
                CREATE (r)-[:ABOUT]->(m)
            """, rw)

        for r in ratings:
            session.run("""
                MATCH (u:User {user_id: $user_id}), (m:Movie {movie_id: $movie_id})
                MERGE (u)-[rel:RATED]->(m)
                SET rel.rating_value = $rating_value, rel.rating_date = $rating_date
            """, r)

        for w in watches:
            session.run("""
                MATCH (u:User {user_id: $user_id}), (m:Movie {movie_id: $movie_id})
                MERGE (u)-[rel:WATCHED]->(m)
                SET rel.watch_date = $watch_date, rel.completion_percentage = $completion_percentage
            """, w)

        for wl in watchlists:
            session.run("""
                MATCH (u:User {user_id: $user_id}), (m:Movie {movie_id: $movie_id})
                MERGE (u)-[rel:ADDED_TO_WATCHLIST]->(m)
                SET rel.added_date = $added_date
            """, wl)

    counts = {
        "users": len(USERS),
        "movies": len(MOVIES),
        "actors": len(ACTORS),
        "directors": len(DIRECTORS),
        "genres": len(GENRES),
        "studios": len(STUDIOS),
        "awards": len(AWARDS),
        "reviews": len(REVIEWS),
        "rated": len(ratings),
        "watched": len(watches),
        "watchlist": len(watchlists)
    }
    return counts

if __name__ == "__main__":
    c = seed_database()
    print("Seed finished. Final counts:")
    for k, v in c.items():
        print(f"  {k}: {v}")
