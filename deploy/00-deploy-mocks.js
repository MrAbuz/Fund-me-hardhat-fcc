//deploying mocks is technically a deploy script
//we only do this sometimes. we don't always deploy mocks. we dont need to deploy mocks to use test/mainnets.

// MOCK:
//when going for localhost or hardhat network we'll want to use a MOCK:
//      mocking: an object under test may have dependencies on other objects. To isolate the behavior of the object, you want to replace the other objects by mocks that
//simulate the behavior of the real objects. Mocking is creating objects that simulate the behaviour of real objects.
//Here we want to make a fake price feed contract that we can use and control in order to be able to test etc in localhost on hardhat, because they can only work on
//testnets/mainnets due to their price feeds (and testnets are too slow to use since the beginning of the creation of a project, good to use in the end)

//we copy pasted the same setup as 01-deploy-fund-me.js because we'll deploy this file first if we using hardhat/localhost, and only the 01 if its testnets/mainnets.
//created a folder in contracts named 'test' and a file inside named 'Mockv3Aggregator.sol for the mock, apart from the other contracts because it's not a real contract, its just for testing.

const { network } = require("hardhat")
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    //both this two parameters come from 'hre', explanation in 01-deploy-fund-me.js
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts() //here we grab our deployer account from our namedAccounts in hardhat.config.js, where we sort the different accounts (private keys) we use.

    if (developmentChains.includes(network.name)) {
        //or we could do "if (chainId == "31337")"
        //this "includes" keyword is a function that checks to see if some variable is inside an array (in this case the developmentChains array).
        log("Local network detected! Deploying mocks...") //this is basically console.log
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator", //wasnt needed to add this one because we said it above
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER], //could've created this two variables in this file, but patrick prefers to get them from helper-hardhat-config.js
            //both DECIMALS and INITIAL_ANSWER are the variables to input to the constructor of the mock. The mock we took from chainlink requires decimals and initial answer.
        })
        log("Mocks deployed!")
        log("--------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"] //how can we choose to run only the deploy mock script?
// we add this tags at module exports and then we can use "yarn hardhat deploy --tags mocks". this way it will only run the deploy script that have a special tag, in this case "mocks"

//Conclusion:
//this will deploy the "MockV3Aggregator"(and get an fake ethereum price feed address) that we can input in the 01-deploy-fund-me-js instead of "AggregatorV3Interface.sol"
// normal addresses that we get from the chainlink price feed site. We need to use this when deploying in hardhat or localhost bcuz theres no price feeds for those chains.
// since it has the same functions as "AggregatorV3Interface.sol". The PriceConverter.sol can interact with it normaly to get the fake value.
