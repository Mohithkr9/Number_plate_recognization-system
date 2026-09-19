// ======================================================
// SMART PARKING - AUTHENTICATION
// ======================================================

// IMPORTANT:
// Replace ONLY the PAT below.
// Do NOT share your PAT publicly.

const AIRTABLE_API_KEY = "patonNHFlI2tk3iRS.c1d7c5f15942e5717c1d3fd3d7c13213c4a762e4dd57dd655e44cba3130581bb";

const AIRTABLE_BASE_ID = "appWhAZEQegXTWIjR";

const AIRTABLE_USERS_TABLE_NAME = "Users";


// ======================================================
// FETCH USER FROM AIRTABLE
// ======================================================

async function fetchAirtableUser(email, password) {

    try {

        const formula =
            `AND({Email}="${email}", {Password}="${password}")`;

        const url =
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_USERS_TABLE_NAME)}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;

        const response =
            await fetch(
                url,
                {
                    headers: {
                        Authorization:
                            `Bearer ${AIRTABLE_API_KEY}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Airtable error:",
                data
            );

            return null;
        }


        if (
            data.records &&
            data.records.length > 0
        ) {

            const fields =
                data.records[0].fields || {};


            return {

                name:
                    fields.Name ||
                    fields.name ||
                    fields.FullName ||
                    "",

                email:
                    fields.Email ||
                    email,

                phone:
                    fields.Phone ||
                    fields.phone ||
                    "",

                vehicleModel:
                    fields.VehicleModel ||
                    fields.vehicleModel ||
                    "",

                vehicleNumber:
                    fields.VehicleNumber ||
                    fields.vehicleNumber ||
                    "",

                // IMPORTANT:
                // This decides whether the user
                // is an admin or normal user.

                role:
                    String(
                        fields.Role ||
                        fields.role ||
                        "user"
                    )
                    .toLowerCase()
                    .trim(),

                password:
                    password
            };
        }

    } catch (error) {

        console.error(
            "Airtable user lookup failed:",
            error
        );
    }


    return null;
}


// ======================================================
// REGISTER
// ======================================================

window.register = function () {

    const name =
        document
            .getElementById("registerName")
            .value
            .trim();


    const email =
        document
            .getElementById("registerEmail")
            .value
            .trim();


    const phone =
        document
            .getElementById("registerPhone")
            .value
            .trim();


    const vehicleModel =
        document
            .getElementById("registerVehicleModel")
            .value
            .trim();


    const vehicleNumber =
        document
            .getElementById("registerVehicleNumber")
            .value
            .trim();


    const password =
        document
            .getElementById("registerPassword")
            .value;


    // Check empty fields

    if (
        !name ||
        !email ||
        !phone ||
        !vehicleModel ||
        !vehicleNumber ||
        !password
    ) {

        alert(
            "Please fill in all registration fields."
        );

        return;
    }


    // Get existing local users

    const users =
        JSON.parse(
            localStorage.getItem("users") ||
            "[]"
        );


    // Check duplicate email

    if (
        users.find(
            user =>
                user.email.toLowerCase() ===
                email.toLowerCase()
        )
    ) {

        alert(
            "User already exists."
        );

        return;
    }


    // Normal registrations are always USER.

    const newUser = {

        name:
            name,

        email:
            email,

        phone:
            phone,

        vehicleModel:
            vehicleModel,

        vehicleNumber:
            vehicleNumber,

        password:
            password,

        role:
            "user"
    };


    users.push(newUser);


    localStorage.setItem(
        "users",
        JSON.stringify(users)
    );


    alert(
        "Registration Successful"
    );


    window.location.href =
        "login.html";
};


// ======================================================
// LOGIN
// ======================================================

window.login = async function () {

    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim();


    const password =
        document
            .getElementById("loginPassword")
            .value;


    if (!email || !password) {

        alert(
            "Please enter email and password."
        );

        return;
    }


    // ==================================================
    // FIRST CHECK LOCAL STORAGE
    // ==================================================

    const users =
        JSON.parse(
            localStorage.getItem("users") ||
            "[]"
        );


    let user =
        users.find(
            user =>
                user.email.toLowerCase() ===
                    email.toLowerCase() &&
                user.password === password
        );


    // ==================================================
    // IF NOT FOUND, CHECK AIRTABLE
    // ==================================================

    if (!user) {

        user =
            await fetchAirtableUser(
                email,
                password
            );
    }


    // ==================================================
    // LOGIN SUCCESS
    // ==================================================

    if (user) {

        // Make sure role is always normalized.

        user.role =
            String(
                user.role ||
                "user"
            )
            .toLowerCase()
            .trim();


        // Save logged-in user.

        localStorage.setItem(
            "currentUser",
            JSON.stringify(user)
        );


        alert(
            "Login Successful"
        );


        // ==================================================
        // ADMIN LOGIN
        // ==================================================

        if (
            user.role === "admin"
        ) {

            window.location.href =
                "admin.html";

            return;
        }


        // ==================================================
        // NORMAL USER LOGIN
        // ==================================================

        window.location.href =
            "dashboard.html";

    } else {

        alert(
            "Invalid email or password."
        );
    }
};


// ======================================================
// LOGOUT
// ======================================================

window.logout = function () {

    localStorage.removeItem(
        "currentUser"
    );


    window.location.href =
        "index.html";
};


// ======================================================
// LOAD PROFILE
// ======================================================

window.loadProfile = function () {

    const currentUser =
        JSON.parse(
            localStorage.getItem(
                "currentUser"
            ) || "null"
        );


    if (!currentUser) {

        window.location.href =
            "login.html";

        return;
    }


    const profileName =
        document.getElementById(
            "profileName"
        );


    const profileEmail =
        document.getElementById(
            "profileEmail"
        );


    const profilePhone =
        document.getElementById(
            "profilePhone"
        );


    const profileVehicleModel =
        document.getElementById(
            "profileVehicleModel"
        );


    const profileVehicleNumber =
        document.getElementById(
            "profileVehicleNumber"
        );


    if (profileName) {

        profileName.value =
            currentUser.name || "";
    }


    if (profileEmail) {

        profileEmail.value =
            currentUser.email || "";
    }


    if (profilePhone) {

        profilePhone.value =
            currentUser.phone || "";
    }


    if (profileVehicleModel) {

        profileVehicleModel.value =
            currentUser.vehicleModel || "";
    }


    if (profileVehicleNumber) {

        profileVehicleNumber.value =
            currentUser.vehicleNumber || "";
    }
};


// ======================================================
// UPDATE PROFILE
// ======================================================

window.updateProfile = function () {

    const currentUser =
        JSON.parse(
            localStorage.getItem(
                "currentUser"
            ) || "null"
        );


    if (!currentUser) {

        alert(
            "Please log in first."
        );

        window.location.href =
            "login.html";

        return;
    }


    const name =
        document
            .getElementById("profileName")
            .value
            .trim();


    const phone =
        document
            .getElementById("profilePhone")
            .value
            .trim();


    const vehicleModel =
        document
            .getElementById("profileVehicleModel")
            .value
            .trim();


    const vehicleNumber =
        document
            .getElementById("profileVehicleNumber")
            .value
            .trim();


    if (
        !name ||
        !phone ||
        !vehicleModel ||
        !vehicleNumber
    ) {

        alert(
            "Please fill in all fields."
        );

        return;
    }


    // Get local users

    const users =
        JSON.parse(
            localStorage.getItem("users") ||
            "[]"
        );


    // Update matching user

    const updatedUsers =
        users.map(
            user => {

                if (
                    user.email.toLowerCase() ===
                    currentUser.email.toLowerCase()
                ) {

                    return {

                        ...user,

                        name:
                            name,

                        phone:
                            phone,

                        vehicleModel:
                            vehicleModel,

                        vehicleNumber:
                            vehicleNumber
                    };
                }


                return user;
            }
        );


    // Keep the existing role.

    const updatedCurrentUser = {

        ...currentUser,

        name:
            name,

        phone:
            phone,

        vehicleModel:
            vehicleModel,

        vehicleNumber:
            vehicleNumber,

        role:
            currentUser.role || "user"
    };


    localStorage.setItem(
        "users",
        JSON.stringify(updatedUsers)
    );


    localStorage.setItem(
        "currentUser",
        JSON.stringify(updatedCurrentUser)
    );


    alert(
        "Profile updated successfully."
    );
};