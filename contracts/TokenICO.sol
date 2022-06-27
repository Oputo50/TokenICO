//SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./Token.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract TokenICO is Token, ReentrancyGuard{
    address public admin;
    uint256 public startDate;
    uint256 public endDate;
    uint256 public startTradingDate;
    mapping(address => uint256) deposits;
    uint256 public maxInvestment = 5 ether;
    uint256 public minInvestment = 0.01 ether;
    uint256 public tokenPrice = 0.001 ether;
    uint256 public hardCap = 10 ether;
    uint256 public softCap = 5 ether;
    uint256 public raisedAmount;

    enum State {
        beforeRunning,
        running,
        afterEnd,
        halted
    }

    State public icoState;

    event Invest(address indexed investor, uint256 amount, uint256 tokens);

    constructor(
        uint256 _startDate,
        string memory _name,
        string memory _symbol
    ) Token(_name, _symbol) {
        startDate = _startDate;
        endDate = startDate + (40); //One block takes 15 seconds to mine, so in one day 5760 blocks are mined. 5760 x 14 = 80640 (2 weeks)
        startTradingDate = endDate + 60; // 2 weeks after ICO ends
        icoState = State.beforeRunning;
        admin = msg.sender;
        _mint(address(this), 100000);
    }

    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    function halt() public onlyAdmin {
        icoState = State.halted;
    }

    function resume() public onlyAdmin {
        icoState = State.running;
    }


    function getCurrentState() public view returns (State) {
        if (icoState == State.halted) {
            return State.halted;
        } else if (block.number < startDate) {
            return State.beforeRunning;
        } else if (block.number > startDate && block.number < endDate) {
            return State.running;
        } else {
            return State.afterEnd;
        }
    }

    function invest() public payable nonReentrant returns (bool) {
        icoState = getCurrentState();
        require(icoState == State.running, "ICO is not running");
        require(msg.value > minInvestment, "You have to invest more ether");

        deposits[msg.sender] += msg.value;

        require( deposits[msg.sender] <= maxInvestment, "You have exceeded the max investment per wallet");

        raisedAmount += msg.value;

        require(raisedAmount <= hardCap, "Ico raised amount was exceeded");
        uint256 tokens = msg.value / tokenPrice;
        _transfer(address(this),msg.sender,tokens);
        emit Invest(msg.sender, msg.value, tokens);
        return true;
    }

    function refund() public nonReentrant returns (bool){
        uint value = deposits[msg.sender];
        icoState = getCurrentState();
        require(value > 0,"Nothing to refund.");
        require(icoState == State.afterEnd && raisedAmount < softCap,"Conditions not met");
        
        deposits[msg.sender] = 0;
        payable(msg.sender).transfer(value);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokens
    ) public override returns (bool success) {
        require(block.number > startTradingDate);
        super.transferFrom(from, to, tokens);
        return true;
    }

    function transfer(address to, uint256 tokens)
        public
        override
        returns (bool success)
    {
        require(block.number > startTradingDate);
        super.transfer(to, tokens);
        return true;
    }

    receive() external payable {
        invest();
    }

    fallback() external payable {
      }
}
