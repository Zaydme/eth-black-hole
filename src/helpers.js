const updateGasPrice = async (web3) => {
    const newGasPrice =
        (await web3.eth.getGasPrice().catch(() => {
            console.log(
                'Error getting gas price, maybe being rate limited...\nFuck it, will just use 6 lol'
            )
        })) || 6
    return parseInt((newGasPrice / 10 ** 9 + 1).toFixed(0))
}

module.exports = {
    updateGasPrice,
}
