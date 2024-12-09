document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const loginSection = document.getElementById("login-section");
    const adminDashboard = document.getElementById("admin-dashboard");
    const userDashboard = document.getElementById("user-dashboard");
    const loginForm = document.getElementById("login-form");
    const loginMessage = document.getElementById("login-message");
    const viewPatientsBtn = document.getElementById("view-patients-btn");
    const addPatientBtn = document.getElementById("add-patient-btn");
    const assignBtn = document.getElementById("assign-btn");
    const patientsList = document.getElementById("patients-list");
    const addPatientForm = document.getElementById("add-patient-form");
    const assignForm = document.getElementById("assign-form");
    const submitPatientBtn = document.getElementById("submit-patient-btn");
    const assignSubmitBtn = document.getElementById("assign-submit-btn");
    const viewWaitTimeBtn = document.getElementById("view-wait-time-btn");
    const waitTimeDiv = document.getElementById("wait-time");

    // Utility function to show/hide sections
    function toggleVisibility(element, show) {
        if (show) {
            element.classList.remove("hidden");
        } else {
            element.classList.add("hidden");
        }
    }

    // Handle Login
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const code = document.getElementById("code").value.trim();

        if (!name || !code) {
            loginMessage.textContent = "Please enter both name and code.";
            loginMessage.style.color = "red";
            return;
        }

        // Simulated login logic
        if (name.toLowerCase() === "admin") {
            toggleVisibility(loginSection, false);
            toggleVisibility(adminDashboard, true);
            loginMessage.textContent = `Welcome, Admin!`;
            loginMessage.style.color = "green";
        } else {
            toggleVisibility(loginSection, false);
            toggleVisibility(userDashboard, true);
            loginMessage.textContent = `Welcome, ${name}!`;
            loginMessage.style.color = "green";
        }
    });

    // View All Patients
    viewPatientsBtn.addEventListener("click", () => {
        fetch("http://localhost:3000/admin/patients")
            .then((response) => {
                if (!response.ok) throw new Error("Failed to fetch patients");
                return response.json();
            })
            .then((data) => {
                if (data.length === 0) {
                    patientsList.innerHTML = "<p>No patients found.</p>";
                } else {
                    patientsList.innerHTML = `<h3>All Patients</h3><ul>${data
                        .map(
                            (patient) =>
                                `<li>ID: ${patient.patient_id} - ${patient.name} (${patient.gender}) - Priority: ${patient.priority_id}</li>`
                        )
                        .join("")}</ul>`;
                }
                toggleVisibility(patientsList, true);
            })
            .catch((error) => {
                console.error("Failed to fetch patients:", error);
                alert("Failed to fetch patients. Please try again.");
            });
    });

    // Add New Patient
    addPatientBtn.addEventListener("click", () => {
        toggleVisibility(addPatientForm, true);
        toggleVisibility(assignForm, false);
    });

    submitPatientBtn.addEventListener("click", () => {
        const name = document.getElementById("patient-name").value.trim();
        const gender = document.getElementById("patient-gender").value.trim();
        const date_of_birth = document.getElementById("patient-dob").value;
        const contact = document.getElementById("patient-contact").value.trim();
        const priority_id = parseInt(document.getElementById("patient-priority").value);

        if (!name || !gender || !date_of_birth || !contact || isNaN(priority_id)) {
            alert("Please fill out all fields correctly.");
            return;
        }

        fetch("http://localhost:3000/admin/patients", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, gender, date_of_birth, contact, priority_id }),
        })
            .then((response) => {
                if (!response.ok) throw new Error("Failed to add patient");
                return response.text();
            })
            .then((message) => {
                alert(message);
                addPatientForm.reset();
                toggleVisibility(addPatientForm, false);
            })
            .catch((error) => {
                console.error(error);
                alert("Failed to add patient. Please try again.");
            });
    });

    // Assign Room & Doctor
    assignBtn.addEventListener("click", () => {
        toggleVisibility(assignForm, true);
        toggleVisibility(addPatientForm, false);
    });

    assignSubmitBtn.addEventListener("click", () => {
        const patient_id = parseInt(document.getElementById("assign-patient-id").value);
        const doctor_id = parseInt(document.getElementById("assign-doctor-id").value);
        const room_id = parseInt(document.getElementById("assign-room-id").value);

        if (isNaN(patient_id) || isNaN(doctor_id) || isNaN(room_id)) {
            alert("Please fill out all fields.");
            return;
        }

        fetch("http://localhost:3000/admin/patients/assign", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ patient_id, doctor_id, room_id }),
        })
            .then((response) => {
                if (!response.ok) throw new Error("Failed to assign room and doctor");
                return response.text();
            })
            .then((message) => {
                alert(message);
                assignForm.reset();
                toggleVisibility(assignForm, false);
            })
            .catch((error) => {
                console.error(error);
                alert("Failed to assign room and doctor. Please try again.");
            });
    });

    // View Wait Time
    viewWaitTimeBtn.addEventListener("click", () => {
        const userId = prompt("Enter your Patient ID:");
        if (!userId) return;

        fetch(`http://localhost:3000/user/wait-time?userId=${userId}`)
            .then((response) => {
                if (!response.ok) throw new Error("Failed to fetch wait time");
                return response.json();
            })
            .then((data) => {
                waitTimeDiv.innerHTML = `<p>Your estimated wait time is ${data.waitTime} minutes. You are at position ${data.queuePosition} in the queue.</p>`;
            })
            .catch((error) => {
                console.error(error);
                alert("Failed to fetch wait time. Please try again.");
            });
    });
});
