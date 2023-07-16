const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const app = express();
const port = 3000;

// Odpremo povezavo do baze podatkov
let db = new sqlite3.Database('./busapp.sqlite');

// Določimo header nastavitve
app.use(function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    res.setHeader("vary", "User-Agent");
    next();
});

// Root path
app.get("/", (req, res, next) => {
    res.send("BusApp API");
});

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------ HomeScreen --------------------------------------------------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Iskanje postaj po imenu  - http://192.168.88.18:3000/api/urnikpostaje/1
app.get('/api/urnikpostaje/:id_postaje', (req, res) => {
  const id_postaje = req.params.id_postaje;
  db.all(`
    SELECT l.ime_linija, o.zacetek_voznje, vp.cas_od_zacetka, vp.cena, vp.vrstni_red, koncna_postaja.ime_postaje AS koncna_postaja,
    strftime('%H:%M', time(datetime(zacetek_voznje, '+' || (SELECT cas_od_zacetka FROM vmesne_postaje WHERE id_linije = l.id_linija AND vrstni_red = (SELECT MAX(vrstni_red) FROM vmesne_postaje WHERE id_linije = l.id_linija)) || ' minutes'))) AS koncna_ura
    FROM odhodi o
    INNER JOIN linija l ON o.id_linije = l.id_linija
    INNER JOIN vmesne_postaje vp ON o.id_linije = vp.id_linije
    INNER JOIN postaje koncna_postaja ON l.koncna_postaja = koncna_postaja.id_postaje
    WHERE vp.id_postaje = ?
    ORDER BY vp.vrstni_red`, [id_postaje], (err, rows) => {
      if (err) {
        // obdelaj napako
        console.error(err);
        return res.status(500).send('Napaka pri pridobivanju podatkov.');
      }

      const urnikPostaje = rows.map(row => {
        const zacetekVoznjeParts = row.zacetek_voznje.split(':');
        const zacetekVoznje = new Date();
        zacetekVoznje.setHours(zacetekVoznjeParts[0]);
        zacetekVoznje.setMinutes(zacetekVoznjeParts[1]);

        const casPostaje = row.cas_od_zacetka;
        const uraOdhoda = new Date(zacetekVoznje.getTime() + casPostaje * 60000);
        const formattedUraOdhoda = uraOdhoda.toLocaleTimeString('sl-SI', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        return {
          ime_linija: row.ime_linija,
          zacetek_voznje: row.zacetek_voznje,
          cas: row.cas_od_zacetka,
          cena: row.cena,
          ura_odhoda: formattedUraOdhoda,
          koncna_postaja: row.koncna_postaja,
          koncna_ura: row.koncna_ura // Dodajanje končne ure
        };
      });

      res.send(urnikPostaje);
    });
});

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------ TimeTableScreen ---------------------------------------------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Iskanje linije  - http://192.168.88.18:3000/api/najdiLinijo/1/61
app.get('/api/najdiLinijo/:postaja1/:postaja2', (req, res) => {
  const postaja1 = req.params.postaja1;
  const postaja2 = req.params.postaja2;

  db.all(`SELECT DISTINCT l.ime_linija 
          FROM linija l 
          JOIN vmesne_postaje vp1 ON l.id_linija = vp1.id_linije 
          JOIN vmesne_postaje vp2 ON l.id_linija = vp2.id_linije 
          WHERE vp1.id_postaje = ? AND vp2.id_postaje = ?`, [postaja1, postaja2], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send('Napaka na strežniku.');
    } else {
      res.send(rows);
    }
  });
});

