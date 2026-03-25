from __future__ import annotations

from typing import Any

from openai import AsyncOpenAI
from openai import BadRequestError

from app.config import get_settings
from app.services.ai_protocol import ChatMessage, CompletionResult


class OpenRouterProvider:
    """OpenAI-compatible chat completions via OpenRouter (any model slug they route)."""

    def __init__(self) -> None:
        s = get_settings()
        if not s.openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY is not set")
        headers: dict[str, str] = {}
        if s.openrouter_http_referer:
            headers["HTTP-Referer"] = s.openrouter_http_referer
        if s.openrouter_app_title:
            headers["X-Title"] = s.openrouter_app_title
        self._client = AsyncOpenAI(
            api_key=s.openrouter_api_key,
            base_url=s.openrouter_base_url.rstrip("/"),
            default_headers=headers or None,
        )

    async def complete(
        self,
        messages: list[ChatMessage],
        model: str,
        *,
        json_mode: bool = False,
        max_tokens: int | None = None,
    ) -> CompletionResult:
        kwargs: dict[str, Any] = {
            "model": model,
            "messages": [m.model_dump() for m in messages],
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        budgets = self._build_token_budgets(max_tokens)
        last_error: Exception | None = None

        for budget in budgets:
            call_kwargs = dict(kwargs)
            if budget is not None:
                call_kwargs["max_tokens"] = budget
            try:
                resp = await self._client.chat.completions.create(**call_kwargs)
                choice = resp.choices[0]
                text = choice.message.content or ""
                return CompletionResult(text=text.strip(), raw=resp.model_dump() if hasattr(resp, "model_dump") else None)
            except BadRequestError as exc:
                if not self._is_insufficient_credit_error(exc):
                    raise
                last_error = exc
                continue

        if last_error is not None:
            raise last_error
        raise RuntimeError("OpenRouter completion failed before a response was returned.")

    @staticmethod
    def _build_token_budgets(max_tokens: int | None) -> list[int | None]:
        if max_tokens is None or max_tokens <= 0:
            return [None]

        budgets = [max_tokens]
        while budgets[-1] > 256:
            next_budget = max(256, budgets[-1] // 2)
            if next_budget == budgets[-1]:
                break
            budgets.append(next_budget)
            if next_budget == 256:
                break
        return budgets

    @staticmethod
    def _is_insufficient_credit_error(exc: BadRequestError) -> bool:
        body = exc.body if isinstance(exc.body, dict) else {}
        message = ""
        if isinstance(body, dict):
            error = body.get("error")
            if isinstance(error, dict):
                message = str(error.get("message", ""))
        if not message:
            message = str(exc)
        lowered = message.lower()
        return "requires more credits" in lowered or "fewer max_tokens" in lowered or "'code': 402" in lowered
