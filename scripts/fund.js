//we're creating this script so that in the future if we want to "fund on of our contracts" really quickly we can just run this:

const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("Funding Contract...")
    const transactionResponse = await fundMe.fund({
        value: ethers.utils.parseEther("0.1"),
    })
    await transactionResponse.wait(1)
    console.log("Funded!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })

//fizemos yarn hardhat node (para criar um localhost node) (a localhost node dá deploy automaticamente dos ficheiros deploy que temos quando é iniciada)
//depois carregámos no + do lado direito do terminal para abrir um novo terminal, e termos dois em simultâneo, em que um corre o localhost node.
//yarn hardhat run scripts/fund.js --network localhost
//we funded the contract with this script and left the localhost node open (the terminal there) so that we could withdraw the funds with the other script.
