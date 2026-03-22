from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
import jwt

authBlueprint = Blueprint("auth", __name__)

@authBlueprint.route("/register", methods=["POST"])
def registerUser():
    db = current_app.config["db"]
    data = request.get_json()

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    confirmPassword = data.get("confirmPassword")

    if not email or not password or not confirmPassword:
        return jsonify({"error" : "All fields are required"}),400
    
    user = db["users"].find_one({"email" : email})
    if user:
        return jsonify({"error" : "User has already been registered"}),400
    
    elif confirmPassword != password: #if passwords dont match dont proceed to user registration
        return jsonify({"error" : "Passwords do not match"}),400
    
    #encrypt the password then store it in the database
    encryptedPassword = generate_password_hash(password)
    db["users"].insert_one({
        "username" : username,
        "email" : email,
        "password" : encryptedPassword,
    })

    return jsonify({"message" : "User registered sucessfully"}),201

    
@authBlueprint.route("/login", methods=["POST"])
def loginUser():
    db = current_app.config["db"]
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error" : "All fields are required"}),401
    
    user =  db["users"].find_one({"email" : email})
    if not user:
        return jsonify({"error" : "Email does not exist"}),401
    
    #if the encrypted password is not the same as the encrypted password of the email, return an error
    elif not check_password_hash(user["password"],password):
        return jsonify({"error" : "Passwords do not match"}),401
    
    jwtToken = jwt.encode({
        "userId" : str(user["_id"]),
        "exp" : datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
    }, current_app.config["SECRET_KEY"], algorithm="HS256")

    return jsonify({"token" : jwtToken, "username" : user["username"]}),200
