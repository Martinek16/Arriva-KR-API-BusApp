# Arriva Kranj API server for [BusApp](https://github.com/Martinek16/BusApp "BusApp")
This repository contains the code for the Arriva Kranj API server for mobile app BusApp. The server provides an API for accessing bus-related information such as station schedules, timetables, notifications, and more.

### Requirements
- Node.js
- SQLite3

### Installation
- Clone the repository: git clone https://github.com/Martinek16/Arriva-KR-API-BusApp.git
- Navigate to the project directory: cd Arriva-KR-API-BusApp
- Install the dependencies: npm install

### Usage
1. Start the server: node index.js
2. The server will run on port http://localhost:3000/.
3. Access the API endpoints using the appropriate URLs.
4. API Endpoints
5. Root Path: /

### Database
The server uses an SQLite database located at ./busapp.sqlite.
The necessary tables and data should be set up in the database before running the server.

For detailed information about the API endpoints and their functionality, please refer to the code comments and the API documentation.


### Calls
Example: [http://localhost:3000/postaje](http://localhost:3000/postaje "http://localhost:3000/postaje")

```javascript

// Retrieves all stations
app.get('/postaje', (req, res) => {
  db.all('SELECT * FROM postaje', [], (err, rows) => {
      if (err) {
          throw err;
      }
      res.send(rows);
  });
});

```

###### GET /postaje

- Retrieves all stations.

------------
###### GET /api/najdiLinijo/:postaja1/:postaja2

  - Searches for a line between two stations identified by postaja1 and postaja2.
  
------------

###### GET /api/urniklinije/:ime_postaje1/:ime_postaje2

- Retrieves the timetable for lines passing through two specified stations identified by ime_postaje1 and ime_postaje2.

------------

###### GET /api/obvestila

-   Retrieves all notifications.

------------
###### GET /postaje

- Retrieves all stations.

------------
###### GET /postaje/najdiPoImenu/:postajeIme

- Searches for stations by name.

------------
###### GET /postaje/najdiPoId/:postajeId

- Retrieves a station by ID.

------------
###### GET /vmesne_postaje

- Retrieves all intermediate stations.

------------
###### GET /linija

- Retrieves all lines.

------------
###### GET /linija/najdiPoImenu/:linijaIme

- Searches for lines by name.

------------
###### GET /linija/:id_linije/postaje

- Retrieves the stations for a specific line identified by id_linije.

------------
###### GET /linija/najdiPoId/:postajaId1/:postajaId2?

- Searches for lines by station ID(s).

------------

