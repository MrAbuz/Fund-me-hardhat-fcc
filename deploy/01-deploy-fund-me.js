// import
// main function
// calling of main function

//   HERE WE ARE USING THE HARDHAT DEPLOY!!

// we're still gonna import our libraries and packages, but the rest is different.
// when we run "hardhat deploy", it calls a function that we specify in this script. so we create a function and we export it as the default function for hardhat deploy to look for.

//1.
//async function deployFunc(hre) {
//    console.log("Hi!")
//}

//module.exports.default = deployFunc

// 2.But instead we'll do it in a different syntax:
// we're gonna use a nameless asynchronous function (anonymous function)
// but this is the exact same as the above syntax, we can use any of this.

//hre -> hardhat runtime environment, como no deploy script temos "const { ethers, e outras variáveis } = require ("hardhat")", aqui vêm de "hre"

//module.exports = async (hre) => {
//    const { getNamedAccounts, deployments } = hre

//hre.getNamedAccounts (same things as typing like this but pulling them out like above means we dont have to add hre at the begining anymore)
//hre.deployments
//nao estava a dar para pôr parênteses no (hre) a chamar a função wtf

//}
//
//
//
//
//
//
//
// 3. And we're even gonna do it a little bit different. Instead of two lines, we're gonna do it all in one line:
//Esta é a única forma que conta, as outras é so para perceber como chegámos aqui.

const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config") // lindo, para importar outro ficheiro que fizémos. "../" é para ir "down a directory", até aparece opção para ir selecionar o ficheiro mesmo. E é por isso é que no outro demos export, para poder chamar diretamente.
const { verify } = require("../utils/verify") //to get verify function from our utils folder

// À parte, mas útil para percebermos os curly brackets de { networkConfig } ou quaisquer curly brackets nesta situação de requires. É o mesmo que fazermos:
// const helperConfig = require ("../helper-hardhat-config")
// const networkConfig = helperConfig.networkConfig.
// This syntax with the brackets is just an easy way to just take out the networkConfig from the file ""../helper-hardhat-config" . Não representa o file todo.
// And thats why we export it at the bottom, so that we can do this.

module.exports = async ({ getNamedAccounts, deployments }) => {
    //getNamedAccounts e deployments vêm de hre então (como podemos ver no exemplo 2 em cima).
    //só não estou a perceber bem é como é que o hardhat assim (sem especificar hre) percebe que vamos iniciar estas duas variáveis através do hre.
    //se calhar como o hardhat automaticamente recebe hre como argumento no deploy, facilmente percebe que estas funções especificas são chamadas através do hre sem termos que especificar.

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts() //here we grab our deployer account from our namedAccounts in hardhat.config.js, where we sort the different accounts (private keys) we use.
    const chainId = network.config.chainId

    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"] //lindo, super útil. chainId é variável dependendo de qual usarmos no deploy.
    //qualquer que seja a network que usamos em yarn hardhat deploy --network polygon
    //vai automaticamente dar update para a address que queremos. super útil
    //we'll actually use this but in an if:

    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        //or we could do "if (chainId == "31337")"
        const ethUsdAggregator = await deployments.get("MockV3Aggregator") //with hardhat deploy we can get the most recent deployment of "MockV3Aggregator" using a command called "get". we could also do just "get" instead of "deployments.get" and import get from the "deployments" above.
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    // LINDOOOOOOOOOOOOOOOOOOOOOOOOOO!

    // MOCK:
    //here when going for localhost or hardhat network we'll want to use a MOCK:
    //      mocking: an object under test may have dependencies on other objects. to isolate the behavior of the object, you want to replace the other objects by mocks that simulate
    //the behavior of the real objects. Mocking is creating objects that simulate the behaviour of real objects.
    //Here we want to make a fake price feed contract that we can use and control in order to be able to test etc in localhost on hardhat, because they can only work on
    //testnets/mainnets due to their price feeds (and testnets are too slow to use since the beginning of the creation of a project, good to use in the end)

    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        // in hardhat deploy, we deploy just with this deploy function
        from: deployer,
        args: args, //arguments to the constructor of the contract which in this case will be the "price feed address"
        log: true, //custom loging so we dont have to do all that constant console.log stuff that we've been doing this whole time
        waitConfirmations: network.config.blockConfirmations || 1, //we added in harhat.config.js in goerli networks a line for the blockconfirmations. Either that or 1, if there's nothing in hardhat.config.js
        // we are waiting for this many block confirmations (6) because we are giving etherscan a chance to index our transaction
    })

    //to verify the contract on etherscan. we import the verify function from a verify file we created in the "utils" folder
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        // ! means not
        await verify(fundMe.address, args)
    }

    log("------------------------------------------------------")
}

module.exports.tags = ["all", "fundme"] //how can we choose to run only one deploy script?
// we add this tags at module exports and then we can use "yarn hardhat deploy --tags fundme". this way it will only run the deploy script that have a special tag, in this case "fundme"

//But we actually used "yarn hardhat deploy" only without tag, because we wanted to deploy both deploy scripts, that are already in the deploy order we want (due to the file name).
//depois yarn hardhat deploy --network goerli, obviamente

//CONCLUSION:
//We want 00-deploy-mocks.js to be deployed first in order to generate a fake price feed address (due to a fake AggregatorV3Interface.sol contract being deployed), that we input in 01-deploy-fund.me.js
//into the FundMe.sol constructor to deploy the FundMe contract anyway, in cases we want to use the hardhat or localhost.
//In the cases we'll use the testnet or mainnet, the 00-deploy-mock.js won't be deployed, and we'll deploy FundMe.sol using the respective address from helper-hardhat-config.js

//One really nice thing about hardhat deploy is that now, when we run yarn hardhat node to run our own localhost node, hardhat will automatically deploy the deploy scripts
//into our localhost node.
