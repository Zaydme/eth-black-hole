require('dotenv').config()
const Web3 = require('web3')
const io = require('@pm2/io')
const keys = require('./keys.json')
const lowPriorityKeys = require('./lowPriorityKeys.json')
const { updateGasPrice } = require('./src/helpers')
const { withdrawAllFromKey } = require('./src/worker')

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_SERVER))
let gasPrice = 0
let req = 0
const wait = Math.round(1000 / ((10000 - 60 * 5 * 3) / (60 * 5))) * 3

/* Metrics */
const reqsec = io.meter({
    name: 'req/sec',
    id: 'app/requests/volume',
})

const keysCount = io.metric({
    name: 'Keys count',
    id: 'app/keys/high/count',
})
keysCount.set(keys.length)

const LowPriorityKeysCount = io.metric({
    name: 'Low priority keys count',
    id: 'app/keys/low/count',
})
LowPriorityKeysCount.set(lowPriorityKeys.length)

const averageGasPrice = io.metric({
    name: 'Gas price',
    type: 'histogram',
    measurement: 'mean',
})

const withdrawAllLoop = async () => {
    let i = 0
    while (i < keys.length) {
        withdrawAllFromKey(web3, gasPrice, keys[i])
        i++
        req++
        reqsec.mark()
        await new Promise((resolve) => setTimeout(resolve, wait))
    }
    withdrawAllLoop()
}

const lowPriorityWithdrawAllLoop = async () => {
    let i = 0
    while (i < lowPriorityKeys.length) {
        withdrawAllFromKey(web3, gasPrice, lowPriorityKeys[i])
        i++
        req++
        await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    lowPriorityWithdrawAllLoop()
}

const init = async () => {
    console.log('Starting...')
    console.log('Keys count:', keys.length)
    console.log('Wait time (ms):', wait)
    console.log(
        'Average requests per 5 minutes: ',
        Math.round(1000 / wait) * (60 * 5) * 3 + 60 * 5 * 3
    )
    gasPrice = await updateGasPrice(web3)
    averageGasPrice.set(gasPrice)
    console.log('Got initial gas price: ', gasPrice)
    console.log(`Starting withdraw loop with ${keys.length} keys...`)
    withdrawAllLoop()
    console.log(
        `Starting low priority withdraw loop with ${lowPriorityKeys.length} keys...`
    )
    lowPriorityWithdrawAllLoop()
    setInterval(async () => {
        gasPrice = await updateGasPrice(web3)
        averageGasPrice.set(gasPrice)
    }, 30000)
    setInterval(() => {
        console.log('Requests last 2 hours:', req * 3)
        console.log('Current gas price:', gasPrice)
        req = 0
    }, 1000 * 60 * 60 * 2)
}
init()
