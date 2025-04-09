import os; os.environ['GEMINI_API_KEY1'] = 'AIzaSyA2ni-S8khOmyijeELF6tWeBHgm34pUDes'
import os; os.environ['GEMINI_API_KEY2'] = 'AIzaSyBL2g_bUWZXDQPFEtxWlljuX6SP9RP-aiY'
import base64
import os
from google import genai
from google.genai import types
import sys
import json

# Read and process input data
input_data = json.load(sys.stdin)
building_description = input_data['building_description']
if isinstance(input_data['building_description'], str):
    building_description = json.loads(input_data['building_description'])
else:
    building_description = input_data['building_description']

sus_elements = building_description['house_description']['sustainability_features']
print("Sustainability Features:", sus_elements, file=sys.stderr)


room_num = 5

def save_binary_file(file_name, data):
    with open(file_name, "wb") as f:
        f.write(data)

def generate():
    """Generates a 2D floor plan image and returns the path of the saved image."""
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY1"),
    )

    # Upload the layout inspiration image
    files = [
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

    output_file = "C:/Users/agmen/OneDrive/桌面/khack/GreenReaper/fe/Final/2d_fplan.jpg"
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        # Ensure the chunk contains valid candidate data
        if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
            continue

        # If binary (image) data is available, save the file and return the file path
        if chunk.candidates[0].content.parts[0].inline_data:
            save_binary_file(
                output_file, chunk.candidates[0].content.parts[0].inline_data.data
            )
            print(f"✅ File saved to: {output_file} (MIME: {chunk.candidates[0].content.parts[0].inline_data.mime_type})", file=sys.stderr)
            return output_file
        else:
            print(chunk.text)
    return None

def generate1(floor_plan_path):
    """Generates a frontal view elevation image using the previously generated floor plan."""
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY2"),
    )

    # Upload the floor plan image generated in the previous step
    files = [
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

Generate a clean, minimalistic frontal view in color of a modern residential house. Use flat architectural line art only — strictly black-and-white, with no shading, coloring, or gradients. The elevation should resemble a professional architectural schematic drawing or concept sketch.

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

    output_file = "C:/Users/agmen/OneDrive/桌面/khack/GreenReaper/fe/Final/f_view.jpg"
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
            continue

        if chunk.candidates[0].content.parts[0].inline_data:
            save_binary_file(
                output_file, chunk.candidates[0].content.parts[0].inline_data.data
            )
            print(f"✅ File saved to: {output_file} (MIME: {chunk.candidates[0].content.parts[0].inline_data.mime_type})")
        else:
            print(chunk.text)

if __name__ == "__main__":
    # Generate the floor plan and capture its file path
    floor_plan_image = generate()
    if floor_plan_image:
        # Pass the generated floor plan image to generate1 automatically
        generate1(floor_plan_image)
        result = {
            "floor_plan": floor_plan_image,
            "front_view": "C:/Users/agmen/OneDrive/桌面/khack/GreenReaper/fe/Final/f_view.jpg"
        }
        print(json.dumps(result))
    else:
        print("Floor plan generation failed; frontal view cannot be generated.")
