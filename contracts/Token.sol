//SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {

    address public founder;

   constructor(string memory _name, string memory _symbol) ERC20(_name,_symbol){
    founder = msg.sender;
   }

}