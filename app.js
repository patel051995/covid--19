const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(_dirname, 'covid19India.db')

let db = null

const initializeDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`Database Error ${e.message}`)
    process.exit(1)
  }
}

initializeDb()

const convertDbObjecToResponseObject = dbObject => {
  return {
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

//API 1 Getting all state
app.get('states/', async (request, response) => {
  const stateName = `SELECT * FROM state  `

  const allStatesArray = await db.all(stateName)

  response.send(
    allStatesArray.map(eachObject =>
      convertDbObjecToResponseObject(eachObject),
    ),
  )
})

//API 2 Getting Particular state based on State_iD
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const stateQuery = `
        SELECT * FROM state WHERE state_id = ${stateId}
        `
  const stateDetails = await db.get(stateQuery)
  response.send(convertDbObjecToResponseObject(stateDetails))
})

//API 3 createing district
app.post('/districts/', async (request, response) => {
  const newDistrict = request.body

  const {districtName, stateId, cases, cured, active, deaths} = newDistrict

  const addingNewDistrict = `
        INSERT INTO 
            district (district_name,
                      state_id,
                      cases,
                      cured,
                      active,
                      deaths )
               VALUES(
                       '${districtName}',
                       '${stateId}',
                       '${cases}',
                       '${cured}',
                       '${active}',
                       '${deaths}')`

  const dbResponse = await db.run(addingNewDistrict)
  const newDistictDetails = dbResponse.lastID
  response.send('District Successfully Added')
})

//API 4 getting district  based on district_id
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = `
        SELECT * FROM district WHERE district_id = ${districtId}
        `
  const districtArray = await db.get(districtDetails)
  response.send(convertDbObjectToResponseObject(districtArray))
})

//API 5 Removing district from district table
app.delete('/districts/:districtId/', async (request, response) => {
  const {districId} = request.params

  const removeDistrict = `DELETE FROM district WHERE district_id = ${districId}`

  await db.run(removeDistrict)
  response.send('District Removed')
})

//API 6 Update the district based on the district_id
app.put('/districts/:districtId', async (request, response) => {
  const {districId} = request.params
  const districtDetails = request.body

  const {districtName, stateId, cases, cured, active, deaths} = districtDetails

  const updateDistrictDetails = `
        UPDATE district SET
                         district_name = '${districtName}',
                         state_id = '${stateId}',
                         cases = '${cases}',
                         cured = '${cured}',
                         active = '${active}',
                         deaths = '${deaths}'
                    WHERE district_id = ${districtId}`

  await db.run(updateDistrictDetails)
  response.send('District Details Updated')
})

// API 7 Getting Statistics of Sarticular state
app.get('/states/:stateId/stats/', async (request, response) => {
  const {districtId} = request.params
  const stateQuery = `
          SELECT
               SUM(cases),
               SUM(cured),
               SUM(active),
               SUM(deaths)
          FROM district
          WHERE
              state_id = ${stateID}
              `
  const stateDetails = await db.get(stateQuery)

  response.send({
    totalCases: stateDetails['SUM(cases)'],
    totalCured: stateDetails['SUM(cured)'],
    totalActive: stateDetails['SUM(active)'],
    totalDeaths: stateDetails['SUM(deaths)'],
  })
})

// API 8 Getting State Name Based on district_Id
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districId} = request.params
  const stateQuery = `
          SELECT state_name 
          FROM state 
              NATURAL JOIN district
          WHERE district_id = ${districId}
          `
  const stateName = await db.get(stateQuery)
  response.send(convertDbObjecToResponseObject(stateName))
})

module.exports = app
