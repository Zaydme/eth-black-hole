require('dotenv').config()
const Web3 = require('web3')
const keys = require('./keys.json')
const { updateGasPrice } = require('./src/helpers')
const { withdrawAllFromKey } = require('./src/worker')

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_SERVER))
let gasPrice = 0
let req = 0
const withdrawAllLoop = async () => {
    let i = 0
    while (i < keys.length) {
        withdrawAllFromKey(web3, gasPrice, keys[i])
        i++
        req++
        await new Promise((resolve) => setTimeout(resolve, 90))
    }
    withdrawAllLoop()
}

const init = async () => {
    console.log('Starting...')
    gasPrice = await updateGasPrice(web3)
    console.log('Got initial gas price: ', gasPrice)
    console.log('Starting withdraw loop...')
    withdrawAllLoop()
    setInterval(async () => {
        gasPrice = await updateGasPrice(web3)
    }, 30000)
    setInterval(() => {
        console.log('Requests last 2 hours:', req)
        req = 0
    }, 1000 * 60 * 60 * 2)
}
init()
