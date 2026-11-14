"""The record shape sent to Brexoo. Mirrors `features/collector/schema.ts` and the
`collected_projects` table, so anything valid here is accepted by the API."""

from __future__ import annotations

import datetime as dt
import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator

Country = Literal["US", "AU", "NZ"]


class CollectedProject(BaseModel):
    external_id: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    category_code: str | None = Field(default=None, max_length=40)
    scope: Literal["local", "regional"] = "local"
    country: Country
    region: str | None = Field(default=None, max_length=80)
    city: str | None = Field(default=None, max_length=80)
    suburb: str | None = Field(default=None, max_length=80)
    postcode: str | None = Field(default=None, max_length=12)
    address: str | None = Field(default=None, max_length=200)
    stage: str | None = Field(default=None, max_length=80)
    estimated_value_minor: int | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, pattern=r"^[A-Z]{3}$")
    observed_at: dt.date | None = None
    closes_at: dt.date | None = None
    source_url: str | None = Field(default=None, max_length=500)
    status: Literal["active", "closed"] = "active"

    @field_validator("title", "description", "city", "suburb", "address", "stage", "region", mode="before")
    @classmethod
    def _squash(cls, v: object) -> object:
        if isinstance(v, str):
            v = re.sub(r"\s+", " ", v).strip()
            return v or None
        return v

    @field_validator("title", "description", "city", "suburb", "address", "stage", "region", mode="before")
    @classmethod
    def _fit(cls, v: object, info) -> object:
        limits = {"title": 200, "description": 4000, "city": 80, "suburb": 80, "address": 200, "stage": 80, "region": 80}
        return v[: limits[info.field_name]] if isinstance(v, str) else v

    @field_validator("source_url", mode="before")
    @classmethod
    def _url(cls, v: object) -> object:
        if isinstance(v, str) and not v.startswith(("http://", "https://")):
            return None
        return v

    def to_payload(self) -> dict:
        data = self.model_dump(mode="json", exclude_none=True)
        return data
