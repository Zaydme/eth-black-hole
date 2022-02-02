require('dotenv').config()
const Web3 = require('web3')
const keys = require('./keys.json')
const { updateGasPrice } = require('./src/helpers')
const { withdrawAllFromKey } = require('./src/worker')

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_SERVER))
let gasPrice = 0
let req = 0
const wait = Math.round(1000 / (10000 / (60 * 5))) * 3

const withdrawAllLoop = async () => {
    let i = 0
    while (i < keys.length) {
        withdrawAllFromKey(web3, gasPrice, keys[i])
        i++
        req++
        await new Promise((resolve) => setTimeout(resolve, wait))
    }
    withdrawAllLoop()
}

const init = async () => {
    console.log('Starting...')
    console.log('Keys count:', keys.length)
    console.log('Wait time (ms):', wait)
    console.log(
        'Average requests per 5 minutes: ',
        Math.round(1000 / wait) * (60 * 5) * 3
    )
    gasPrice = await updateGasPrice(web3)
    console.log('Got initial gas price: ', gasPrice)
    console.log('Starting withdraw loop...')
    withdrawAllLoop()
    setInterval(async () => {
        gasPrice = await updateGasPrice(web3)
    }, 30000)
    setInterval(() => {
        console.log('Requests last 2 hours:', req * 3)
        req = 0
    }, 1000 * 60 * 60 * 2)
}
init()
