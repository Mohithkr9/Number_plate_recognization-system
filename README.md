# Smart Parking System

A comprehensive IoT-based smart parking solution that combines web-based dashboards, real-time parking slot management, and embedded hardware sensors to optimize parking space availability and user experience.

## 🌟 Features

- **User Authentication**: Secure registration and login system with user profile management
- **Real-Time Dashboard**: Live parking slot availability with interactive map display
- **Geolocation Search**: Find nearby parking slots based on user's current location
- **Parking History**: Track booking history with timestamps and slot details
- **IoT Integration**: ESP32 microcontroller with ultrasonic sensors for real-time slot detection
- **LED Indicators**: Visual feedback for slot status (Green=Available, Red=Occupied, Blinking Red=Reserved)
- **Airtable Backend**: Cloud-based data management for parking slot information
- **Interactive Map**: Leaflet.js integration for visualizing parking slot locations
- **Responsive Design**: Mobile-friendly interface with transparent backgrounds and optimized color contrast

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup for web pages
- **CSS3**: Modern styling with transparency and responsive design
- **JavaScript (Vanilla)**: Dynamic interactions and API integration
- **Leaflet.js**: Interactive mapping library for slot visualization

### Backend
- **Airtable API**: Cloud database for parking slot data management
- **localStorage**: Client-side data persistence for authentication and history

### Hardware
- **ESP32 Microcontroller**: WiFi-enabled IoT device
- **Ultrasonic Sensors (HC-SR04)**: Distance measurement for slot occupancy detection
- **LED Indicators**: Visual status indicators for each parking slot
- **HTTPClient**: REST API communication with Airtable

## 📁 Project Structure

```
smart-parking/
├── index.html              # Landing page
├── login.html              # User login page
├── register.html           # User registration page
├── dashboard.html          # Main parking dashboard with map
├── history.html            # Booking history page
├── auth.js                 # Authentication logic (localStorage)
├── script.js               # Parking data & map management
├── style.css               # Global styles
├── parking1.jpg            # Background image
├── Hardware code/
│   └── esp32.ino          # ESP32 microcontroller code
└── README.md              # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Airtable account with API key
- WiFi network for ESP32 connectivity
- Arduino IDE (for ESP32 programming)

### Installation

1. **Clone the Repository**
   ```bash
   git clone repo.git
   cd smart-parking
   ```

2. **Configure Airtable**
   - Create a new Airtable base with three tables: **Locations**, **ParkingSlots**, and **Bookings** (optional)
   - 
   **Locations Table:**
   - `name` (Text) - Location name
   - `address` (Text) - Full address
   - `latitude` (Number) - GPS latitude
   - `longitude` (Number) - GPS longitude
   - `totalSlots` (Number) - Total slots at location
   - `city` (Text) - City name
   - `phone` (Phone) - Contact number
   - `ratePerHour` (Number) - Parking rate
   - `openTime` (Text) - Opening time (e.g., "06:00")
   - `closeTime` (Text) - Closing time (e.g., "23:00")
   
   **ParkingSlots Table:**
   - `locationId` (Link to Locations) - Links to parent location
   - `slotNumber` (Number) - Slot number at location
   - `statusCode` (Number) - 0=Occupied, 1=Available, 2=Reserved
   - `status` (Text) - Status label
   - `sensorId` (Text) - ESP32 sensor ID
   
   **Example Data:**
   ```
   Location 1: Downtown Mall, 123 Main St, SF, 4 slots, $5/hr
   Location 2: Airport Terminal, 456 Air Way, SF, 4 slots, $8/hr
   Location 3: Shopping Center, 789 Shop Blvd, SF, 4 slots, $4/hr
   ```
   
   - Generate API token from Airtable account settings
   - Copy your Base ID from the API documentation

3. **Update Web Configuration**
   - Open `script.js`
   - Replace placeholders:
     ```javascript
     const AIRTABLE_API_KEY = "YOUR_AIRTABLE_API_KEY";
     const AIRTABLE_BASE_ID = "YOUR_AIRTABLE_BASE_ID";
     ```

4. **Configure ESP32**
   - Open `Hardware code/esp32.ino` in Arduino IDE
   - Update WiFi credentials:
     ```cpp
     #define WIFI_SSID "YOUR_SSID"
     #define WIFI_PASSWORD "YOUR_PASSWORD"
     ```
   - Update Airtable credentials:
     ```cpp
     #define AIRTABLE_API_KEY "YOUR_AIRTABLE_API_KEY"
     #define AIRTABLE_BASE_ID "YOUR_AIRTABLE_BASE_ID"
     ```
   - Upload to ESP32

5. **Run Locally**
   - Open `index.html` in a web browser
   - Or use a local server:
     ```bash
     python -m http.server 8000
     ```
   - Access at `http://localhost:8000`

