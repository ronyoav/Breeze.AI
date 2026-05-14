from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Attraction:
    id: str
    name: str
    category: str
    description: str
    address: str = ""
    coordinates: Optional[dict] = None
    imageurl: Optional[str] = None
    ageRange: Optional[str] = None
    reviews: Optional[float] = None
    prices: Optional[int] = None
    notes: Optional[str] = None
    specialNotes: Optional[str] = None
    subAgentScore: Optional[float] = None
    scoresLog: Optional[list[float]] = None
    
    # Legacy fields (kept for backward compatibility with older agents)
    rating: Optional[float] = None
    price_level: Optional[int] = None
    opening_hours: Optional[str] = None
    url: Optional[str] = None
    tip: Optional[str] = None

    def to_dict(self) -> dict:
        return {k: v for k, v in self.__dict__.items() if v is not None}


def parse_google_place(place: dict) -> Attraction:
    geo = place.get("geometry", {}).get("location", {})
    return Attraction(
        id=str(place.get("place_id", place.get("id", id(place)))),
        name=place.get("name", ""),
        category="",
        description=place.get("editorial_summary", {}).get("overview", place.get("vicinity", "")),
        address=place.get("formatted_address", place.get("vicinity", "")),
        rating=place.get("rating"),
        price_level=place.get("price_level"),
        coordinates={"lat": geo["lat"], "lng": geo["lng"]} if geo else None,
    )


def parse_foursquare_place(place: dict) -> Attraction:
    loc = place.get("location", {})
    rating = place.get("rating")
    return Attraction(
        id=str(place.get("fsq_id", id(place))),
        name=place.get("name", ""),
        category="",
        description=place.get("description", ""),
        address=loc.get("formatted_address", ""),
        rating=rating / 2 if rating else None,
    )


def parse_opentripmap_place(place: dict) -> Attraction:
    point = place.get("point", {})
    extract = place.get("wikipedia_extracts", {})
    return Attraction(
        id=str(place.get("xid", id(place))),
        name=place.get("name", ""),
        category="",
        description=str(extract.get("text", place.get("kinds", "")))[:300],
        coordinates={"lat": point["lat"], "lng": point["lon"]} if point else None,
    )
