// ======================================================
// SMART PARKING - AUTHENTICATION
// ======================================================

// IMPORTANT:
// Replace ONLY the PAT below.
// Do NOT share your PAT publicly.

const AIRTABLE_API_KEY = "patonNHFlI2tk3iRS.c1d7c5f15942e5717c1d3fd3d7c13213c4a762e4dd57dd655e44cba3130581bb";

const AIRTABLE_BASE_ID = "appWhAZEQegXTWIjR";

const AIRTABLE_USERS_TABLE_NAME = "Users";

const AIRTABLE_USERS_URL =
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_USERS_TABLE_NAME)}`;


// ======================================================
// FETCH USER FROM AIRTABLE
// ======================================================

async function fetchAirtableUser(email, password) {

    try {

        const formula =
            `AND({Email}="${email}", {Password}="${password}")`;

        const url =
            `${AIRTABLE_USERS_URL}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;

        const response =
            await fetch(
                url,
                {
                    method: "GET",
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
                "Airtable login error:",
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

                id:
                    data.records[0].id,

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
// CHECK WHETHER EMAIL ALREADY EXISTS IN AIRTABLE
// ======================================================

async function checkEmailExistsInAirtable(email) {

    try {

        const formula =
            `{Email}="${email}"`;

        const url =
            `${AIRTABLE_USERS_URL}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;

        const response =
            await fetch(
                url,
                {
                    method: "GET",
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
                "Airtable email check error:",
                data
            );

            return false;
        }

        return (
            data.records &&
            data.records.length > 0
        );

    } catch (error) {

        console.error(
            "Email check failed:",
            error
        );

        return false;
    }
}


// ======================================================
// CREATE USER IN AIRTABLE
// ======================================================

async function createAirtableUser(user) {

    try {

        const response =
            await fetch(
                AIRTABLE_USERS_URL,
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${AIRTABLE_API_KEY}`,

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        records: [
                            {
                                fields: {

                                    Name:
                                        user.name,

                                    Email:
                                        user.email,

                                    Password:
                                        user.password,

                                    Phone:
                                        user.phone,

                                    VehicleModel:
                                        user.vehicleModel,

                                    VehicleNumber:
                                        user.vehicleNumber,

                                    Role:
                                        "user"
                                }
                            }
                        ]
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            console.error(
                "Airtable registration error:",
                data
            );

            return null;
        }

        if (
            data.records &&
            data.records.length > 0
        ) {

            return data.records[0];
        }

    } catch (error) {

        console.error(
            "Airtable registration failed:",
            error
        );
    }

    return null;
}


// ======================================================
// REGISTER
// ======================================================

window.register = async function () {

    const nameElement =
        document.getElementById("registerName");

    const emailElement =
        document.getElementById("registerEmail");

    const phoneElement =
        document.getElementById("registerPhone");

    const vehicleModelElement =
        document.getElementById("registerVehicleModel");

    const vehicleNumberElement =
        document.getElementById("registerVehicleNumber");

    const passwordElement =
        document.getElementById("registerPassword");


    // ==================================================
    // CHECK ELEMENTS
    // ==================================================

    if (
        !nameElement ||
        !emailElement ||
        !phoneElement ||
        !vehicleModelElement ||
        !vehicleNumberElement ||
        !passwordElement
    ) {

        alert(
            "Registration form fields were not found."
        );

        console.error(
            "Registration form element missing."
        );

        return;
    }


    // ==================================================
    // GET VALUES
    // ==================================================

    const name =
        nameElement.value.trim();

    const email =
        emailElement.value.trim();

    const phone =
        phoneElement.value.trim();

    const vehicleModel =
        vehicleModelElement.value.trim();

    const vehicleNumber =
        vehicleNumberElement.value.trim();

    const password =
        passwordElement.value;


    // ==================================================
    // CHECK EMPTY FIELDS
    // ==================================================

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


    // ==================================================
    // BASIC EMAIL CHECK
    // ==================================================

    if (
        !email.includes("@") ||
        !email.includes(".")
    ) {

        alert(
            "Please enter a valid email address."
        );

        return;
    }


    // ==================================================
    // PREVENT DOUBLE CLICK
    // ==================================================

    const registerButton =
        document.querySelector(
            'button[type="submit"]'
        );

    if (registerButton) {

        registerButton.disabled = true;

        registerButton.dataset.originalText =
            registerButton.innerText;

        registerButton.innerText =
            "Registering...";
    }


    try {

        // ==================================================
        // CHECK AIRTABLE FOR EXISTING EMAIL
        // ==================================================

        const emailExists =
            await checkEmailExistsInAirtable(
                email
            );


        if (emailExists) {

            alert(
                "This email is already registered."
            );

            return;
        }


        // ==================================================
        // CREATE NEW USER OBJECT
        // ==================================================

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


        // ==================================================
        // SAVE USER TO AIRTABLE
        // ==================================================

        const airtableRecord =
            await createAirtableUser(
                newUser
            );


        // ==================================================
        // AIRTABLE SAVE FAILED
        // ==================================================

        if (!airtableRecord) {

            alert(
                "Registration failed. User could not be saved to Airtable."
            );

            return;
        }


        // ==================================================
        // SAVE USER LOCALLY TOO
        // ==================================================

        const users =
            JSON.parse(
                localStorage.getItem("users") ||
                "[]"
            );


        // Remove any old local copy with same email

        const filteredUsers =
            users.filter(
                user =>
                    String(user.email || "")
                        .toLowerCase()
                    !==
                    email.toLowerCase()
            );


        filteredUsers.push(
            newUser
        );


        localStorage.setItem(
            "users",
            JSON.stringify(filteredUsers)
        );


        // ==================================================
        // SUCCESS
        // ==================================================

        alert(
            "Registration Successful!\n\nYour account has been saved to Airtable."
        );


        // ==================================================
        // GO TO LOGIN
        // ==================================================

        window.location.href =
            "login.html";


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        alert(
            "Registration failed. Please check your Airtable configuration."
        );

    } finally {

        if (registerButton) {

            registerButton.disabled = false;

            registerButton.innerText =
                registerButton.dataset.originalText ||
                "Register";
        }
    }
};


// ======================================================
// LOGIN
// ======================================================

window.login = async function () {

    const emailElement =
        document.getElementById("loginEmail");

    const passwordElement =
        document.getElementById("loginPassword");


    if (!emailElement || !passwordElement) {

        alert(
            "Login form fields were not found."
        );

        return;
    }


    const email =
        emailElement.value.trim();

    const password =
        passwordElement.value;


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
            storedUser =>

                String(
                    storedUser.email || ""
                )
                .toLowerCase() ===
                email.toLowerCase()

                &&

                storedUser.password ===
                password
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

        // Normalize role

        user.role =
            String(
                user.role ||
                "user"
            )
            .toLowerCase()
            .trim();


        // Save logged-in user

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


    const profileNameElement =
        document.getElementById(
            "profileName"
        );

    const profilePhoneElement =
        document.getElementById(
            "profilePhone"
        );

    const profileVehicleModelElement =
        document.getElementById(
            "profileVehicleModel"
        );

    const profileVehicleNumberElement =
        document.getElementById(
            "profileVehicleNumber"
        );


    if (
        !profileNameElement ||
        !profilePhoneElement ||
        !profileVehicleModelElement ||
        !profileVehicleNumberElement
    ) {

        alert(
            "Profile fields were not found."
        );

        return;
    }


    const name =
        profileNameElement.value.trim();

    const phone =
        profilePhoneElement.value.trim();

    const vehicleModel =
        profileVehicleModelElement.value.trim();

    const vehicleNumber =
        profileVehicleNumberElement.value.trim();


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


    // ==================================================
    // UPDATE LOCAL USERS
    // ==================================================

    const users =
        JSON.parse(
            localStorage.getItem("users") ||
            "[]"
        );


    const updatedUsers =
        users.map(
            user => {

                if (
                    String(user.email || "")
                        .toLowerCase() ===
                    String(currentUser.email || "")
                        .toLowerCase()
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


    // ==================================================
    // UPDATE CURRENT USER
    // ==================================================

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
            currentUser.role ||
            "user"
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