// URL of the server 
var serverURL = "http://192.168.1.7:5000";

var patientPath = serverURL + "/api/patient";
var recordPath = serverURL + "/api/record/";
var temperaturePath = recordPath + "graph/";

var graphData = [];
var labelData = [];

// Get patient id from session storage and close session storage
var id = sessionStorage.getItem("patient_id");
console.log(id);
sessionStorage.removeItem("patient_id");
sessionStorage.clear();

function createPatientCard(patient, record){
    var containerDiv = document.createElement("DIV");
    containerDiv.classList.add("container");

    //Create div to store patient info
    var patinetInfoDiv = document.createElement("DIV");
    patinetInfoDiv.classList.add("patient_info");

    var firstNameDiv = document.createElement("DIV");
    firstNameDiv.classList.add("first_name");
    var firstNameSpan1 = document.createElement("SPAN");
    firstNameSpan1.innerHTML = "First Name";
    var firstNameSpan2 = document.createElement("SPAN");
    firstNameSpan2.innerHTML = patient.first_name;
    firstNameDiv.append(firstNameSpan1);
    firstNameDiv.append(firstNameSpan2);

    var lastNameDiv = document.createElement("DIV");
    lastNameDiv.classList.add("last_name");
    var lastNameSpan1 = document.createElement("SPAN");
    lastNameSpan1.innerHTML = "Last Name";
    var lastNameSpan2 = document.createElement("SPAN");
    lastNameSpan2.innerHTML = patient.last_name;
    lastNameDiv.append(lastNameSpan1);
    lastNameDiv.append(lastNameSpan2);

    var positionDiv = document.createElement("DIV");
    positionDiv.classList.add("position");
    var positionSpan1 = document.createElement("SPAN");
    positionSpan1.innerHTML = "Position";
    var positionSpan2 = document.createElement("SPAN");
    positionSpan2.innerHTML = record.position;
    positionDiv.append(positionSpan1);
    positionDiv.append(positionSpan2);

    var tempDiv = document.createElement("DIV");
    tempDiv.classList.add("temperature");
    var tempSpan1 = document.createElement("SPAN");
    tempSpan1.innerHTML = "Temperature";
    var tempSpan2 = document.createElement("SPAN");
    tempSpan2.innerHTML = record.temperature;
    tempDiv.append(tempSpan1);
    tempDiv.append(tempSpan2);

    patinetInfoDiv.append(firstNameDiv);
    patinetInfoDiv.append(lastNameDiv);
    patinetInfoDiv.append(positionDiv);
    patinetInfoDiv.append(tempDiv);

    // Create div to display the graph
    var graphDiv = document.createElement("DIV");
    graphDiv.classList.add("graph");

    var graphCanvas = document.createElement("CANVAS");
    graphCanvas.setAttribute("id", "myChart");
    graphCanvas.setAttribute("width", 400);
    graphCanvas.setAttribute("height", 400);

    graphDiv.append(graphCanvas);

    // Add patient info  div and grapgh div to container div
    containerDiv.append(patinetInfoDiv);
    containerDiv.append(graphDiv);

    return containerDiv;
}


function getTemperature(id){
    return fetch(temperaturePath + id).then(res => res.json()).then(json => json);
}

async function getTemperatureData(id){
    let dataPoints = await getTemperature(id);
    
    dataPoints.forEach(dataPoint => {
        console.log(dataPoint.temperature);
        graphData.push(dataPoint.temperature);
        labelData.push(dataPoint.last_updated);
    });            
}

function displayGraph(){
    var chart = document.getElementById('myChart').getContext('2d');
    var myChart = new Chart(chart, {
        type: 'line',
        data: {
            labels: labelData,
            datasets:[
            {
                label: "Temperature vs. Time",
                fill: false,
                lineTension: 0.1,
                borderColor: 'rgb(75, 192, 192)',
                data: graphData,
            }
            ]
        },
    });
}


function getPatientData(){
    return fetch(patientPath).then(res => res.json()).then(json => json);
}

function getRecord(id){
    return fetch(recordPath + id).then(res => res.json()).then(json => json);
}

async function getRecordData(id){
    let record = await getRecord(id);
    return record;
}

async function displayPatientData(){
    let patients = await getPatientData();  
    console.log(patients);

    patients.forEach(patient => {
        console.log(patient.patient_id);
        if(id == patient.patient_id){
            getRecordData(patient.patient_id).then(res => {
                var content = document.querySelector(".content");
                console.log(res);
                content.append(createPatientCard(patient, res));                    
            }); 
        }       
    });            
}

window.onload = function(){
    displayPatientData();
    getTemperatureData(id);

    window.setTimeout(function(){
        displayGraph();
    }, 3000);
}