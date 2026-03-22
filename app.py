import os
import json
import base64
import io
from PIL import Image
import pillow_heif
pillow_heif.register_heif_opener()
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from pymongo import MongoClient

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config["SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
mongoClient = MongoClient(os.getenv("MONGO_URI"))
db = mongoClient[os.getenv("DB_NAME")]
app.config["db"] = db

from auth.auth import authBlueprint
from model.user import userBluePrint

app.register_blueprint(authBlueprint, url_prefix="/auth")
app.register_blueprint(userBluePrint, url_prefix="/user")

# Creates the Gemini API client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Creates SYSTEM_PROMPT variable that gives the instructions to Gemini on how to inteperet the string, including the JSON schema to return
SYSTEM_PROMPT = """You are a food environmental impact analyst. Given a meal description, analyze each food item's carbon footprint and water usage, and provide a summary of the meal's overall environmental impact.

    Return valid JSON matching this exact schema:
    {
        "meal": "<the original meal description>",
        "items": [
        { "name": "<food item>", "co2_kg": <number>, "water_liters": <number>}
        ],
        "total_co2_kg": <number>,
        "total_water_liters": <number>,
        "severity": "<low|medium|high>",
        "comparisons": {
            "driving_miles": <number>,
            "showers": <number>
        },
        "swaps": [
            { "suggestion": "<full meal alternative>", "co2_kg": <number>, "water_liters": <number>, "severity": "<low|medium|high>", "comparisons": { "driving_miles": <number>, "showers": <number> } }
        ]
    }

    Guidelines:
    - Base estimates on published lifecycle assessment data for food products.
    - co2_kg is the total CO2-equivalent emissions in kilograms for a typical single serving.
    - water_liters is the total water footprint in liters for a typical single serving.
    -  severity: "low" if total_co2_kg < 1, "medium" if 1-4, "high" if > 4.
    - comparisons.driving_miles: total_co2_kg divided by 0.404 (avg kg CO2 per mile driven).
    - comparisons.showers: total_water_liters divided by 65 (liters per 8-min shower).
    - provide 2 swaps suggesting greener full-meal alternatives (not per-item), with their own total co2_kg, water_liters, and severity rating.
    - If the input is not a food item, return: {"error": "Please enter a valid meal description."}"""

# Runs the analyze-text function when POST request is sent to analyze-text
@app.route("/analyze-text", methods=["POST"])
def analyze_text():
    # reads JSON sent from frontend to convert into dictionary
    data = request.get_json()
    # checks if JSON body is empty and if the "meal" key is there
    if not data or not data.get("meal", "").strip():
        return jsonify({"error": "Please provide a meal description."}), 400

    # cleans up the string to send to Gemini
    meal = data["meal"].strip()

    # Handles errors if anything goes wrong
    try:
        # AI call to Gemini with the given meal
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"Analyze this meal: {meal}",
            config={
                "response_mime_type": "application/json",
                "temperature": 0.3,
                "system_instruction": SYSTEM_PROMPT,
            },
        )

        # converts text into dictionary
        result = json.loads(response.text)

        # return data as JSON
        return jsonify(result)
    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse AI response."}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# runs analyze-image function when POST request is sent to analyze-image
@app.route("/analyze-image", methods=["POST"])
def analyze_image():

    #checks if request includes file with the key "image"
    if "image" not in request.files:
        return jsonify({"error": "Please upload an image."}), 400

    # gets uploaded file, converts any image format to JPEG for Gemini compatibility
    image = request.files["image"]
    img = Image.open(image)
    img = img.convert("RGB")
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                {"text": "Analyze this meal:"},
                {"inline_data": {"mime_type": "image/jpeg", "data": image_base64}},
            ],
            config={
                "response_mime_type": "application/json",
                "temperature": 0.3,
                "system_instruction": SYSTEM_PROMPT,
            },
        )
        result = json.loads(response.text)
        return jsonify(result)
    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse AI response.", "raw": response.text}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
