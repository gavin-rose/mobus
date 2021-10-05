let app = require('express')
let morbus = require('brain.js')

let mortality = new morbus.NeuralNetwork()
let raw = require('./MORTALITY_RAW.json')
let data = []

normalize = (item) => {
    return {
        input: normalizeInput(item.input),
        output: item.output
    }
}

normalizeInput = (input) => {
    return {
        //AGE: input.AGE / 100,
        GENDER: input.GENDER / 10,
        RACE: input.RACE / 10
    }
}

queryRequest = (age, gender, race) => {
    data = []
    let properRace = 'White'
    let properGender = 'Male'
    switch(gender) {
        case 'Male':
            gender = 1
            properGender = 'Male'
            break
        case 'Female':
            gender = 2
            properGender = 'Female'
            break
    }
    switch(race) {
        case 'White':
            race = 1
            break
        case 'Black':
            race = 2
            properRace = 'Black or African American'
            break
        case 'Asian':
            race = 3
            properRace = 'Asian or Pacific Islander'
            break
    }
    for (let i = 0; i < raw.length; i++) {
        let magnitude = Math.round(raw[i].RATE)
        for (let m = 0; m <= magnitude; m++) {
            let RATE = 1
            if (raw[i].RATE == 0) RATE = 0
            if (raw[i].AGE == age && raw[i].GENDER == gender && raw[i].RACE == race) {
                data.push({
                    input: {
                        "GENDER": raw[i].GENDER,
                        "RACE": raw[i].RACE,
                    },
                    output: {
                        [raw[i].CAUSE]: RATE,
                    }
                })
            }
        }
    }
    
    data = data.map(normalize)
    
    let trained = mortality.train(data, {
        iterations: 1000,
        log: (details) => console.log(details),
        errorThresh: 0.0075,
    })
    console.log(trained)
    let likely = (morbus.likely(normalizeInput({ GENDER: 1, RACE: 1}), mortality))
    return(`A ${age} year old ${properRace} ${properGender} is most likely to die of ${likely}`)
    //console.log(brain.likely(normalizeInput({ GENDER: 1, RACE: 1 }), mortality))
}

let thread = app()
let router = app.Router()

let PORT = process.env.PORT || 3000

thread.use('/', router)

router.get('/', (request, response) => {
    response.json({ status: 'morbus app initialized' })
})

router.get('/query', (request, response) => {
    let result = queryRequest(request.query.AGE, request.query.GENDER, request.query.RACE)
    response.json({ 
        status: 'successfully ran request',
        data: result
    })
})

thread.listen(PORT, () => {
    console.log('running morbus...')
})