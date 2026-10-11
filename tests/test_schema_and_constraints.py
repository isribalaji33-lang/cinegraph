"""
Test Suite: Schema and Constraints Integrity.
"""

from backend.db.schema import CONSTRAINTS, INDEXES
from backend.seed.validate_db import validate_database

def test_constraints_definition():
    assert len(CONSTRAINTS) == 11
    labels = {c["label"] for c in CONSTRAINTS}
    assert "User" in labels
    assert "Movie" in labels
    assert "Actor" in labels
    assert "Director" in labels
    assert "Genre" in labels
    assert "Studio" in labels
    assert "Award" in labels
    assert "Review" in labels

def test_indexes_definition():
    assert len(INDEXES) == 5
    props = {idx["prop"] for idx in INDEXES}
    assert "title" in props
    assert "release_year" in props
    assert "language" in props
    assert "actor_name" in props
    assert "director_name" in props

def test_database_validation_suite():
    res = validate_database()
    assert res["valid"] is True
    assert len(res["errors"]) == 0
    assert res["stats"]["Movie"] == 30
    assert res["stats"]["User"] == 15
    assert res["stats"]["DIRECTED_BY"] == 30
    assert res["stats"]["WROTE"] == 15
    assert res["stats"]["ABOUT"] == 15
