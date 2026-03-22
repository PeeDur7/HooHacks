from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
import datetime
import jwt

userBluePrint = Blueprint("user", __name__)

@userBluePrint.route("/addFood", methods=["POST"])
def addFoodToDatabase(): #recieves a jwt token and the food data as json
    db = current_app.config["db"]
    data = request.get_json()
    
    authHeader = request.headers.get("Authorization")
    if not authHeader:
        return jsonify({"error" : "Missing token"}), 401
    token = authHeader.split(" ")[1]    

    try:
        decodedToken = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    
    userId = decodedToken["userId"] #get user id from the token

    user = db["users"].find_one({"_id" : ObjectId(userId)})
    if not user:
        return jsonify({"error" : "User is not authenticated"}),401
    
    currentDate = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
    food = data.get("food")

    #each time a new food is added, the date formated in xxxx-xx-xx is the key, then the actual food dictionary
    #this makes searching for the last 7 days worth of food is easy

    newFood = {
        currentDate : food,
    }

    db["users"].update_one(
        {"_id" : ObjectId(userId)},
        {"$push" : {"foods" : newFood}}
    )

    return jsonify({"message" : "Food added sucessfully"}),200

@userBluePrint.route("/avgEmissionPerWeek", methods=["GET"])
def avgEmissionPerWeek(): #this method should only recieve a jwt token as the parameter from the frontend
    db = current_app.config["db"]
    authHeader = request.headers.get("Authorization")

    if not authHeader:
        return jsonify({"error" : "Missing token"}), 401
    token = authHeader.split(" ")[1]

    try:
        decodedToken = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    
    userId = decodedToken["userId"] #get user id from the token

    user = db["users"].find_one({"_id" : ObjectId(userId)})
    if not user:
        return jsonify({"error" : "User is not authenticated"}),401
    
    currentDate = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
    pastWeekDate = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)).strftime("%Y-%m-%d")
    total = 0

    foods = user.get("foods",[])
    for food in foods:
        date = list(food.keys())[0]
        if date >= pastWeekDate and date <= currentDate:
            total += food[date]["total_co2_kg"]
    
    avg = total / 7 if total > 0 else 0
    return jsonify({"total_co2_kg": avg}), 200 #returns the weekly average CO2