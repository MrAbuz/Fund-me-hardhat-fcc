// A file similar to what aave uses because they also work with different chains, they use the same name "helper-hardhat-config", in order to automate the process of choosing
// different parameters based on the networks that we choose to work on the moment.
// We need this to choose the different chainlink datafeeds depending on the network we in.

//Para chamar isto no outro ficheiro (01-deploy-fund-me) fizemos:
//const { networkConfig } = require("../helper-hardhat-config");
//const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"], em que o chainId varia com a network que escolhemos dar deploy.

const networkConfig = {
    5: {
        //chainId
        name: "goerli",
        ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    },
    137: {
        name: "polygon",
        ethUsdPriceFeed: "0x0715A7794a1dc8e42615F059dD6e406A6594651A",
    },
}
//we could code this variables directly in the files but he prefers to have them here
//this chains are gonna be the ones that i'll deploy the mocks to. Estou a usar isto no 00-deploy-mocks.js e no 01-deploy-fund-me.js
//Estou a usar isto assim, interessante: if (developmentChains.includes(network.name))
const developmentChains = ["hardhat", "localhost"]

const DECIMALS = 8 //both this and INITIAL_ANSWER are the variables to input to the constructor of the mock. The mock we took from chainlink requires decimals and initial answer which we type here instead of hardcoding it.
const INITIAL_ANSWER = 200000000000

module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
}
//we're actually gonna export a couple of things from this file, which is why we are doing it like this instead of the default way he shown us before (com a funçao anónima e incluida no module.exports)
