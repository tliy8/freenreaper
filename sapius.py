# other_page.py

import os, json, sys
from sapi import get_switcher_for_file, GeminiAPISwitcher


def main():

    switcher = get_switcher_for_file(2)

    input_data = json.load(sys.stdin)
    prompt = input_data["prompt_text"]

    contents = [
        types.Content(
            role="user",
            parts=[ types.Part.from_text(text=prompt) ]
        )
    ]
    config = types.GenerateContentConfig(
        temperature=0.7,
        top_p=0.9,
        max_output_tokens=500
    )
    model = "gemini-2.0-small"

    for chunk in switcher.call_stream(model, contents, config):
        print(chunk.text)

if __name__ == "__main__":
    main()
