require("dotenv").config()
require("@nomiclabs/hardhat-etherscan")
require("@nomiclabs/hardhat-waffle")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy")

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "https://eth-goerli"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xkey"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "0xkey"
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "0xkey"

module.exports = {
    solidity: {
        compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
    },
    defaultNetwork: "hardhat",
    networks: {
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [PRIVATE_KEY], //this is one accounts array for goerli
            chainId: 5,
            blockConfirmations: 6, //how many blocks we wanna wait as confirmation.
        },
    },
    gasReporter: {
        //this creates a file when we run 'yarn hardhat test'
        //copy pasted this from our last project (hardhat-simple-storage-fcc)
        enabled: true, //patrick normally disables when he doesn't wanna work with the gas
        outputFile: "gas-report.txt", //to output the gas table to a file
        noColors: true,
        currency: "USD", //best adiction we can do in here -> to know the cost of each function in usd
        coinmarketcap: COINMARKETCAP_API_KEY, //to have a currency here (USD), we actually need to get an api key from coinmarketcap.
        //token: "MATIC", //to use if we were deploying to matic for example. reflects the gas costs in matic, and then matic to usd
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY, //API key obtida na secção de 'API key' do etherscan.io, tenho que dar login, já tenho conta.
    },
    namedAccounts: {
        //we're gonna name each of the spots in the accounts array in the networks. Sao basicamente a lista de contas para eu interagir com a chain no momento,
        //sendo que no sitio de accounts nós já pomos a private key, mas podemos pôr várias private keys para ter mais intervenientes na chain, e queremos categorizá-las
        //para saber quais são quais ao interagir umas com as outras. Se simplesmente estiver [privateKey1, privateKey2, privateKey3] é confuso. Exatamente isto.
        //Muito mais simples com namedAccounts.
        deployer: {
            //this one is named deployer
            default: 0, //here we say that by default the index 0 in the accounts array is the deployer
            // 5: 1, //we can also specify the position for each chain. for example here, chainId 5 = goerli, so here in goerli it assumes the index 1 in the accounts array.
            // 31337: 2 //here in the hardhat chain (chainId = 31337), the deployer assumes the index 2 in the array.
        },
        user: {
            //we can create different users
            default: 1, //position 1 in the account's array for the name user
        },
    },
}
