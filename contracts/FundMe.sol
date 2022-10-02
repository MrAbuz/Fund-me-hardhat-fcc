// SPDX-License-Identifier: MIT
//Pragma
pragma solidity ^0.8.8;
//Imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol"; //Estava-me a dar bug importar este npm da chainlink contracts. Tive que fazer yarn add --dev @chainlink/contracts, em que (do que percebi)
//@chainlink contracts é o folder no npm que quero ir buscar este import e pôr depois de yarn add --dev, noutro caso será o folder que aparecer logo a seguir a import.

//we applied the solidity style guide here to tweak the contract to make it look professional: https://docs.soliditylang.org/en/latest/style-guide.html
//this style guide gives best practises to follow for our code:

// 1) One of those is order of layout (Typed the order along the code):
//See which order of things should be in the global scope; (pragma -> import -> interfaces -> libraries -> contracts). its this ones, he added error codes before contracts
//and which order of things we should have inside our contract (declarations -> state variables -> events -> modifiers -> functions).
//and the order for our functions: (constructor -> receive -> fallback -> external -> public -> internal -> private -> view/pure)
//can also check the link above and ctrl f with "order of layout"

// 2) typing the name of the contract as a prefix in the error's name
//we're not gonna apply this in full force in the next contracts, but its good to know
//also the names of the variables, but we'll change and learn this later because the changes are based on things that we dont know yet, but its a best practise to follow the lines

// 3) Natspec -> Ethereum Natural Language Specification Format
//adding notes in our code in a certain syntax with "/** *  */" like we're doing before the "contract FundMe{".
//The reason we wanna add this tags is because we can use Natspec to automatically create documentation for us
//We can use this netpsec for as many or as few functions as we'd like. Most of us probably wont be making documentation so we really just wanna be following this
//guideline if we think some function or some section of our code is a little bit tricky for other developers.
//we can use in functions and take out @title and @author, and just @notice and @dev, and add @params and explain what does the parameters do, and @return and explain what does it returns.

//For gas optimizations:
//We added prefix i_ for immutable; s_ for storage; CAPS with _ for constant; so we know what memory we using when writing each line;
//We started reducing the times we call storage variables by creating memory variables inside function just like the storage one and reading/modifying it, then modify the storage one one time in the end if needed;
//We altered the visibility of the variables cuz internal, private and external variables are cheaper. Anybody can read them of the chain anyways even if they're not public, through storage.
//                for this, we got some variables to private and created 'get' functions for them, which makes everything cheaper (não esquecer) and with the exact same functionality.
//                2nd reason we created 'get" functions for the variables was that since we added i_ and s_ to the variables (and thats super useful for us) and thats confusing for the regular user to read, we created get functions which make it simple for a user to interact with the contract.
//One more gas optimization that we didn't do but he said we could do if we want and should do in future projects is to replace the requires for our reverts with errors, because
//with reverts + errors we dont need to store strings. The error codes are a much cheaper way to announce the error.
//Ele não disse mas na função de call que usamos para fazer transfers tbm usamos require e acho que tbm devemos mudar para if revert + error, faz sentido e acho que já vi assim.

//Error Codes
error FundMe__NotOwner(); //best practise: to type the name of the contract as prefix to the error (with 2 underscoreS) so the end user knows which contract is giving an error, which is

//specially usefull for complex transactions that involve multiple contracts.

/** @title A contract for crowd funding
 * @author Patrick Collins
 * @notice This contract is to demo a sample funding contracts
 * @dev (tag for a note specific to developers) This implements price feeds as our library
 */
contract FundMe {
    //Type Declarations (we dont really have any except for the fact that we using PriceConverter for our uint256)
    using PriceConverter for uint256;

    //State Variables:
    //memory variables, constant variables and immutable variables don't go in storage.
    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;
    address private immutable i_owner;
    uint256 public constant MINIMUM_USD = 50 * 10**18;
    AggregatorV3Interface public s_priceFeed; //this s_priceFeed now is variable and modularized based on any price feed address we want to input in the constructor

    //Modifiers:
    modifier onlyOwner() {
        // require(msg.sender == owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    //Functions (order: constructor -> receive -> fallback -> external -> public -> internal -> private -> view/pure)

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        );
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public payable onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        // // transfer
        // payable(msg.sender).transfer(address(this).balance);
        // // send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");
        // call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        //lets make the same function as withdraw() but a lot more gas efficient
        //mappings can't be in memory, sorry! if they could, we would create a memory mapping like we doing with the memory array!
        //copiamos a storage array para uma memory array e fizemos com que todas as leituras que eram feitas à storage array (custa imenso gas), fossem feitas à memory array
        address[] memory funders = s_funders;

        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);

        //alterámos aqui para i_owner, mais seguro.
        (bool callSuccess, ) = payable(i_owner).call{
            value: address(this).balance
        }("");
        require(callSuccess);
        //ele não usou aqui o ,"Call failed") no fim do require, se calhar também poupa algum gas não incluir a string que ele da ultima vez falou que era uma das razões
        //para termos começado a usar if com erro em vez de require.
    }

    // View/Pure:

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
