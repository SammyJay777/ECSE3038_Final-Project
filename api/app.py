from flask import Flask, request, json, jsonify
from flask_pymongo import PyMongo
from marshmallow import Schema, fields, ValidationError
from bson.json_util import dumps
from json import loads
import datetime
from flask_socketio import SocketIO
from flask_cors import CORS

app = Flask(__name__)
app.config["MONGO_URI"]=''
CORS(app)
mongo = PyMongo(app)
# socketConnect = False
# socket stuff
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")
# socketio = SocketIO(app, cors_allowed_origins="http://127.0.0.1:5501")

class RecordValidation(Schema):
    patient_id = fields.String(required = True)
    position = fields.Integer(required = True, strict = True)
    temperature = fields.Integer(required = True, strict = True)

class PatientValidation(Schema):
    fname = fields.String(required = True)
    lname = fields.String(required = True)
    age = fields.Integer(required = True, strict = True)
    patient_id = fields.String(requred = True)

# "route" that gets the connection message
@socketio.on('frontendconnect')
def handle_my_custom_event(json):
    print('notification: ' + str(json))

@app.route("/api/record", methods = ["POST"])
def new_record():
    # received by the backend
    x = datetime.datetime.now()
    timeString = x.strftime("%m"+"/"+"%d"+"/"+"%Y"+"-"+"%H"+":"+"%M"+":"+"%S")
    req = request.json 
    # print(req)
    # Just incase the request has additional unwanted records
    database = {
        "patient_id" : req["patient_id"],
        "position" : req["position"],
        "temperature":req["temperature"]
    }
    
    try:
        recordTemp = RecordValidation().load(database) # only fails when it gets bad data (violates schema)
        recordTemp["last_updated"] = timeString
        mongo.db.record.insert_one(recordTemp) # fails when db isn't connected
        # saved in the database
        # now pull record with the id that called this view function (use timestamp too)
        mostrecentrecord = mongo.db.record.find_one({"last_updated":recordTemp["last_updated"]})
        jsonobject = loads(dumps(mostrecentrecord))
        socketio.emit('message', jsonobject)
        return {"success":True, "msg":"Data saved in database successfully"}
    except ValidationError as ve:
        return ve.messages, 400 # Bad Request hence data was not saved to the database
    except Exception as e:   
        return {"msg" : "Can't insert_one to record collection"},500 # data was not saved to the database because of some internal server error
# {"patient_id":id, "temperature": 40}
@app.route("/api/record/<id>")
def get_records(id):
    x = datetime.datetime.now()
    currentTimeString = x.strftime("%m"+"/"+"%d"+"/"+"%Y"+"-"+"%H"+":"+"%M"+":"+"%S")
    y = x - datetime.timedelta(minutes=30)
    pastTimeString = y.strftime("%m"+"/"+"%d"+"/"+"%Y"+"-"+"%H"+":"+"%M"+":"+"%S")
    dbList = []
    for document in mongo.db.record.find({"patient_id":id,"last_updated" : {"$gte" : pastTimeString , "$lte" : currentTimeString}}):
        dbList.append(document)
    print(dbList)
    return jsonify(loads(dumps(dbList)))

# Frontend requests 
@app.route("/api/patient")
def get_patients():
    allobjects = mongo.db.patient.find()
    jsonobject = jsonify(loads(dumps(allobjects))) # convert python list to json(Response instance in python) ("<class 'flask.wrappers.Response'>")
    # print(type(jsonobject))
    return jsonobject

@app.route('/api/patient', methods = ['POST'])
def add_patient():
    req = request.json
    # Just incase the request has additional unwanted records 
    database = {
        "fname" : req["fname"],
        "lname" : req["lname"],
        "age" : req["age"],
        "patient_id":req["patient_id"]
    }  
    try:
        patientTemp = PatientValidation().load(database) # only fails when it gets bad data (violates schema)
        mongo.db.patient.insert_one(patientTemp) # fails when db isnt connected and such
        return {"success":True, "msg":"Data saved in database successfully"}
    except ValidationError as ve:
        return ve.messages, 400 # Bad Request hence data was not saved to the database
    except Exception as e:
        return {"msg" : "Can't insert_one to patient collection"}, 500 # data was not saved to the database because of some internal server error

@app.route('/api/patient/<id>', methods = ["GET", "PATCH", "DELETE"])
def get_a_patient(id):
    anobject = mongo.db.patient.find_one({"patient_id":id})
    jsonobject = loads(dumps(anobject))
    if request.method == "GET":
        return jsonobject
    elif request.method == "PATCH":
        req = request.json
        if "fname" in req:
            jsonobject["fname"] = req["fname"]
            mongo.db.patient.update_one({"patient_id":id}, {"$set":{"fname":jsonobject["fname"]}})
        if "lname" in req:
            jsonobject["lname"] = req["lname"]
            mongo.db.patient.update_one({"patient_id":id}, {"$set":{"lname": jsonobject["lname"]}})
        if "age" in req:
            jsonobject["age"] = req["age"]
            mongo.db.patient.update_one({"patient_id":id}, {"$set":{"age": jsonobject["age"]}})
        if "patient_id" in req:
            jsonobject["patient_id"] = req["patient_id"]
            mongo.db.patient.update_one({"patient_id":id}, {"$set":{"patient_id":jsonobject["patient_id"]}})
        # at this point in the program, the id would have updated if an id update was sent
        # so use the jsonobject["patient_id"] to search for the document
        anobject = mongo.db.patient.find_one({"patient_id":jsonobject["patient_id"]})
        jsonobject = loads(dumps(anobject))
        return jsonobject
    elif request.method == "DELETE":
        deleteinstance = mongo.db.patient.delete_one({"patient_id":id})
        if deleteinstance.deleted_count == 1:
            return {"success": True}
        else:
            return {"success": False}, 400

if __name__ == "__main__":
    socketio.run(app,debug = True, host="0.0.0.0", port = 3000)