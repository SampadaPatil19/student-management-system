let accessToken = "";
let refreshToken = "";

async function refreshAccessToken() {
    if (!refreshToken) return false;

    const response = await fetch("http://127.0.0.1:8000/jwt-auth/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken })
    });

    if (response.ok) {
        const data = await response.json();
        accessToken = data.access;
        return true;
    } else {
        alert("⚠️ Session expired. Please login again.");
        accessToken = "";
        refreshToken = "";
        return false;
    }
}


// ====================== API Helper ======================
async function apiRequest(endpoint, method = "GET", body = null, requiresAuth = false) {
    const headers = { "Content-Type": "application/json" };
    if (requiresAuth && accessToken) {
        headers["Authorization"] = "Bearer " + accessToken;
    }

    let response = await fetch(`http://127.0.0.1:8000/jwt-auth/${endpoint}/`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });

    // If unauthorized, try refresh once
    if (response.status === 401 && requiresAuth && refreshToken) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            headers["Authorization"] = "Bearer " + accessToken;
            response = await fetch(`http://127.0.0.1:8000/jwt-auth/${endpoint}/`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
            });
        }
    }

    let data;
    try {
        data = await response.json();
    } catch {
        data = {};
    }
    return { ok: response.ok, data };
}


// ====================== UI Helpers ======================
function setStatus(elementId, message, isSuccess = true) {
    const el = document.getElementById(elementId);
    el.innerText = message;
    el.style.color = isSuccess ? "green" : "red";
}

function clearForm(formId) {
    document.getElementById(formId).reset();
}

// ====================== Auth Functions ======================

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const { ok, data } = await apiRequest("token", "POST", { username, password });

    if (ok && data.access && data.refresh) {
        accessToken = data.access;
        refreshToken = data.refresh;
        setStatus("loginStatus", "✅ Login successful!", true);
    } else {
        setStatus("loginStatus", "❌ Login failed!", false);
    }
}


// ====================== Student Functions ======================
async function addStudent(e) {
    e.preventDefault();

    if (!accessToken) {
        alert("Please login first!");
        return;
    }

    const student = {
        name: document.getElementById("name").value,
        age: parseInt(document.getElementById("age").value),
        roll: document.getElementById("roll").value,
        city: document.getElementById("city").value,
        email: document.getElementById("email").value,
        course: document.getElementById("course").value
    };

    const { ok, data } = await apiRequest("student", "POST", student, true);

    if (ok) {
        setStatus("studentStatus", "✅ Student added!", true);
        clearForm("studentForm");
        getStudents();
    } else {
        setStatus("studentStatus", "❌ Error: " + JSON.stringify(data), false);
    }
}

async function getStudents() {
    if (!accessToken) {
        alert("Please login first!");
        return;
    }

    const { ok, data } = await apiRequest("student", "GET", null, true);
    const list = document.getElementById("studentList");
    list.innerHTML = "";

    if (ok) {
        // Handle paginated or plain array
        const students = data.results ? data.results : data;

        students.forEach(student => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${student.name}</td>
                <td>${student.age}</td>
                <td>${student.roll}</td>
                <td>${student.city}</td>
                <td>${student.email}</td>
                <td>${student.course}</td>
                <td>
                    <button onclick="editStudent(${student.id}, {
                        name: '${student.name}',
                        age: ${student.age},
                        roll: '${student.roll}',
                        city: '${student.city}',
                        email: '${student.email}',
                        course: '${student.course}'
                    })">Edit</button>
                    <button onclick="deleteStudent(${student.id})">Delete</button>
                </td>
            `;
            list.appendChild(row);
        });
    }
}


function showEditForm(id, name, age, roll, city, email, course) {
    const newName = prompt("Edit Name:", name);
    const newAge = prompt("Edit Age:", age);
    const newRoll = prompt("Edit Roll:", roll);
    const newCity = prompt("Edit City:", city);
    const newEmail = prompt("Edit Email:", email);
    const newCourse = prompt("Edit Course:", course);

    if (newName && newAge && newRoll && newCity) {
        editStudent(id, {
            name: newName,
            age: parseInt(newAge),
            roll: newRoll,
            city: newCity,
            email: newEmail,
            course: newCourse
        });
    }
}

// ====================== Update Student ======================
async function editStudent(studentId, updatedData) {
    if (!accessToken) {
        alert("Please login first!");
        return;
    }

    const { ok, data } = await apiRequest(`student/${studentId}`, "PUT", updatedData, true);

    if (ok) {
        alert("✅ Student updated successfully!");
        getStudents(); // refresh list
    } else {
        alert("❌ Error updating student: " + JSON.stringify(data));
    }
}



// ====================== Delete Student ======================
async function deleteStudent(studentId) {
    if (!accessToken) {
        alert("Please login first!");
        return;
    }

    const { ok, data } = await apiRequest(`student/${studentId}`, "DELETE", null, true);

    if (ok) {
        alert("🗑️ Student deleted successfully!");
        getStudents(); // refresh list
    } else {
        alert("❌ Error deleting student: " + JSON.stringify(data));
    }
}


// ====================== Event Listeners ======================
document.getElementById("loginForm").addEventListener("submit", handleLogin);
document.getElementById("studentForm").addEventListener("submit", addStudent);