## 📖 Usage

### For Users

1. **Register**: Create an account with name, email, phone, and vehicle details
2. **Login**: Access the dashboard with credentials
3. **Search Parking**: 
   - Use the search button for nearby slots based on geolocation
   - View parking slots on the interactive map
4. **View History**: Check past bookings and slot usage

### For Hardware Integration

1. **Sensor Setup**: Connect ultrasonic sensors to ESP32 pins as configured:
   - Slot 1: Trig=5, Echo=18
   - Slot 2: Trig=17, Echo=19
   - Slot 3: Trig=16, Echo=21
   - Slot 4: Trig=4, Echo=22

2. **LED Setup**: Connect LEDs to configured pins:
   - Slot 1: Green=13, Red=12
   - Slot 2: Green=14, Red=27
   - Slot 3: Green=26, Red=25
   - Slot 4: Green=33, Red=32

3. **Power & Network**: Provide 5V power and WiFi connectivity

## 🔌 API Integration

### Airtable Configuration

**Base URL**: `https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}`

**Authentication**: Bearer token in Authorization header

**Operations**:
- **GET**: Fetch current parking data
- **PATCH**: Update slot status

**Slot Status Values**:
- `0`: Occupied
- `1`: Available
- `2`: Reserved

**Example Request**:
```javascript
fetch('https://api.airtable.com/v0/appXXXXXXXXXXXXXX/Parking', {
  headers: {
    'Authorization': 'Bearer keyXXXXXXXXXXXXXX'
  }
});
```

## 🔐 Authentication

The system uses **localStorage-based authentication** for demonstration purposes:
- User credentials stored locally in browser
- No server-side authentication
- Suitable for demo/development environments

**For Production**: Implement proper backend authentication (JWT, OAuth2, etc.)

## 🎨 Customization

### Update Slot Locations
Edit `script.js` to modify slot coordinates:
```javascript
const slotLocations = [
  { id: 1, name: "Slot 1", lat: 37.7749, lng: -122.4194 },
  // ... more slots
];
```

### Change Colors & Styling
Modify `style.css` for color schemes, fonts, and responsive breakpoints

### Adjust Sensor Sensitivity
In `esp32.ino`, modify distance thresholds:
```cpp
if (d > 2 && d < 12) {  // Adjust these values
  sensorState = 0; // occupied
}
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Map not displaying | Check Leaflet library CDN and verify geolocation permission |
| Airtable connection fails | Verify API key, Base ID, and table name; check CORS settings |
| ESP32 not connecting to WiFi | Verify SSID/password; check WiFi signal strength |
| Sensors not detecting | Adjust distance thresholds; check sensor wiring |
| LED indicators not working | Verify GPIO pin assignments; check power supply |

## 📱 Features in Detail

### Dashboard
- Real-time slot status with color coding
- Interactive map with marker clustering
- Search functionality based on geolocation
- Responsive grid layout

### History Page
- Table of past bookings
- Timestamp and duration tracking
- Parking cost calculations (optional)

### Responsive Design
- Mobile-first approach
- Transparent backgrounds
- High contrast text for readability
- Touch-friendly interface

## 🔮 Future Enhancements

- [ ] Payment integration for parking fees
- [ ] Reservation system with time slots
- [ ] Email/SMS notifications
- [ ] Admin dashboard for analytics
- [ ] QR code-based check-in
- [ ] Mobile app (React Native/Flutter)
- [ ] Advanced analytics and reporting
- [ ] Multiple parking location support

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

## 🙏 Acknowledgments

- **Leaflet.js** for mapping functionality
- **Airtable** for cloud database services
- **Arduino Community** for ESP32 resources
- All contributors and testers

---

**Version**: 1.0.0  
**Last Updated**: May 2026  
**Author**: Smart Parking Development Team
