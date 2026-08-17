"""
Thin wrapper around whichever LLM provider is actually doing the NL -> SQL
translation.

We're using Groq for the free tier's inference speed (sub-second responses
on Llama 3.3 70B, which matters a lot for a chat UI - nobody wants to stare
at a spinner for 5 seconds per question). Groq's API is OpenAI-compatible,
so instead of pulling in a separate SDK we just point the official `openai`
client at Groq's base_url. One client, one interface, and if we ever want to
switch to OpenAI/Anthropic/a local vLLM server later it's a base_url and
model name change, not a rewrite.

TODO: if this ever needs to fail over between providers (e.g. Groq rate
limit hit -> fall back to Gemini), wrap this in a small router. Not doing
that now - premature for a single-instance portfolio project and it would
obscure which provider actually generated a given query.
"""
from openai import AsyncOpenAI, APITimeoutError

from app.config import get_settings

settings = get_settings()

_client = AsyncOpenAI(
    api_key=settings.groq_api_key,
    base_url="https://api.groq.com/openai/v1",
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
    module only knows about talking to Groq."""
    try:
        response = await _client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            # Groq supports OpenAI's JSON mode on the instruct models we use.
            # This doesn't guarantee valid JSON on its own (the schema still
            # has to be spelled out in the prompt) but it meaningfully cuts
            # down on the model wrapping its answer in markdown fences or
            # adding a "Sure, here's the query:" preamble.
            response_format={"type": "json_object"},
            temperature=0.1,  # this is query generation, not creative writing -
                              # low temperature keeps it from getting inventive
                              # with column names it half-remembers.
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
    """Even with response_format=json_object, cheaper/smaller models
    occasionally still wrap output in ```json ... ``` out of habit from
    their training data. Cheap enough to defend against that it's not worth
    an extra round trip when it happens."""
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]  # drop the ```json line
        if text.endswith("```"):
            text = text[: -3]
    return text.strip()
