# Arriva-KR-API-BusApp
Arriva-KR-API-BusApp API Server
This repository contains the code for the Arriva-KR-API-BusApp API server. The server provides an API for accessing bus-related information such as station schedules, timetables, notifications, and more.

Prerequisites
Node.js
SQLite3
Installation
Clone the repository: git clone https://github.com/your-username/Arriva-KR-API-BusApp.git
Navigate to the project directory: cd Arriva-KR-API-BusApp
Install the dependencies: npm install
Usage
Start the server: node index.js
The server will run on port 3000.
Access the API endpoints using the appropriate URLs.
API Endpoints
Root Path: /

Returns a simple message indicating that the BusApp API is running.
HomeScreen

GET /api/urnikpostaje/:id_postaje
Retrieves the schedule for a specific station identified by id_postaje.
TimeTableScreen

GET /api/najdiLinijo/:postaja1/:postaja2
Searches for a line between two stations identified by postaja1 and postaja2.
GET /api/urniklinije/:ime_postaje1/:ime_postaje2
Retrieves the timetable for lines passing through two specified stations identified by ime_postaje1 and ime_postaje2.
NotificationScreen

GET /api/obvestila
Retrieves all notifications.
Postaje

GET /postaje
Retrieves all stations.
GET /postaje/najdiPoImenu/:postajeIme
Searches for stations by name.
GET /postaje/najdiPoId/:postajeId
Retrieves a station by ID.
Vmesne_postaje

GET /vmesne_postaje
Retrieves all intermediate stations.
Linije

GET /linija
Retrieves all lines.
GET /linija/najdiPoImenu/:linijaIme
Searches for lines by name.
GET /linija/:id_linije/postaje
Retrieves the stations for a specific line identified by id_linije.
GET /linija/najdiPoId/:postajaId1/:postajaId2?
Searches for lines by station ID(s).
APP

GET /api/rezim
Retrieves all modes.
GET /api/datumi
Retrieves all dates.
GET /api/odhodi
Retrieves all departures.
Database
The server uses an SQLite database located at ./busapp.sqlite.
The necessary tables and data should be set up in the database before running the server.
License
This project is licensed under the MIT License.

For detailed information about the API endpoints and their functionality, please refer to the code comments and the API documentation.

For any questions or issues, please contact [your-email@example.com].
