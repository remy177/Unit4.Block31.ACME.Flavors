const pg = require('pg');
const path = require('path');
const express = require('express');
const app = express();

const dbName = 'acme_hr_db';
const dbString = (process.env.DATABASE_URL || 'postgres://postgres:ilovetess@localhost:5432/') + dbName;
const client = new pg.Client(dbString);

app.use(express.json());
app.use(require('morgan')('dev'));

// static routes for deployment
app.use(express.static(path.join(__dirname, '../client/dist')));


/////////////////////////////////////
// -------- api routes begin --------
//
// default static route for root
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));

// route for get() select all
app.get('/api/flavors', async (req, res, next) => {
  console.log('inside select all api...');
  try {
    const SQL = `SELECT * FROM flavors;`;
    const result = await client.query(SQL);
    res.send(result.rows);
  } catch (err) {
    next(err);
  }
});

// route for get() select single
app.get('/api/flavors/:id', async (req, res, next) => {
  console.log('inside select by id api...');
  try {
    const SQL = `SELECT * FROM flavors 
                WHERE id=$1`;
    const result = await client.query(SQL, [req.params.id]);
    res.send(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// route for post() insert new
app.post('/api/flavors', async (req, res, next) => {
  console.log('inside insert new api...');
  try {
    const SQL = `INSERT INTO flavors(name, is_favorite) 
                VALUES($1, $2) RETURNING *;`;
    const result = await client.query(SQL, [req.body.name, req.body.is_favorite]);
    res.send(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// route for put() update existing record
app.put('/api/flavors/:id', async (req, res, next) => {
  console.log('inside update api...');
  try {
    const SQL = `UPDATE flavors
                SET name=$1, is_favorite=$2, updated_at=now() 
                WHERE id=$3 RETURNING *;`;
    const result = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id]);
    res.send(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// route for delete() delete existing record
app.delete('/api/flavors/:id', async (req, res, next) => {
  console.log('inside delete api...');
  try {
    const SQL = `DELETE FROM flavors 
                WHERE id=$1`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

//
// -------- api routes end --------
///////////////////////////////////


// init() gateway entry point
const init = async() => {

  await client.connect();

  const SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      is_favorite BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
    INSERT INTO flavors(name, is_favorite) VALUES('Rocky Road', false);
    INSERT INTO flavors(name, is_favorite) VALUES('Green Tea', true);
    INSERT INTO flavors(name, is_favorite) VALUES('Vanilla', true);
    INSERT INTO flavors(name) VALUES('Mint Chip');
  `;
  await client.query(SQL);
  console.log('data seeded');

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
  })
}

// init function invocation
init();