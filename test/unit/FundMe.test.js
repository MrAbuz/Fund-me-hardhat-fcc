// Unit tests are done locally
// -local hardhat
// -forked hardhat <- we'll talk about this soon

// Staging tests can be done on a testnet (LAST STOP!!!)

//Remember: if I just want to test one test, I can do "yarn hardhat test --grep "amount funded" (in "" add words that are in the description of the one you want and that aren't in other description)
//           and "yarn hardhat coverage" to see how many lines are covered with tests

//                                                                estou a pôr os describes() como async functions como o Patrick mas ele deu a entender que não devíamos
const { deployments, ethers, getNamedAccounts } = require("hardhat") //hardhat is pretty much the same as hre, so we can import deployments/getNamedAccounts from hardhat aswell
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

//this means if developmentChains (hardhat/localhost) doesnt (! in the beginning) include our network (network.name) we skip the describe, if not we do the describe
//So now our unit tests only run on development chains, and our staging tests only run on testnets
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1") // this is the same as typing "1000000000000000000", which is equivalent to 1 eth.

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer //we'll use syntax a bit different but same as "const { deployer } = await getNamedAccounts()" but we needed to initiate deployer outside of this beforeEach scope. Makes total sense the syntax tho!
              /* 
        Another way we can get different accounts from our hardhat.config.js is (in case we see it in the future):
        const accounts = await ethers.getSigners() //it returns whatever is in our account array of our network. If its from default network hardhat it gives a list of 10 fake acconts that we can work with.
        const accountZero = accounts[0]
        */

              await deployments.fixture(["all"])
              //what fixture does is it allows us to basically run our entire deploy folder with as many tags as we want (the module.export.tags we added in the end of the deploy scripts)
              //it will run through our deploy scripts, on our local network, and deploy all of our contracts so we can use them in our scripts/testing.
              // we can deploy everything in our deploy folder with just this one line, isnt that helpful? :)
              //"all" is a tag from the deploy scripts. the tagws allows us to deploy only the deploy scripts that have a certain tag.
              fundMe = await ethers.getContract("FundMe", deployer)
              //this getContract() function is gonna get the most recent deployment of wathever contract we tell it. Quão diferente é isto de deployments.get que usamos no 01-deploy-fund-me.js?
              //with "deployer" here, whenever we call a function in FundMe, it will automatically be from that deployer account. The deployer is already the acc that deploys in the deploy script, so we just add it here to sign the transactions.
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed() //we wanna make sure this getPriceFeed() is gonna be the same as our mockV3Aggregator (since we'll be running our tests locally its the mockV3Aggregator).
                  assert.equal(response, mockV3Aggregator.address) //não percebo ao certo porque é que tem que ter o ".address" mas ok! because we are just comparing if the address is well inputed, and so the same?
              })
          })

          describe("fund", async function () {
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
                  // this transaction "await fundMe.fund()" basically has to fail because we're not sending eth with it. But we want our tests to know that we want it to fail.
                  // this is where our waffle testing comes into play
                  // we could've did this with just "reverted" instead of "revertedWith" + string, but with the string its more precise.
                  // now we have a way either to assert things, or expect things to fail, awesome!
              })

              it("Updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue }) //sendValue is 1 eth. this is the way that we send some value with the transaction
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                      //nice, é assim que interagimos com o mapping
                  )
                  assert.equal(response.toString(), sendValue.toString())
                  //because this response is gonna be the bigNumber version of how much has been funded by that account.
                  //"sendValue" I think returns a bigNumber because of the function we using in the declaration of it to type 1 eth.
                  //probably we should always expect it to be bigNumbers with numbers returning from functions, a thought.
              })

              it("Adds funder to array of getFunder", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(deployer, funder)
              })
          })

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue }) //makes sense to do in beforeEach because every it() will need us to fund the contract before
              })

              it("withdraw ETH from a single funder", async function () {
                  // Arrange, act, assert is a way to think about writing tests. We want to arrange the test, then we wanna act, then run the asserts.
                  // Since this is a bigger test he's explaining this way.

                  // Arrange

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(
                          fundMe.address
                          //balance of the contract after it has been funded with some eth
                      )
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // Act

                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  //we can actually find our gasCost from our transactionReceipt. We created a breakpoint(red dot in the left) and went to "run and debug" feature to know more about transactionReceipt (ver excel para os passos exatos)
                  //Ao vermos que "gasUsed" e "effectiveGasPrice" são variáveis que vêm incluidas no transactionReceipt, podemos obtê-las assim:
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) //ao multiplicarmos obtemos o gasCost. Como sao os dois bigNumbers usamos ".mul", uma bigNumber function.
                  //depois usamos o gasCost no assert final para as nossas contas terem em conta o que foi gasto em gas, para baterem certo.

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Assert

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  //because startingFundMeBalance is calling from the blockchain, its gonna be of type BigNumber. So we wanna use .add() instead of "+"
                  //So numbers are always bigNumbers when we call them from the blockchain? Estou a ver que sim
                  //Because the deployer called the withdraw function it also paid some gas. so we need to add the gasCost aswell for the math to match. And the gasCost is a bigNumber aswell.
                  //We always need to count for the gasCost when making calculations like this.
              })

              it("allows us to withdraw with multiple getFunder", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners() //segunda maneira que explicámos em cima de aceder a mais keys (como getNamedAccounts())
                  for (let i = 1; i < 6; i++) {
                      //we start with 1, because the index 0 will be the deployer
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i] //interessante como aqui é um array de js então já fazem com [], enquanto que ao chamar uma variável array de solidity aqui para o js já escrevo com (), como a getFunder(0).
                      )
                      //we use this .connect because "deployer" is the only account connected to fundMe to make transactions. we need to connect new accounts first, before making transactions with them.
                      //we need to make new objects of the contract connected to this different accounts
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act

                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  //Assert

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // We also want to make sure that the getFunder array is reseted properly:

                  //to make sure the array is reseted, patrick did it like this, which is super smart:
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  //to make sure the mapping is reseted:

                  for (i = 1; i < 6; i++) {
                      const signers = accounts[i].address
                      const getAddressToAmountFunded =
                          await fundMe.getAddressToAmountFunded(signers)
                      assert.equal(getAddressToAmountFunded, 0) //não percebo porque é que aqui não é getAddressToAmountFunded.toString(). será que é por ser 0?
                  }
              })

              it("only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const fundMeConnectedContract = await fundMe.connect(attacker)
                  await expect(
                      fundMeConnectedContract.withdraw()
                  ).to.be.revertedWith(
                      "FundMe__NotOwner" //dava apenas com to.be.reverted mas assim com o erro fica mais explicito que o erro vem do require.
                  )
              })

              it("cheaperWithdraw multiple funders testing...", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners() //segunda maneira que explicámos em cima de aceder a mais keys (como getNamedAccounts())
                  for (let i = 1; i < 6; i++) {
                      //we start with 1, because the index 0 will be the deployer
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i] //interessante como aqui é um array de js então já fazem com [], enquanto que ao chamar uma variável array de solidity aqui para o js já escrevo com (), como a getFunder(0).
                      )
                      //we use this .connect because "deployer" is the only account connected to fundMe to make transactions. we need to connect new accounts first, before making transactions with them.
                      //we need to make new objects of the contract connected to this different accounts
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act

                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  //Assert

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // We also want to make sure that the getFunder array is reseted properly:

                  //to make sure the array is reseted, patrick did it like this, which is super smart:
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  //to make sure the mapping is reseted:

                  for (i = 1; i < 6; i++) {
                      const signers = accounts[i].address
                      const getAddressToAmountFunded =
                          await fundMe.getAddressToAmountFunded(signers)
                      assert.equal(getAddressToAmountFunded, 0) //não percebo porque é que aqui não é getAddressToAmountFunded.toString(). será que é por ser 0?
                  }
              })

              it("cheaperWithdraw single funder testing...", async function () {
                  // Arrange, act, assert is a way to think about writing tests. We want to arrange the test, then we wanna act, then run the asserts.
                  // Since this is a bigger test he's explaining this way.

                  // Arrange

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(
                          fundMe.address
                          //balance of the contract after it has been funded with some eth
                      )
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // Act

                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  //we can actually find our gasCost from our transactionReceipt. We created a breakpoint(red dot in the left) and went to "run and debug" feature to know more about transactionReceipt (ver excel para os passos exatos)
                  //Ao vermos que "gasUsed" e "effectiveGasPrice" são variáveis que vêm incluidas no transactionReceipt, podemos obtê-las assim:
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) //ao multiplicarmos obtemos o gasCost. Como sao os dois bigNumbers usamos ".mul", uma bigNumber function.
                  //depois usamos o gasCost no assert final para as nossas contas terem em conta o que foi gasto em gas, para baterem certo.

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Assert

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  //because startingFundMeBalance is calling from the blockchain, its gonna be of type BigNumber. So we wanna use .add() instead of "+"
                  //So numbers are always bigNumbers when we call them from the blockchain? Estou a ver que sim
                  //Because the deployer called the withdraw function it also paid some gas. so we need to add the gasCost aswell for the math to match. And the gasCost is a bigNumber aswell.
                  //We always need to count for the gasCost when making calculations like this.
              })
          })
      })
// Pensamento: Estou a pensar que o deployer que vem de getNamedAccounts() (assim como as accounts que vêm de ethers.getSigners() que são a mesma coisa ) da forma que percebo
// deviam ser private keys porque acedem como index à array de private keys da sua chain no hardhat.config.js, mas aqui usamos como sendo addresses.

////yarn hardhat test