//Urnik linij ki peljejo mimo izbranih dveh postaj - http://192.168.88.18:3000/api/urniklinije/1/61
app.get('/api/urniklinije/:ime_postaje1/:ime_postaje2', (req, res) => {
  const ime_postaje1 = req.params.ime_postaje1;
  const ime_postaje2 = req.params.ime_postaje2;

  db.all(`
    SELECT l.ime_linija, p1.ime_postaje AS vstopna_postaja, o.zacetek_voznje,
    (vp2.cas_od_zacetka - vp1.cas_od_zacetka) AS cas, vp2.cena, p2.ime_postaje AS izstopna_postaja,
    strftime('%H:%M', time(datetime(zacetek_voznje, '+' || vp1.cas_od_zacetka || ' minutes'))) AS zacetek_voznje,
    strftime('%H:%M', time(datetime(zacetek_voznje, '+' || vp2.cas_od_zacetka || ' minutes'))) AS konec_voznje
    FROM odhodi o
    INNER JOIN linija l ON o.id_linije = l.id_linija
    INNER JOIN vmesne_postaje vp1 ON o.id_linije = vp1.id_linije
    INNER JOIN vmesne_postaje vp2 ON o.id_linije = vp2.id_linije
    INNER JOIN postaje p1 ON vp1.id_postaje = p1.id_postaje
    INNER JOIN postaje p2 ON vp2.id_postaje = p2.id_postaje
    WHERE p1.ime_postaje = ?
      AND (p2.ime_postaje = ? OR ? IS NULL)
      AND vp1.vrstni_red < vp2.vrstni_red
    ORDER BY vp1.vrstni_red`, [ime_postaje1, ime_postaje2, ime_postaje2], (err, rows) => {
      if (err) {
        // Handle the error
        console.error(err);
        return res.status(500).send('Napaka pri pridobivanju podatkov.');
      }

      const urnikPostaje = rows.map(row => {
        return {
          ime_linija: row.ime_linija,
          vstopna_postaja: row.vstopna_postaja,
          zacetek_voznje: row.zacetek_voznje,
          cas: row.cas,
          cena: row.cena,
          izstopna_postaja: row.izstopna_postaja,
          konec_voznje: row.konec_voznje
        };
      });

      res.send(urnikPostaje);
    });
});

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------ NotificationScreen ------------------------------------------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Izpis vseh obvestil
app.get('/api/obvestila', (req, res, next) => {
  const sql = 'SELECT * FROM obvestila';
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------ Postaje -----------------------------------------------------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Iskanje vseh postaj
app.get('/postaje', (req, res) => {
  db.all('SELECT * FROM postaje', [], (err, rows) => {
      if (err) {
          throw err;
      }
      res.send(rows);
  });
});

// Iskanje postaj po imenu  - http://192.168.88.18:3000/postaje/najdiPoImenu/Kranj
app.get('/postaje/najdiPoImenu/:postajeIme', (req, res) => {
  const postajeIme = req.params.postajeIme;
  db.all('SELECT * FROM postaje WHERE ime_postaje LIKE ?', ['%' + postajeIme + '%'], (err, rows) => {
      if (err) {
          console.error(err);
          res.status(500).send('Napaka na strežniku.');
      } else {
          res.send(rows);
      }
  });
});

// Iskanje postaj po id  - http://192.168.88.18:3000/postaje/najdiPoId/1
app.get('/postaje/najdiPoId/:postajeId', (req, res) => {
  const postajeId = req.params.postajeId;
  db.all('SELECT * FROM postaje WHERE id_postaje LIKE ?', ['%' + postajeId + '%'], (err, rows) => {
      if (err) {
          console.error(err);
          res.status(500).send('Napaka na strežniku.');
      } else {
          res.send(rows);
      }
  });
});

// Iskanje vseh vmesnih postaj
app.get('/vmesne_postaje', (req, res) => {
  db.all('SELECT * FROM vmesne_postaje', [], (err, rows) => {
      if (err) {
          throw err;
      }
      res.send(rows);
  });
});

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------ Linije ------------------------------------------------------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Iskanje vseh linij - http://192.168.88.18:3000/linija
app.get('/linija', (req, res) => {
  db.all('SELECT * FROM linija', [], (err, rows) => {
      if (err) {
          throw err;
      }
      res.send(rows);
  });
});

// Iskanje linija po imenu  - http://192.168.88.18:3000/linija/najdiPoImenu/Proga
app.get('/linija/najdiPoImenu/:linijaIme', (req, res) => {
  const linijaIme = req.params.linijaIme;
  db.all('SELECT * FROM linija WHERE ime_linija LIKE ?', ['%' + linijaIme + '%'], (err, rows) => {
      if (err) {
          console.error(err);
          res.status(500).send('Napaka na strežniku.');
      } else {
          res.send(rows);
      }
  });
});

// Pridobivanje postaj za določeno linijo  - http://192.168.88.18:3000/linija/1/postaje
app.get('/linija/:id_linije/postaje', (req, res) => {
  const id_linije = req.params.id_linije;

  db.all(`
    SELECT p.ime_postaje, strftime('%H:%M', time(datetime(o.zacetek_voznje, '+' || vp.cas_od_zacetka || ' minutes'))) AS ura_odhoda
    FROM vmesne_postaje vp
    INNER JOIN odhodi o ON vp.id_linije = o.id_linije
    INNER JOIN postaje p ON vp.id_postaje = p.id_postaje
    WHERE vp.id_linije = ?
    ORDER BY vp.vrstni_red`, [id_linije], (err, rows) => {
      if (err) {
        // Handle the error
        console.error(err);
        return res.status(500).send('Napaka pri pridobivanju podatkov.');
      }

      const postaje = rows.map(row => {
        return {
          ime_postaje: row.ime_postaje,
          ura_odhoda: row.ura_odhoda
        };
      });

      res.send(postaje);
    });
});

// Iskanje linija po id  - http://192.168.88.18:3000/linija/najdiPoId/1
app.get('/linija/najdiPoId/:postajaId1/:postajaId2?', (req, res) => {
  const postajaId1 = req.params.postajaId1;
  const postajaId2 = req.params.postajaId2;
  
  let sqlQuery = `SELECT * FROM linija WHERE id_linija IN 
    (SELECT vp1.id_linije FROM vmesne_postaje AS vp1`;
  
  if (postajaId2) {
    sqlQuery += ` INNER JOIN vmesne_postaje AS vp2 
      ON vp1.id_linije = vp2.id_linije 
      WHERE vp1.id_postaje = ? AND vp2.id_postaje = ?)`;
    
    db.all(sqlQuery, [postajaId1, postajaId2], (err, rows) => {
      if (err) {
        console.error(err);
        res.status(500).send('Napaka na strežniku.');
      } else {
        if (rows.length > 0) {
          res.send(rows);
        } else {
          res.send('Ni najdenih linij, ki ustrezajo obema postajama.');
        }
      }
    });
  } else {
    sqlQuery += ' WHERE vp1.id_postaje = ?)';
    
    db.all(sqlQuery, [postajaId1], (err, rows) => {
      if (err) {
        console.error(err);
        res.status(500).send('Napaka na strežniku.');
      } else {
        if (rows.length > 0) {
          res.send(rows);
        } else {
          res.send('Ni najdenih linij, ki ustrezajo prvi postaji.');
        }
      }
    });
  }
});

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------ APP ---------------------------------------------------------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
app.get('/api/rezim', (req, res, next) => {
  const sql = 'SELECT * FROM rezim';
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/datumi', (req, res, next) => {
  const sql = 'SELECT * FROM datumi';
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/odhodi', (req, res, next) => {
  const sql = 'SELECT * FROM odhodi';
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// -------------------------------------------------------------------------------------------------
// ------------------------  STREŽNIK  -------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Zagnemo strežnik
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});