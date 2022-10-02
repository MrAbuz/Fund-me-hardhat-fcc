//This is the tests we are gonna run right before we deploy to a mainnet, the last step in our development. So we're doing the staging on a testnet
//We just want to make sure that everything is working aproximaly correctly on an actual testnet

const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

//this means if developmentChains (hardhat/localhost) includes our testnet (network.name) we skip the describe, if not we do the describe
//So now our unit tests only run on development chains, and our staging tests only run on testnets
developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
              //in our staging tests we're gonna assume its already deployed so we're not gonna do any "fixture" (the function that deploys all the contracts with a certain tag).
          })

          it("allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })

//yarn hardhat deploy --network goerli
//then we run with the staging tests (on the testnet), to make sure everything works with a real price feed on a testnet:
//yarn hardhat test --network goerli
