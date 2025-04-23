import os
from google import genai
from google.genai import types

__all__ = [
    "GeminiAPISwitcher",
    "get_switcher_for_file",
]

class GeminiAPISwitcher:
    """
    Manages multiple Gemini API keys, with automatic rotation on quota/403 errors.
    Optionally starts from a specific key index.
    """
    def __init__(self, env_vars, start_index=0):
        self.env_vars = env_vars
        self.api_keys = [os.getenv(var) for var in env_vars]
        if not all(self.api_keys):
            missing = [var for var, key in zip(env_vars, self.api_keys) if not key]
            raise ValueError(f"Missing API keys for vars: {missing}")
        self.index = start_index % len(self.api_keys)

    def get_key(self):
        return self.api_keys[self.index]

    def switch_key(self):
        """Rotate to the next API key; raise if all exhausted."""
        self.index = (self.index + 1) % len(self.api_keys)
        print(f"🔁 Switched to key #{self.index + 1} ({self.env_vars[self.index]})")

    def get_client(self):
        """Return a genai.Client using the current API key."""
        return genai.Client(api_key=self.get_key())

    def call_stream(self, model, contents, config):
        """
        Wrapper around client.models.generate_content_stream that auto-rotates on quota/403.
        Yields chunks from all keys until successful.
        """
        attempt = 0
        while attempt < len(self.api_keys):
            client = self.get_client()
            try:
                for chunk in client.models.generate_content_stream(
                    model=model,
                    contents=contents,
                    config=config,
                ):
                    yield chunk
                return
            except Exception as e:
                err = str(e).lower()
                if getattr(e, 'status_code', None) == 403 or "quota" in err:
                    print(f"🚫 Key #{self.index + 1} failed ({self.env_vars[self.index]}): {e}")
                    self.switch_key()
                    attempt += 1
                    continue
                raise
        raise RuntimeError("All API keys exhausted via call_stream.")


def get_switcher_for_file(file_number):
    """
    Factory to create a GeminiAPISwitcher for a given file index.
    Assigns initial key based on file_number modulo number of keys.

    Usage:
        switcher = get_switcher_for_file(2)
        client = switcher.get_client()
    """
    # discover all GEMINI_API_KEY* vars
    key_vars = sorted([k for k in os.environ if k.startswith("GEMINI_API_KEY")])
    return GeminiAPISwitcher(key_vars, start_index=file_number)
