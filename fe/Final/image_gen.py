import os; os.environ['GEMINI_API_KEY1'] = 'AIzaSyBKyen76O3fTmTnQidg42u14z5e_PChfVo'
import os; os.environ['GEMINI_API_KEY2'] = 'AIzaSyB5oltuq_EXN0Gx_lo6jo8idtA0EtT0nII'
import os
from google import genai
from google.genai import types
import sys
import json


input_data = json.load(sys.stdin)
building_description = input_data['building_description']
if isinstance(input_data['building_description'], str):
    building_description = json.loads(input_data['building_description'])
else:
    building_description = input_data['building_description']

sus_elements = building_description['house_description']['sustainability_features']

room_num = building_description['house_description']['house_type']

def save_binary_file(file_name, data):
    with open(file_name, "wb") as f:
        f.write(data)

def save_binary_file(file_name, data):
    f = open(file_name, "wb")
    f.write(data)
    f.close()


def generate():
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY1"),
    )

    files = [
        # Make the file available in local system working directory
        client.files.upload(file="C:/Users/agmen/OneDrive/桌面/khack/GreenReaper/fe/Final/plan.jpg"),
    ]
    model = "gemini-2.0-flash-exp-image-generation"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_uri(
                    file_uri=files[0].uri,
                    mime_type=files[0].mime_type,
                ),
                types.Part.from_text(text=f"""
                
                You are a professional architectural planner.

Use the uploaded image only as layout inspiration — do not include any furniture.

Generate a simple 2D architectural floor plan with only the following labeled rooms:

{room_num} Bedrooms

2 Bathrooms

1 Kitchen

1 Dining Room

1 Living Room

1 Garage

1 Hallway

1 Storage Room

1 Walk-in Closet


"""),
            ],
        )
    ]
    generate_content_config = types.GenerateContentConfig(
        temperature=1,
        top_p=0.95,
        top_k=40,
        max_output_tokens=20000,
        response_modalities=[
            "image",
            "text",
        ],
        safety_settings=[
            types.SafetySetting(
                category="HARM_CATEGORY_CIVIC_INTEGRITY",
                threshold="OFF",  # Off
            ),
        ],
        response_mime_type="text/plain",
    )

    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
            continue
        if chunk.candidates[0].content.parts[0].inline_data:
            file_name = "C:/Users/agmen/OneDrive/桌面/khack/GreenReaper/fe/Final/2d_fplan.jpg"
            save_binary_file(
                file_name, chunk.candidates[0].content.parts[0].inline_data.data
            )
            print(
                f"✅ File saved to: {file_name} (MIME: {chunk.candidates[0].content.parts[0].inline_data.mime_type})"
            )
        else:
            print(chunk.text)

# Part 2

def generate1(floor_plan_path):
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY2"),
    )

    files = [
        # Make the file available in local system working directory
        client.files.upload(file=floor_plan_path),
    ]
    model = "gemini-2.0-flash-exp-image-generation"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_uri(
                    file_uri=files[0].uri,
                    mime_type=files[0].mime_type,
                ),
                types.Part.from_text(text=f""" 

Generate a clean, minimalistic frontal view  in color of a modern residential house. Use flat architectural line art only — strictly black-and-white, with no shading, coloring, or gradients. The elevation should resemble a professional architectural schematic drawing or concept sketch.

Integrate the following sustainability features clearly and naturally into the design:

{sus_elements}
Ensure the overall design is visually balanced, harmonious, and realistically feasible. Avoid decorative elements. Focus on clean lines and architectural proportioning to reflect an eco-conscious, functional modern home.



"""),
            ],
        )
    ]
    generate_content_config = types.GenerateContentConfig(
        temperature=1,
        top_p=0.95,
        top_k=40,
        max_output_tokens=20000,
        response_modalities=[
            "image",
            "text",
        ],
        safety_settings=[
            types.SafetySetting(
                category="HARM_CATEGORY_CIVIC_INTEGRITY",
                threshold="OFF",  # Off
            ),
        ],
        response_mime_type="text/plain",
    )

    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
            continue
        if chunk.candidates[0].content.parts[0].inline_data:
            file_name = "C:/Users/agmen/OneDrive/桌面/khack/GreenReaper/fe/Final/f_view.jpg"
            save_binary_file(
                file_name, chunk.candidates[0].content.parts[0].inline_data.data
            )
            print(
                f"✅ File saved to: {file_name} (MIME: {chunk.candidates[0].content.parts[0].inline_data.mime_type})"
            )
        else:
            print(chunk.text)


if __name__ == "__main__":
    generate()
    generate1("C:/Users/agmen/OneDrive/桌面/khack/GreenReaper/fe/Final/2d_fplan.jpg")
