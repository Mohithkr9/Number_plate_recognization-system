



// ============================================================
// SMART PARKING SYSTEM - SCRIPT.JS
// ============================================================

// ============================================================
// AIRTABLE CONFIGURATION
// ============================================================

const AIRTABLE_API_KEY = "patonNHFlI2tk3iRS.c1d7c5f15942e5717c1d3fd3d7c13213c4a762e4dd57dd655e44cba3130581bb";

const AIRTABLE_BASE_ID = "appWhAZEQegXTWIjR";

const AIRTABLE_LOCATIONS_TABLE = "tblIPvP8uLqzwoIUC";
const AIRTABLE_SLOTS_TABLE = "ParkingSlots";


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let parkingMap = null;

let locationMarkers = [];
let slotMarkers = [];

let userLocation = null;

let allLocations = [];
let allSlots = [];

let selectedLocationId = null;

let parkingData = {};

let refreshTimer = null;

let refreshInProgress = false;


// ============================================================
// HELPER
// AIRTABLE LINKED LOCATION ID
// ============================================================

function getLinkedLocationIds(value) {

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
        return [value];
    }

    return [];
}


// ============================================================
// FETCH LOCATIONS
// ============================================================

async function fetchLocations() {

    try {

        const response = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_LOCATIONS_TABLE}`,
            {
                method: "GET",

                headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );

        const data = await response.json();

        console.log(
            "Locations data from Airtable:",
            data
        );

        if (!response.ok) {

            console.error(
                "Airtable location error:",
                data
            );

            return [];
        }

        allLocations = data.records.map(record => {

            const fields = record.fields;

            return {

                id: record.id,

                name:
                    fields.name || "",

                address:
                    fields.address || "",

                latitude:
                    Number(fields.latitude),

                longitude:
                    Number(fields.longitude),

                totalSlots:
                    Number(fields.totalSlots || 0),

                city:
                    fields.city || "",

                phone:
                    fields.phone || "",

                ratePerHour:
                    fields.ratePerHour || "",

                openTime:
                    fields.openTime || "",

                closeTime:
                    fields.closeTime || ""

            };

        });

        console.log(
            "Processed locations:",
            allLocations
        );

        populateLocationDropdown();

        initializeParkingMap();

        return allLocations;

    } catch (error) {

        console.error(
            "Error fetching locations:",
            error
        );

        return [];

    }

}


// ============================================================
// LOCATION DROPDOWN
// ============================================================

function populateLocationDropdown() {

    const dropdown =
        document.getElementById(
            "locationDropdown"
        );

    if (!dropdown) {
        return;
    }

    dropdown.innerHTML =
        '<option value="">Select a location...</option>';

    allLocations.forEach(location => {

        const option =
            document.createElement("option");

        option.value =
            location.id;

        option.textContent =
            `${location.name} (${location.totalSlots} slots)`;

        dropdown.appendChild(
            option
        );

    });

}


// ============================================================
// CHANGE LOCATION
// ============================================================

async function changeLocation() {

    const dropdown =
        document.getElementById(
            "locationDropdown"
        );

    if (!dropdown) {
        return;
    }

    const locationId =
        dropdown.value;

    selectedLocationId =
        locationId;

    if (!locationId) {

        const slotContainer =
            document.getElementById(
                "slotContainer"
            );

        if (slotContainer) {

            slotContainer.innerHTML =
                '<p class="center">Select a location to view available slots.</p>';

        }

        const locationDetails =
            document.getElementById(
                "locationDetails"
            );

        if (locationDetails) {

            locationDetails.style.display =
                "none";

        }

        return;
    }

    const location =
        allLocations.find(
            loc =>
                loc.id === locationId
        );

    if (location) {

        const addressElement =
            document.getElementById(
                "locationAddress"
            );

        const rateElement =
            document.getElementById(
                "locationRate"
            );

        const hoursElement =
            document.getElementById(
                "locationHours"
            );

        const detailsElement =
            document.getElementById(
                "locationDetails"
            );

        if (addressElement) {

            addressElement.textContent =
                location.address || "";

        }

        if (rateElement) {

            rateElement.textContent =
                location.ratePerHour || "";

        }

        if (hoursElement) {

            hoursElement.textContent =
                `${location.openTime || ""} - ${location.closeTime || ""}`;

        }

        if (detailsElement) {

            detailsElement.style.display =
                "block";

        }

    }


    // Fetch slots

    await fetchSlotsForLocation(
        locationId
    );


    // Display slots

    displayLocationSlots(
        locationId
    );


    // Update map

    updateMapForLocation(
        locationId
    );

}


// ============================================================
// FETCH PARKING SLOTS
// ============================================================

async function fetchSlotsForLocation(
    locationId
) {

    try {

        const response =
            await fetch(
                `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_SLOTS_TABLE}`,
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

        console.log(
            "ParkingSlots data from Airtable:",
            data
        );

        if (!response.ok) {

            console.error(
                "Airtable ParkingSlots error:",
                data
            );

            return [];

        }

        const location =
            allLocations.find(
                loc =>
                    loc.id === locationId
            );

        if (!location) {

            console.error(
                "Location not found:",
                locationId
            );

            return [];

        }


        // ====================================================
        // FIND SLOTS FOR SELECTED LOCATION
        // ====================================================

        const locationSlots =
            data.records

                .filter(record => {

                    const fields =
                        record.fields;

                    const linkedLocationIds =
                        getLinkedLocationIds(
                            fields.locationId
                        );


                    // Linked record ID

                    if (
                        linkedLocationIds.includes(
                            locationId
                        )
                    ) {

                        return true;

                    }


                    // Text ID

                    if (
                        fields.locationId ===
                        locationId
                    ) {

                        return true;

                    }


                    // Location name

                    if (
                        fields.locationId ===
                        location.name
                    ) {

                        return true;

                    }

                    return false;

                })


                .map(record => {

                    const fields =
                        record.fields;

                    return {

                        id:
                            record.id,

                        locationId:
                            locationId,

                        slotNumber:
                            Number(
                                fields.slotNumber
                            ),

                        statusCode:
                            Number(
                                fields.statusCode
                            ),

                        status:
                            String(
                                fields.status || ""
                            ).toUpperCase(),

                        sensorId:
                            fields.sensorId || "",

                        vehicleNumber:
                            fields.vehicleNumber || ""

                    };

                });


        // ====================================================
        // UPDATE LOCAL DATA
        // ====================================================

        allSlots =
            allSlots.filter(
                slot =>
                    slot.locationId !==
                    locationId
            );

        allSlots.push(
            ...locationSlots
        );


        console.log(
            `Location: ${location.name}`
        );

        console.log(
            `Found ${locationSlots.length} slot records`
        );

        return locationSlots;


    } catch (error) {

        console.error(
            "Error fetching slots:",
            error
        );

        return [];

    }

}


// ============================================================
// DISPLAY SLOTS
// ============================================================

function displayLocationSlots(
    locationId
) {

    const location =
        allLocations.find(
            loc =>
                loc.id === locationId
        );

    const slotContainer =
        document.getElementById(
            "slotContainer"
        );

    if (!slotContainer) {
        return;
    }

    if (!location) {

        slotContainer.innerHTML =
            '<p class="center">Location not found.</p>';

        return;
    }


    // ========================================================
    // GET SELECTED LOCATION SLOTS
    // ========================================================

    const locationSlots =
        allSlots.filter(
            slot =>
                slot.locationId ===
                locationId
        );


    console.log(
        `Displaying ${locationSlots.length} slots for ${location.name}`
    );


    slotContainer.innerHTML =
        "";


    if (
        locationSlots.length === 0
    ) {

        slotContainer.innerHTML =
            '<p class="center">No slot records found for this location yet.</p>';

        const nearest =
            document.getElementById(
                "nearestSlot"
            );

        if (nearest) {

            nearest.textContent =
                "No available slot";

        }

        return;
    }


    let nearestAvailableSlot =
        null;


    // ========================================================
    // DISPLAY S1-S4
    // ========================================================

    for (
        let i = 1;
        i <= location.totalSlots;
        i++
    ) {

        const slot =
            locationSlots.find(
                s =>
                    s.slotNumber === i
            );


        let status =
            "Unknown";

        let statusClass =
            "unknown";

        let sensorId =
            `S${i}`;

        let vehicleNumber =
            "";


        if (slot) {

            // IMPORTANT:
            // Check BOTH status and statusCode

            status =
                getStatusLabel(
                    slot.statusCode,
                    slot.status
                );


            statusClass =
                getStatusClass(
                    slot.statusCode,
                    slot.status
                );


            if (slot.sensorId) {

                sensorId =
                    slot.sensorId;

            }


            if (slot.vehicleNumber) {

                vehicleNumber =
                    slot.vehicleNumber;

            }


            // Available slot

            if (

                isSlotAvailable(slot) &&

                nearestAvailableSlot === null

            ) {

                nearestAvailableSlot =
                    i;

            }

        }


        // ====================================================
        // CREATE SLOT DIV
        // ====================================================

        const slotDiv =
            document.createElement(
                "div"
            );


        slotDiv.className =
            `slot ${statusClass}`;


        slotDiv.id =
            `slot-${locationId}-${i}`;


        // ====================================================
        // VEHICLE NUMBER
        // ====================================================
let vehicleHTML = "";

const occupied = statusClass === "occupied";

if (occupied && vehicleNumber.trim() !== "") {
    vehicleHTML = `
        <p class="vehicle-number">
            🚗 Vehicle Number:
            <strong>${vehicleNumber}</strong>
        </p>
    `;
}

        // ====================================================
        // SLOT HTML
        // ====================================================

        slotDiv.innerHTML = `

            <h3>${sensorId}</h3>

            <p>
                Status:
                <span class="status">
                    ${status}
                </span>
            </p>

            ${vehicleHTML}

            <button
                onclick="reserveSlot('${locationId}', ${i})">
                Reserve
            </button>

            <button
                onclick="cancelSlot('${locationId}', ${i})">
                Cancel
            </button>

        `;


        slotContainer.appendChild(
            slotDiv
        );

    }


    // ========================================================
    // UPDATE NEAREST AVAILABLE SLOT
    // ========================================================

    const nearestSlotElement =
        document.getElementById(
            "nearestSlot"
        );


    if (nearestSlotElement) {

        if (
            nearestAvailableSlot !== null
        ) {

            nearestSlotElement.textContent =
                `S${nearestAvailableSlot}`;

        } else {

            nearestSlotElement.textContent =
                "No available slot";

        }

    }

}


// ============================================================
// CHECK SLOT AVAILABLE
// ============================================================

function isSlotAvailable(slot) {

    const status =
        String(
            slot.status || ""
        ).toUpperCase();


    const statusCode =
        Number(
            slot.statusCode
        );


    // Status text has priority

    if (status === "AVAILABLE") {
        return true;
    }

    if (status === "OCCUPIED") {
        return false;
    }

    if (status === "RESERVED") {
        return false;
    }


    // Fallback to statusCode

    return statusCode === 1;

}


// ============================================================
// STATUS LABEL
// ============================================================

function getStatusLabel(
    statusCode,
    status
) {

    const cleanStatus =
        String(
            status || ""
        ).toUpperCase();


    // IMPORTANT:
    // Airtable status text first

    if (
        cleanStatus ===
        "OCCUPIED"
    ) {

        return "Occupied ✗";

    }


    if (
        cleanStatus ===
        "AVAILABLE"
    ) {

        return "Available ✓";

    }


    if (
        cleanStatus ===
        "RESERVED"
    ) {

        return "Reserved ⏱";

    }


    // Fallback

    switch (
        Number(statusCode)
    ) {

        case 1:
            return "Available ✓";

        case 0:
            return "Occupied ✗";

        case 2:
            return "Reserved ⏱";

        default:
            return "Unknown";

    }

}


// ============================================================
// STATUS CLASS
// ============================================================

function getStatusClass(
    statusCode,
    status
) {

    const cleanStatus =
        String(
            status || ""
        ).toUpperCase();


    // IMPORTANT:
    // Airtable status text first

    if (
        cleanStatus ===
        "OCCUPIED"
    ) {

        return "occupied";

    }


    if (
        cleanStatus ===
        "AVAILABLE"
    ) {

        return "available";

    }


    if (
        cleanStatus ===
        "RESERVED"
    ) {

        return "reserved";

    }


    // Fallback

    switch (
        Number(statusCode)
    ) {

        case 1:
            return "available";

        case 0:
            return "occupied";

        case 2:
            return "reserved";

        default:
            return "unknown";

    }

}


// ============================================================
// UPDATE PARKING SLOT
// ============================================================

async function updateParkingSlot(
    locationId,
    slotNumber,
    status
) {

    try {

        const slot =
            allSlots.find(
                s =>

                    s.locationId ===
                    locationId &&

                    s.slotNumber ===
                    slotNumber

            );


        if (!slot) {

            console.error(
                "Slot not found:",
                {
                    locationId,
                    slotNumber
                }
            );

            return false;

        }


        let statusText;


        if (status === 1) {

            statusText =
                "AVAILABLE";

        } else if (status === 0) {

            statusText =
                "OCCUPIED";

        } else {

            statusText =
                "RESERVED";

        }


        const fieldsToUpdate = {

            statusCode:
                status,

            status:
                statusText

        };


        // If slot becomes available,
        // remove old vehicle number

        if (status === 1) {

            fieldsToUpdate.vehicleNumber =
                "";

        }


        const response =
            await fetch(

                `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_SLOTS_TABLE}/${slot.id}`,

                {

                    method: "PATCH",

                    headers: {

                        Authorization:
                            `Bearer ${AIRTABLE_API_KEY}`,

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            fields:
                                fieldsToUpdate

                        })

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Error updating ParkingSlots:",
                data
            );

            return false;

        }


        // ====================================================
        // UPDATE LOCAL DATA
        // ====================================================

        slot.statusCode =
            status;

        slot.status =
            statusText;


        if (status === 1) {

            slot.vehicleNumber =
                "";

        }


        displayLocationSlots(
            locationId
        );


        return true;


    } catch (error) {

        console.error(
            "Error updating parking slot:",
            error
        );

        return false;

    }

}


// ============================================================
// RESERVE SLOT
// ============================================================

async function reserveSlot(
    locationId,
    slotNumber
) {

    const user =
        localStorage.getItem(
            "currentUser"
        );


    if (!user) {

        alert(
            "Please log in first"
        );

        return;

    }


    const success =
        await updateParkingSlot(
            locationId,
            slotNumber,
            2
        );


    if (!success) {

        alert(
            "Unable to reserve slot."
        );

        return;

    }


    alert(
        `Slot ${slotNumber} reserved successfully!`
    );


    // ========================================================
    // SAVE BOOKING HISTORY
    // ========================================================

    const historyData = {

        user:
            user,

        locationId:
            locationId,

        slotNumber:
            slotNumber,

        bookingDate:
            new Date()
                .toLocaleDateString(),

        bookingTime:
            new Date()
                .toLocaleTimeString(),

        status:
            "Active"

    };


    const history =
        JSON.parse(

            localStorage.getItem(
                "bookingHistory"
            ) || "[]"

        );


    history.push(
        historyData
    );


    localStorage.setItem(

        "bookingHistory",

        JSON.stringify(
            history
        )

    );

}


// ============================================================
// CANCEL SLOT
// ============================================================

async function cancelSlot(
    locationId,
    slotNumber
) {

    const success =
        await updateParkingSlot(
            locationId,
            slotNumber,
            1
        );


    if (success) {

        alert(
            `Slot ${slotNumber} cancelled!`
        );

    } else {

        alert(
            "Unable to cancel slot."
        );

    }

}


// ============================================================
// INITIALIZE MAP
// ============================================================

function initializeParkingMap() {

    if (
        typeof L === "undefined"
    ) {

        console.error(
            "Leaflet is not loaded."
        );

        return;

    }


    if (parkingMap) {

        parkingMap.remove();

    }


    locationMarkers = [];

    slotMarkers = [];


    const validLocations =
        allLocations.filter(

            location =>

                Number.isFinite(
                    location.latitude
                ) &&

                Number.isFinite(
                    location.longitude
                )

        );


    if (
        validLocations.length === 0
    ) {

        console.error(
            "No valid latitude/longitude found:",
            allLocations
        );

        return;

    }


    const centerLat =
        validLocations[0].latitude;

    const centerLng =
        validLocations[0].longitude;


    parkingMap =
        L.map(
            "parkingMap",
            {

                center: [

                    centerLat,

                    centerLng

                ],

                zoom: 13,

                zoomControl: true

            }
        );


    L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

        }

    ).addTo(
        parkingMap
    );


    // ========================================================
    // LOCATION MARKERS
    // ========================================================

    validLocations.forEach(
        location => {

            const marker =
                L.marker(

                    [

                        location.latitude,

                        location.longitude

                    ],

                    {

                        title:
                            location.name

                    }

                ).addTo(
                    parkingMap
                );


            marker.bindPopup(`

                <strong>
                    ${location.name}
                </strong>

                <br>

                ${location.address || ""}

                <br>

                <small>
                    Rate: ₹${location.ratePerHour || 0}/hr
                </small>

                <br>

                <button

                    onclick="changeLocationFromMap('${location.id}')"

                    style="
                        width:100%;
                        padding:5px;
                        margin-top:5px;
                    "

                >

                    View Slots

                </button>

            `);


            locationMarkers.push({

                location:
                    location,

                marker:
                    marker

            });

        }
    );


    // ========================================================
    // USER LOCATION
    // ========================================================

    if (
        navigator.geolocation
    ) {

        navigator.geolocation.getCurrentPosition(

            position => {

                userLocation = [

                    position.coords.latitude,

                    position.coords.longitude

                ];


                L.marker(

                    userLocation,

                    {

                        title:
                            "Your location"

                    }

                )

                    .addTo(
                        parkingMap
                    )

                    .bindPopup(
                        "You are here"
                    );


                parkingMap.setView(

                    userLocation,

                    13

                );

            },


            error => {

                console.log(

                    "Geolocation unavailable:",

                    error.message

                );

            }

        );

    }

}


// ============================================================
// CHANGE LOCATION FROM MAP
// ============================================================

function changeLocationFromMap(
    locationId
) {

    const dropdown =
        document.getElementById(
            "locationDropdown"
        );


    if (!dropdown) {
        return;
    }


    dropdown.value =
        locationId;


    changeLocation();

}


// ============================================================
// UPDATE MAP FOR LOCATION
// ============================================================

function updateMapForLocation(
    locationId
) {

    if (!parkingMap) {
        return;
    }


    const location =
        allLocations.find(

            loc =>
                loc.id === locationId

        );


    if (

        location &&

        Number.isFinite(
            location.latitude
        ) &&

        Number.isFinite(
            location.longitude
        )

    ) {

        parkingMap.setView(

            [

                location.latitude,

                location.longitude

            ],

            15

        );

    }

}


// ============================================================
// SEARCH NEARBY PARKING
// ============================================================

async function searchNearbySlots() {

    if (!userLocation) {

        alert(
            "Please enable geolocation"
        );

        return;

    }


    let closestLocation =
        null;

    let minDistance =
        Infinity;


    allLocations.forEach(
        location => {

            if (

                !Number.isFinite(
                    location.latitude
                ) ||

                !Number.isFinite(
                    location.longitude
                )

            ) {

                return;

            }


            const distance =
                calculateDistance(

                    userLocation[0],

                    userLocation[1],

                    location.latitude,

                    location.longitude

                );


            if (
                distance <
                minDistance
            ) {

                minDistance =
                    distance;

                closestLocation =
                    location;

            }

        }
    );


    if (closestLocation) {

        document.getElementById(
            "locationDropdown"
        ).value =
            closestLocation.id;


        await changeLocation();


        alert(

            `Nearest location: ${closestLocation.name} (${minDistance.toFixed(2)} km away)`

        );

    }

}


// ============================================================
// CALCULATE DISTANCE
// ============================================================

function calculateDistance(

    lat1,
    lon1,
    lat2,
    lon2

) {

    const R =
        6371;


    const dLat =

        (lat2 - lat1) *

        Math.PI /

        180;


    const dLon =

        (lon2 - lon1) *

        Math.PI /

        180;


    const a =

        Math.sin(
            dLat / 2
        ) *

        Math.sin(
            dLat / 2
        ) +

        Math.cos(
            lat1 *
            Math.PI /
            180
        ) *

        Math.cos(
            lat2 *
            Math.PI /
            180
        ) *

        Math.sin(
            dLon / 2
        ) *

        Math.sin(
            dLon / 2
        );


    const c =

        2 *

        Math.atan2(

            Math.sqrt(a),

            Math.sqrt(
                1 - a
            )

        );


    return R * c;

}


// ============================================================
// AUTOMATIC SLOT REFRESH
// ============================================================

async function refreshSelectedLocationSlots() {

    if (!selectedLocationId) {
        return;
    }


    if (refreshInProgress) {
        return;
    }


    refreshInProgress =
        true;


    try {

        console.log(
            "Checking Airtable sensor status..."
        );


        await fetchSlotsForLocation(

            selectedLocationId

        );


        displayLocationSlots(

            selectedLocationId

        );


    } catch (error) {

        console.error(

            "Automatic refresh error:",

            error

        );

    } finally {

        refreshInProgress =
            false;

    }

}


// ============================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ============================================================

window.changeLocation =
    changeLocation;

window.searchNearbySlots =
    searchNearbySlots;

window.reserveSlot =
    reserveSlot;

window.cancelSlot =
    cancelSlot;

window.changeLocationFromMap =
    changeLocationFromMap;


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        console.log(
            "Smart Parking website started."
        );


        // Load locations

        await fetchLocations();


        // Check Airtable every 2 seconds

        refreshTimer =

            setInterval(

                refreshSelectedLocationSlots,

                2000

            );


        console.log(
            "Automatic sensor refresh: every 2 seconds"
        );

    }

);