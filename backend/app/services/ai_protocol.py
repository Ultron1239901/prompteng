from __future__ import annotations

from typing import Any, Protocol

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str


class CompletionResult(BaseModel):
    text: str
    raw: dict[str, Any] | None = None


class AIProvider(Protocol):
    async def complete(self, messages: list[ChatMessage], model: str, *, json_mode: bool = False) -> CompletionResult:
        ...
