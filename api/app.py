from flask import Flask, request, jsonify, Response, stream_with_context
from flask_pymongo import PyMongo
from gevent import monkey; monkey.patch_all()
from gevent.pywsgi import WSGIServer
from marshmallow import Schema, fields, ValidationError
from bson.json_util import dumps
from flask_cors import CORS
from json import loads
import json
from datetime import datetime
import time

app = Flask(__name__)
app.config["MONGO_URI"]='mongodb+srv://User620119624:Student_620119624@cluster-620119624.gb5bm.mongodb.net/Tank?retryWrites=true&w=majority'
CORS(app)
mongo = PyMongo(app)

db_patients = mongo.db.patients
db_records = mongo.db.records

class PatientData(Schema):
    fname = fields.String(required=True)
    lname = fields.String(required=True)
    age = fields.Integer(required=True)
    patient_id = fields.String(required=True)

class RecordData(Schema):
    position = fields.String(required=True)
    temperature = fields.Integer(required=True)
    last_updated = fields.String(required=True)
    patient_id = fields.String(required=True)

nextPosition = ""
nextTemperature = ""
nextID = ""
nextTime = ""

# ROUTE 1:
@app.route("/api/patient", methods=["GET", "POST"])
def home():
    if request.method == "POST":
        # /POST
        try: 
            fname = request.json["fname"]
            lname = request.json["lname"]
            age = request.json["age"]
            patient_id = request.json["patient_id"]

            jsonBody = {
                "fname": fname,
                "lname": lname,
                "age": age,
                "patient_id": patient_id
            }
            
            newPatient = PatientSchema().load(jsonBody)
            db_patients.insert_one(newPatient)

            return {
                "sucess": True,
                "message": "Patient saved to database successfully!"
            }, 200

        except ValidationError as err1:
            return {
                "sucess": False,
                "message": "An error occured while trying to post patient"
            }, 400
    else:
        # /GET
        patients = db_patients.find()

        return  jsonify(loads(dumps(patients))), 200

# ROUTE 2:
@app.route("/api/patient/<path:id>", methods=["GET", "PATCH", "DELETE"])
def Profileinfo(id):
     
    filt = {"patient_id" : id}

    if request.method == "PATCH":
        # /PATCH
        updates = {"$set": request.json}
        db_patients.update_one(filt, updates)      
        updatedPatient = db_patients.find_one(filt)

        return  jsonify(loads(dumps(updatedPatient)))

    elif request.method == "DELETE":
        # /DELETE
        tmp = db_patients.delete_one(filt)
        result = {"sucess" : True} if tmp.deleted_count == 1 else {"sucess" : False}
       
        return result

    else:
        # /GET
        patient = db_patients.find_one(filt)

        return  jsonify(loads(dumps(patient)))

# ROUTE 3:
@app.route("/api/record", methods=["GET", "POST"])
def postPatientData():
    if request.method == "POST":
        # POST:
        try:
            position = request.json["position"]
            temperature = request.json["temperature"]
            last_updated = datetime.now().strftime("%c")
            patient_id = request.json["patient_id"]

            global nextPosition, nextID, nextTemperature, nextTime
            nextPosition = position
            nextID = patient_id
            nextTemperature = temperature
            nextTime = last_updated

            jsonBody = {
                "position": position,
                "temperature": temperature,
                "last_updated": last_updated,
                "patient_id": patient_id
            }

            newRecord = RecordSchema().load(jsonBody)
            db_records.insert_one(newRecord)

            return{
                "success": True,
                "message": "Record saved to database successfully"
            }, 200

        except ValidationError as err2:
            return{
                "success": False,
                "message": "An error occured while trying to post record"
            }, 400

    else:
        # GET:
        records = db_records.find()
        return  jsonify(loads(dumps(records))), 200

# ROUTE 4:
@app.route("/api/record/<path:id>", methods=["GET"])
def getPatientData(id):
    filt = {"patient_id" : id}
   
    # /GET
    record = db_records.find_one(filt)
    return  jsonify(loads(dumps(record)))

# ROUTE Listen:
@app.route("/listen")
def listen():
    def respondToClient():
        while True:
            global nextPosition, nextTemperature, nextID, nextTime

            jsonBody = {
                "position": nextPosition,
                "temperature": nextTemperature,
                "patient_id": nextID,
                "last_updated": nextTime
            }

            data = json.dumps(jsonBody)
            yield f"id: 1\ndata: {data}\nevent: online\n\n"
            time.sleep(0.5)
        
    return Response(respondToClient(), mimetype='text/event-stream')
            
if __name__ == '__main__':
    http_server = WSGIServer(("10.22.5.86", 5000), app)
    http_server.serve_forever()