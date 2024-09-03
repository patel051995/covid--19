const express = require('express')
const app = express()
const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
app.use(express.json())
const dbPath = path.join(__dirname, 'covid19India.db')
let db = null

const objectSnakeToCamel = (newObject) => {
  return {
    stateId: newObject.state_id, //updated here
    stateName: newObject.state_name,
    population: newObject.population,
  };
};

const districtSnakeToCamel = newObject => {
  return {
    districtId: newObject.district_id,
    districtName: newObject.district_name,
    stateId: newObject.state_id,
    cases: newObject.cases,
    cured: newObject.cured,
    active: newObject.active,
    deaths: newObject.deaths,
  }
}

const responseSnakeToCamelCase = newObject => {
  return {
    totalCases: newObject.cases,
    totalCured: newObject.cured,
    totalActive: newObject.active,
    totalDeaths: newObject.deaths,
  }
}
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(`Server Is Running`)
    })
  } catch (e) {
    console.log(`error ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

//Returns a list of all states in the state table
app.get('/states/', async (request, response) => {
  const allStatesList = ` 
  SELECT *
  FROM state  
  ORDER BY state_id`
  const stateList = await db.all(allStatesList)
  const statesResult = stateList.map(eachObject => {
    return objectSnakeToCamel(eachObject)
  })
  response.send(statesResult)
})

//Returns a state based on the state ID
app.get("/states/", async (request, response) => {
  const allStatesList = ` 
  SELECT *
  FROM state  
  ORDER BY state_id`;
  const stateList = await db.all(allStatesList);
  const statesResult = stateList.map((eachObject) => {
    return objectSnakeToCamel(eachObject);
  });
  response.send(statesResult);
});

//Create a district in the district table
app.post('/districts/', async (request, response) => {
  const createDistric = request.body
  const {districName, stateId, cases, cured, active, deaths} = createDistric
  const newDistric = `
   INSERT INTO
   district (district_name,state_id,cases,cured,active,deaths)
   VALUES
       ('${districtName}'
       ${stateId},
       ${cases},
       ${cured},
       ${active},
       ${deaths},
       );`
  const addDistrict = await db.run(newDistict)
  const districtId = addDistrict.lastId
  response.send('District Successfully Added')
})

//Returns a district  based on district Id
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrict = `
        SELECT *
       FROM   district 
       WHERE district_id = ${districtId};`
  const newDistrict = await db.get(getDistrict)
  const districtResult = districtSnakeToCamel(newDistrict)
  response.send(districtResult)
})

//Deletes a district from the district table based on the district ID
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrict = `
  DELETE 
  FROM district 
  WHERE district_id = ${districtId}; // districtId
  `
  await db.run(deleteDistrict)
  response.send('District Removed')
})

//Update the details of a specific district based on the district ID

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistrict = ` 
        UPDATE
           district
        SET
            district_name = '${districtName}',
            state_id = '${stateId}',
            cases = '${cases}',
            cured = '${cured}',
            active = '${active}',
            deaths = ${deaths}
    WHERE district_id = ${districtId};
`
  await db.run(updateDistrict)
  response.send('District Details Updated')
})

//Returns a State Report
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateID} = request.params
  const getStateReport = `
          SELECT 
   SUM(cases) AS cases,
               ......
          WHERE state_id = ${stateId};`

  const stateReport = await db.get(getStateReport)
  const resultReport = responseSnakeToCamelCase(stateReport)
  response.send(resultReport)
})

//Returns a stateName based on district Id
app.get('/district/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const stateDetails = `
          SELECT state_name 
          FROM state JOIN district
              ON state.state_id = district.state_id
          WHERE district.district_id = ${districId};`
  const stateName = await db.get(stateDetails)
  response.send({stateName: stateName.state_name})
})

module.exports = app
