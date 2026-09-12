// Airtable configuration
const AIRTABLE_API_KEY = "patMNicFfKP2sR70r.3a0b106a100117269b5a89fd3e62f97e76b2cb5dfe33ca6c0db8d0d9f89a8b48";
const AIRTABLE_BASE_ID = "appwnhPM7xLBH6rFr";

let parkingMap;
let locationMarkers = [];
let slotMarkers = [];
let userLocation = null;
let allLocations = [];
let allSlots = [];
let selectedLocationId = null;
let parkingData = {};

async function fetchLocations() {
  try {
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Locations`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`
      }
    });
    const data = await response.json();
    allLocations = data.records.map(record => ({
      id: record.id,
      ...record.fields
    }));
    
    populateLocationDropdown();
    initializeParkingMap();
    return allLocations;
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
}

function populateLocationDropdown() {
  const dropdown = document.getElementById("locationDropdown");
  dropdown.innerHTML = '<option value="">Select a location...</option>';
  
  allLocations.forEach(location => {
    const option = document.createElement("option");
    option.value = location.id;
    option.textContent = `${location.name} (${location.totalSlots} slots)`;
    dropdown.appendChild(option);
  });
}

async function changeLocation() {
  const locationId = document.getElementById("locationDropdown").value;
  selectedLocationId = locationId;
  
  if (!locationId) {
    document.getElementById("slotContainer").innerHTML = '<p class="center">Select a location to view available slots.</p>';
    document.getElementById("locationDetails").style.display = 'none';
    return;
  }
  
  // Find and display location details
  const location = allLocations.find(loc => loc.id === locationId);
  if (location) {
    document.getElementById("locationAddress").textContent = location.address;
    document.getElementById("locationRate").textContent = `$${location.ratePerHour}`;
    document.getElementById("locationHours").textContent = `${location.openTime} - ${location.closeTime}`;
    document.getElementById("locationDetails").style.display = 'block';
  }
  
  // Fetch and display slots for this location
  await fetchSlotsForLocation(locationId);
  displayLocationSlots(locationId);
  updateMapForLocation(locationId);
}

async function fetchSlotsForLocation(locationId) {
  try {
    const formula = `FIND("${locationId}", ARRAYJOIN({locationId}))`;
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/ParkingSlots?filterByFormula=${encodeURIComponent(formula)}`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`
      }
    });
    const data = await response.json();
    const locationSlots = (data.records || []).map(record => ({
      id: record.id,
      ...record.fields
    }));
    
    // Update or create slots for this location
    allSlots = allSlots.filter(slot => slot.locationId !== locationId);
    allSlots.push(...locationSlots);
    
    return locationSlots;
  } catch (error) {
    console.error("Error fetching slots:", error);
    return [];
  }
}

function displayLocationSlots(locationId) {
  const location = allLocations.find(loc => loc.id === locationId);
  const locationSlots = allSlots.filter(slot => slot.locationId === locationId);
  const slotContainer = document.getElementById("slotContainer");
  
  slotContainer.innerHTML = '';
  
  if (!location) {
    slotContainer.innerHTML = '<p class="center">Location not found.</p>';
    return;
  }

  const slotsFound = locationSlots.length > 0;
  for (let i = 1; i <= location.totalSlots; i++) {
    const slot = locationSlots.find(s => s.slotNumber === i);
    const status = slot ? getStatusLabel(slot.statusCode) : "Unknown";
    const statusClass = slot ? getStatusClass(slot.statusCode) : "unknown";
    
    const slotDiv = document.createElement("div");
    slotDiv.className = `slot ${statusClass}`;
    slotDiv.id = `slot-${locationId}-${i}`;
    slotDiv.innerHTML = `
      <h3>Slot ${i}</h3>
      <p>Status: <span class="status">${status}</span></p>
      <button onclick="reserveSlot('${locationId}', ${i})">Reserve</button>
      <button onclick="cancelSlot('${locationId}', ${i})">Cancel</button>
    `;
    slotContainer.appendChild(slotDiv);
  }

  if (!slotsFound) {
    slotContainer.innerHTML = '<p class="center">No slot records found for this location yet.</p>';
  }
}

function getStatusLabel(statusCode) {
  switch(statusCode) {
    case 1: return "Available ✓";
    case 0: return "Occupied ✗";
    case 2: return "Reserved ⏱";
    default: return "Unknown";
  }
}

