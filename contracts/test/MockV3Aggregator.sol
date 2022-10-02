// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@chainlink/contracts/src/v0.6/tests/MockV3Aggregator.sol";

//this is a mock of the AggregatorV3Interface.sol, means we'll just deploy this to input the address as a data feed address that will have the same functions etc as the real data feeds.
//chainlink already has this mock builted out, so we just import it. remember, this is exactly the same as copy pasting the contract into our project
//we could've copy pasted but it had an import "..//" which with ".." means it needs a file thats in that directory and we wouldnt have by copy pasting.
//So we import it and it imports both to our node_modules. Achei importante e nice.
//Compiled this, but I think it auto compiles when we deploy, but we compiled.
