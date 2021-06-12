const toggleButton = document.getElementsByClassName('toggle-button')[0]
const navbarLinks = document.getElementsByClassName('navbar-links')[0]

toggleButton.addEventListener('click', () => {
  navbarLinks.classList.toggle('active')
})

// URL of the server 
var serverURL = "http://10.22.5.86:5000";
var position = 0;
var p_id = "";
var spanNum = 0;

function createPatientCards(patient, record){
    spanNum++;
    var posID = "num"+spanNum.toString()

    var patientDataDiv = document.createElement("DIV");
    patientDataDiv.classList.add("patient_data");

    // Patient Image Div
    var patientImgDiv = document.createElement("DIV");
    patientImgDiv.classList.add("patient_img");

    var patientImgImg = document.createElement("IMG");
    patientImgImg.src = "images/user.png";    
    patientImgImg.setAttribute("id", patient.patient_id);

    var patientButtonDiv = document.createElement("DIV");
    patientButtonDiv.classList.add("buttons");

    var editButton = document.createElement("DIV");
    editButton.classList.add("edit");
    editButton.setAttribute("id", patient.patient_id);
    editButton.innerHTML = "Edit";
    var deleteButton = document.createElement("DIV");
    deleteButton.classList.add("delete");
    deleteButton.setAttribute("id", patient.patient_id)
    deleteButton.innerHTML = "Delete";
    patientButtonDiv.append(editButton);
    patientButtonDiv.append(deleteButton);

    patientImgDiv.append(patientImgImg);
    patientImgDiv.append(patientButtonDiv);

    // Display Div
    var displayDiv = document.createElement("DIV");
    displayDiv.classList.add("display");

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
    positionSpan2.setAttribute("id", patient.patient_id+":");
    positionSpan2.innerHTML = record;
    positionDiv.append(positionSpan1);
    positionDiv.append(positionSpan2);
    

    var patientIdDiv = document.createElement("DIV");
    patientIdDiv.classList.add("patient_id");
    var patientIdSpan1 = document.createElement("SPAN");
    patientIdSpan1.innerHTML = "Patient ID";
    var patientIdSpan2 = document.createElement("SPAN");
    patientIdSpan2.innerHTML = patient.patient_id;
    patientIdDiv.append(patientIdSpan1);
    patientIdDiv.append(patientIdSpan2);

    displayDiv.append(firstNameDiv);
    displayDiv.append(lastNameDiv);   
    displayDiv.append(positionDiv); 
    displayDiv.append(patientIdDiv);      

    patientDataDiv.append(patientImgDiv);
    patientDataDiv.append(displayDiv);

    return patientDataDiv;
}

var patientPath = serverURL + "/api/patient";
function getPatientData(){
    console.log("Patient Data");
    return fetch(patientPath).then(res => res.json()).then(json => json);
}

var recordPath = serverURL + "/api/record/";
function getPosition(id){
    return fetch(recordPath + id).then(res => res.json()).then(json => json);
}

async function getPositionData(id){
    let record = await getPosition(id);
    console.log(record.position);
    position = record.position;
    return position;
}

async function displayPatientData(){
    let patients = await getPatientData();  
    console.log(patients);

    patients.forEach(patient => {
        console.log(patient.patient_id);
        getPositionData(patient.patient_id).then(res => {
            var content = document.querySelector(".content");
            console.log(res);
            content.append(createPatientCards(patient, res));
        });        
    });
}

window.onload = function(){
    displayPatientData();
    
    window.setTimeout(function(){
        // Send delete request if delete button is pressed
        var deleteButtons = document.querySelectorAll(".delete");
        deleteButtons.forEach(button => {
            button.addEventListener("click", function(){
                // Send delete request to server
                console.log("DELETE "+ button.id);
                fetch(patientPath +"/"+ button.id, {
                    method: "DELETE",
                    headers: {
                        "Content-type": "application/json",
                    },
                });

                var content = document.querySelector(".content");
                content.innerHTML = "";
            });
        });

        // Redirect user to page where they can make edit the information
        var editButtons = document.querySelectorAll(".edit");
        editButtons.forEach(button => {
            button.addEventListener("click", function(){
                // Navigate to page where edits can be made
                console.log(button.id);

                // Save ID to session storage and redirect to the edit page
                sessionStorage.setItem("patient_id", button.id);
                location.href = "information.html";
                window.open("information.html");
            });
        });

        // Redirect user to the page where they can view a patients data in detail
        var patientImg = document.querySelectorAll("img");
        patientImg.forEach(img => {
            img.addEventListener("click", function(){
                console.log(img.id);

                // Save ID to session storage and redirect to the edit page
                sessionStorage.setItem("patient_id", img.id);
                location.href = "individual_info.html";
                window.open("individual_info.html");
            });
        })
    }, 5000);   

    // Receive the initial Server Sent Event(SSE)
    var eventSource = new EventSource(serverURL+"/listen");
    eventSource.addEventListener("message", function(e) {
        var info = JSON.parse(e.data);
        console.log(info.position);
      }, false);

    // Process al subsequent SSE
    eventSource.addEventListener("online", function(e) {
        // Extract the data sent from the server
        info = JSON.parse(e.data);
        position = info.position;
        p_id = info.id;
        console.log(position +" "+p_id);

        // Change the HTML to reflect the change in the sensor reading
        var searchID = p_id + ":";
        var span2 = document.getElementById(searchID);
        span2.innerHTML = position;
        console.log(position);
        
    }, true);
} 