// Simple localStorage-based authentication with optional Airtable user lookup
const AIRTABLE_API_KEY = "YOUR_AIRTABLE_API_KEY";
const AIRTABLE_BASE_ID = "YOUR_AIRTABLE_BASE_ID";
const AIRTABLE_USERS_TABLE_NAME = "Users";

async function fetchAirtableUser(email, password) {
  try {
    const formula = `AND({Email}="${email}", {Password}="${password}")`;
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_USERS_TABLE_NAME}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`
      }
    });
    const data = await response.json();
    if (data.records && data.records.length > 0) {
      const fields = data.records[0].fields;
      return {
        name: fields.Name || fields.name || fields.FullName || "",
        email: fields.Email || email,
        phone: fields.Phone || fields.phone || "",
        vehicleModel: fields.VehicleModel || fields.vehicleModel || "",
        vehicleNumber: fields.VehicleNumber || fields.vehicleNumber || "",
        password: password
      };
    }
  } catch (error) {
    console.error("Airtable user lookup failed:", error);
  }
  return null;
}

window.register = function() {
  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const phone = document.getElementById("registerPhone").value.trim();
  const vehicleModel = document.getElementById("registerVehicleModel").value.trim();
  const vehicleNumber = document.getElementById("registerVehicleNumber").value.trim();
  const password = document.getElementById("registerPassword").value;

  if (!name || !email || !phone || !vehicleModel || !vehicleNumber || !password) {
    alert("Please fill in all registration fields.");
    return;
  }

  // Check if user already exists
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  if (users.find(user => user.email === email)) {
    alert("User already exists.");
    return;
  }

  // Store user data
  users.push({ name, email, phone, vehicleModel, vehicleNumber, password });
  localStorage.setItem("users", JSON.stringify(users));

  alert("Registration Successful");
  window.location.href = "login.html";
}

window.login = async function() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const users = JSON.parse(localStorage.getItem("users") || "[]");
  let user = users.find(user => user.email === email && user.password === password);

  if (!user) {
    user = await fetchAirtableUser(email, password);
  }

  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    alert("Login Successful");
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid email or password.");
  }
}

window.logout = function() {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

window.loadProfile = function() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("profileName").value = currentUser.name || "";
  document.getElementById("profileEmail").value = currentUser.email || "";
  document.getElementById("profilePhone").value = currentUser.phone || "";
  document.getElementById("profileVehicleModel").value = currentUser.vehicleModel || "";
  document.getElementById("profileVehicleNumber").value = currentUser.vehicleNumber || "";
}

window.updateProfile = function() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (!currentUser) {
    alert("Please log in first.");
    window.location.href = "login.html";
    return;
  }

  const name = document.getElementById("profileName").value.trim();
  const phone = document.getElementById("profilePhone").value.trim();
  const vehicleModel = document.getElementById("profileVehicleModel").value.trim();
  const vehicleNumber = document.getElementById("profileVehicleNumber").value.trim();

  if (!name || !phone || !vehicleModel || !vehicleNumber) {
    alert("Please fill in all fields.");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const updatedUsers = users.map(user => {
    if (user.email === currentUser.email) {
      return {
        ...user,
        name,
        phone,
        vehicleModel,
        vehicleNumber
      };
    }
    return user;
  });

  const updatedCurrentUser = {
    ...currentUser,
    name,
    phone,
    vehicleModel,
    vehicleNumber
  };

  localStorage.setItem("users", JSON.stringify(updatedUsers));
  localStorage.setItem("currentUser", JSON.stringify(updatedCurrentUser));

  alert("Profile updated successfully.");
}
