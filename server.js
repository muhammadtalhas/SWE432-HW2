let fetch = require('node-fetch');
let express = require('express');
let bodyParser = require('body-parser');

//NASA Api constants
const baseURL = "https://api.nasa.gov/neo/rest/v1/feed?";
const apiKey = "aQrVloEcD9iUyUxAuWup8KodIyE0RyeLQNZQmUjx";

// Will hold cached data
let cachedData = [];
// Express
let app = express();


// function to build URI with passed in params. Defaulted endDate will be startDate
buildURI = (startDate, endDate = 0) => {
    return (endDate !== 0) ? `${baseURL}start_date=${startDate}&end_date=${endDate}&detailed=false&api_key=${apiKey}` : `${baseURL}start_date=${startDate}&end_date=${startDate}&detailed=false&api_key=${apiKey}`
};

// A single astroid data
class nearEarthObject {
    constructor(name, magnitude, diameter_feet, hazard, date, velocity, distance_miles, orbit) {
        this.name = name;
        this.magnitude = magnitude;
        this.diameter = diameter_feet;
        this.hazard = hazard;
        this.date = date;
        this.velocity = velocity;
        this.distance = distance_miles;
        this.orbit = orbit;
    }
}

// One single day
class day {
    constructor(date, nearearthobjectsarray = []) {
        this.date = date;
        this.nearearthobjectsarray = nearearthobjectsarray;
        // Use this to add a new astroid
        this.addNeo = (NEO) => {
            this.nearearthobjectsarray.push(NEO);
        }
    }
}

// Express setup TODO may remove if body-parser is not needed
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Default port is 8080
let port = process.env.PORT || 8080;

// GET returns data on a specifc date. Will be looked up once then added to cache for future requests
app.get('/getAsteroidsByDate/:date', (req, res) => {
    for (let date of cachedData) {
        if (req.params.date === date.date) {
            console.log("found cached")
            res.send(date);
            return; // return stops further execution
        }
    }
    console.log("not cached, looking it up")
    fetch(buildURI(req.params.date)).then(function (response) {
        return response.json();
    }).then(function(response){
        let object = response["near_earth_objects"][req.params.date];
        let newDate = new day(req.params.date);
        // console.log(object)
        for (let objs of object) {
            let dia = objs.estimated_diameter;
            let close = objs.close_approach_data[0];
            let NEO = new nearEarthObject(objs.name, objs.absolute_magnitude_h, dia.feet, objs.is_potentially_hazardous_asteroid,
                close.close_approach_date, close.relative_velocity, close.miss_distance.miles, close.orbiting_body);
            newDate.addNeo(NEO);
        }

        cachedData.push(newDate);
        res.send(newDate)
    })
});

app.listen(port, function () {
    console.log("( ͡° ͜ʖ ͡°) Hi! Im Mr. Lenny. Visit me on " + port)
});
