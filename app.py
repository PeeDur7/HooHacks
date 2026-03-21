import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = Flask(__name__)
CORS(app)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are a food environmental impact analyst. Given a meal description, analyze each food item's carbon footprint and water usage, and provide a summary of the meal's overall environmental impact.

    Return valid JSON matching this exact schema:
    {
        "meal": "<the original meal description>",
        "items": [
        { "name": "<food item>", "co2_lbs": <number>, "water_gallons": <number>}
        ],
        "total_co2_lbs": <number>,
        "total_water_gallons": <number>,
        "severity": "<low|medium|high>",
        "comparisons": {
            "driving_miles": <number>,
            "showers": <number>
        },
        "swaps": [
            { "suggestion": "<full meal alternative>", "co2_lbs": <number>, "water_gallons": <number>, "severity": "<low|medium|high>", "comparisons": { "driving_miles": <number>, "showers": <number> } }
        ]
    }

    Guidelines:
    - Base estimates on published lifecycle assessment data for food products.
    - co2_lbs is the total CO2-equivalent emissions in pounds for a typical single serving.
    - water_gallons is the total water footprint in gallons for a typical single serving.
    -  severity: "low" if total_co2_lbs < 2.5, "medium" if 2.5-10, "high" if > 10.
    - comparisons.driving_miles: total_co2_lbs divided by 0.89 (avg lbs CO2 per mile driven).
    - comparisons.showers: total_water_gallons divided by 17 (gallons per 8-min shower).
    - provide 2 swaps suggesting greener full-meal alternatives (not per-item), with their own total co2_lbs, water_gallons, and severity rating.
    - If the input is not a food item, return: {"error": "Please enter a valid meal description."}"""

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    if not data or not data.get("meal", "").strip():
        return jsonify({"error": "Please provide a meal description."}), 400

    meal = data["meal"].strip()

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"Analyze this meal: {meal}",
            config={
                "response_mime_type": "application/json",
                "temperature": 0.3,
                "system_instruction": SYSTEM_PROMPT,
            },
        )
        result = json.loads(response.text)
        return jsonify(result)
    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse AI response."}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
