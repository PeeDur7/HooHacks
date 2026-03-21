from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
import datetime
import jwt

userBluePrint = Blueprint("user", __name__)

@userBluePrint.route("/addFood", methods=["POST"])
def addFoodToDatabase(): #recieves a jwt token and the food data as json
    db = current_app.config["db"]
    data = request.get_json()
    
    token = request.headers.get("Authorization").split(" ")[1]
    food = data.get("food")

    decodedToken = jwt.decode(token, current_app.config["SECRET_KEY"],algorithms=["HS256"])
    userId = decodedToken["userId"] #get user id from the token

    user = db["users"].find_one({"_id" : ObjectId(userId)})
    if not user:
        return jsonify({"error" : "User is not authenticated"}),401
    
    currentDate = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")

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
    token = request.headers.get("Authorization").split(" ")[1]

    decodedToken = jwt.decode(token, current_app.config["SECRET_KEY"],algorithms=["HS256"])
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
            total += food[date]["emission"]
    
    return jsonify({"avgEmission": total / 7}), 200 #returns the weekly average CO2