function getStatusClass(statusCode) {
  switch(statusCode) {
    case 1: return "available";
    case 0: return "occupied";
    case 2: return "reserved";
    default: return "unknown";
  }
}

async function updateParkingSlot(locationId, slotNumber, status) {
  try {
    // Find the slot record ID
    const slot = allSlots.find(s => s.locationId === locationId && s.slotNumber === slotNumber);
    if (!slot) {
      console.error("Slot not found");
      return;
    }
    
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/ParkingSlots/${slot.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: {
          statusCode: status,
          status: status === 1 ? "Available" : status === 0 ? "Occupied" : "Reserved"
        }
      })
    });
    
    if (response.ok) {
      // Update local data
      slot.statusCode = status;
      slot.status = status === 1 ? "Available" : status === 0 ? "Occupied" : "Reserved";
      displayLocationSlots(locationId);
      updateMapForLocation(locationId);
    }
  } catch (error) {
    console.error("Error updating parking slot:", error);
  }
}

async function reserveSlot(locationId, slotNumber) {
  const user = localStorage.getItem("currentUser");
  if (!user) {
    alert("Please log in first");
    return;
  }
  
  await updateParkingSlot(locationId, slotNumber, 2); // 2 = Reserved
  alert(`Slot ${slotNumber} reserved successfully!`);
  
  // Save to history
  const historyData = {
    user,
    locationId,
    slotNumber,
    bookingDate: new Date().toLocaleDateString(),
    bookingTime: new Date().toLocaleTimeString(),
    status: "Active"
  };
  
  const history = JSON.parse(localStorage.getItem("bookingHistory") || "[]");
  history.push(historyData);
  localStorage.setItem("bookingHistory", JSON.stringify(history));
}

async function cancelSlot(locationId, slotNumber) {
  await updateParkingSlot(locationId, slotNumber, 1); // 1 = Available
  alert(`Slot ${slotNumber} cancelled!`);
}

function initializeParkingMap() {
  if (typeof L === "undefined") return;

  if (parkingMap) {
    parkingMap.remove();
  }

  // Center map on first location or default
  const centerLat = allLocations.length > 0 ? allLocations[0].latitude : 37.7749;
  const centerLng = allLocations.length > 0 ? allLocations[0].longitude : -122.4194;

  parkingMap = L.map("parkingMap", {
    center: [centerLat, centerLng],
    zoom: 13,
    zoomControl: true
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(parkingMap);

  // Add markers for all locations
  allLocations.forEach(location => {
    const marker = L.marker([location.latitude, location.longitude], {
      title: location.name
    }).addTo(parkingMap);

    marker.bindPopup(`
      <strong>${location.name}</strong><br>
      ${location.address}<br>
      <small>Rate: $${location.ratePerHour}/hr</small><br>
      <button onclick="changeLocationFromMap('${location.id}')" style="width: 100%; padding: 5px; margin-top: 5px;">View Slots</button>
    `);
    
    locationMarkers.push({ location, marker });
  });

  // Get user location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      userLocation = [position.coords.latitude, position.coords.longitude];
      L.marker(userLocation, { title: "Your location" }).addTo(parkingMap).bindPopup("You are here").openPopup();
      parkingMap.setView(userLocation, 13);
    });
  }
}

function changeLocationFromMap(locationId) {
  document.getElementById("locationDropdown").value = locationId;
  changeLocation();
}

function updateMapForLocation(locationId) {
  if (!parkingMap) return;
  
  const location = allLocations.find(loc => loc.id === locationId);
  if (location) {
    parkingMap.setView([location.latitude, location.longitude], 15);
  }
}

async function searchNearbySlots() {
  if (!userLocation) {
    alert("Please enable geolocation");
    return;
  }

  // Find closest location with available slots
  let closestLocation = null;
  let minDistance = Infinity;

  allLocations.forEach(location => {
    const distance = calculateDistance(userLocation[0], userLocation[1], location.latitude, location.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      closestLocation = location;
    }
  });

  if (closestLocation) {
    document.getElementById("locationDropdown").value = closestLocation.id;
    await changeLocation();
    alert(`Nearest location: ${closestLocation.name} (${minDistance.toFixed(2)} km away)`);
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", fetchLocations);
