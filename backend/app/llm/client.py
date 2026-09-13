"""
Thin wrapper around whichever LLM provider is actually doing the NL -> SQL
translation.

We're using Google's Gemini Flash models: query generation is a small,
tightly-specified task, so a Flash-tier model is both cheap enough for a free
tier and fast enough that a chat UI doesn't feel like it's stalling. Gemini
exposes an OpenAI-compatible endpoint, so instead of pulling in Google's own
SDK we point the official `openai` client at Gemini's base_url. One client,
one interface, and switching providers again is a base_url and model name
change, not a rewrite.

Two Gemini-specific details worth knowing before editing the call below:

1. Don't set temperature. Google's Gemini 3 guidance is explicit that values
   below 1.0 (the default) cause looping and degraded output - the reasoning
   is calibrated for the default. The determinism we want for SQL generation
   comes from reasoning_effort, not from lowering temperature.
2. Gemini 3 models can't have reasoning switched off. reasoning_effort="low"
   is the closest thing to "just answer", and it's deliberately the one value
   that means something sensible across both families - it maps to a
   thinking_budget of 1024 on 2.5 models and thinking_level=low on 3.x - so
   it stays valid if GEMINI_MODEL is pointed at a different Flash model.

TODO: if this ever needs to fail over between providers (e.g. Gemini rate
limit hit -> fall back to something else), wrap this in a small router. Not
doing that now - premature for a single-instance portfolio project and it
would obscure which provider actually generated a given query.
"""
from openai import AsyncOpenAI, APITimeoutError

from app.config import get_settings

settings = get_settings()

# Gemini's OpenAI-compatible surface. Note there's no /v1 in this path and the
# trailing slash matters - the SDK appends "chat/completions" to it verbatim.
_client = AsyncOpenAI(
    api_key=settings.gemini_api_key,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    timeout=settings.llm_timeout_seconds,
)


class LlmRequestError(Exception):
    """Raised when the provider call itself fails (timeout, rate limit, 5xx).
    Deliberately separate from parsing errors (see nl_to_sql.py) so callers
    can tell "the model never responded" apart from "it responded with
    garbage"."""


async def chat_json(system_prompt: str, user_message: str) -> str:
    """Sends a chat completion request and returns the raw JSON string the
    model produced. Does not parse it - that's nl_to_sql.py's job, this
    module only knows about talking to Gemini."""
    try:
        response = await _client.chat.completions.create(
            model=settings.gemini_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            # JSON mode. This doesn't guarantee valid JSON on its own (the
            # schema still has to be spelled out in the prompt) but it
            # meaningfully cuts down on the model wrapping its answer in
            # markdown fences or adding a "Sure, here's the query:" preamble.
            # Params the compatibility layer doesn't understand are ignored
            # rather than rejected, so this degrades quietly if Google ever
            # drops it.
            response_format={"type": "json_object"},
            # Keeps thinking shallow enough that the chat UI stays responsive.
            # See the module docstring for why this is "low" rather than
            # "none" and why there's no temperature here.
            reasoning_effort="low",
        )
    except APITimeoutError as exc:
        raise LlmRequestError("The model took too long to respond.") from exc
    except Exception as exc:  # noqa: BLE001 - deliberately broad, see below
        # openai's client raises a handful of different exception subclasses
        # for rate limits, auth failures, connection errors, etc. We collapse
        # all of them into one error type at this boundary because the route
        # handler only needs to know "the LLM call failed" - the specific
        # exception still shows up in logs for debugging.
        raise LlmRequestError(f"The language model request failed: {exc}") from exc

    content = response.choices[0].message.content
    if not content:
        raise LlmRequestError("The model returned an empty response.")
    return content


def strip_markdown_fences(raw: str) -> str:
    """Even with JSON mode on, models occasionally still wrap output in
    ```json ... ``` out of habit from their training data. Cheap enough to
    defend against that it's not worth an extra round trip when it happens."""
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]  # drop the ```json line
        if text.endswith("```"):
            text = text[:-3]
    return text.strip()
