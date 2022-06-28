//SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./Token.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";

/// @title TokenICO
/// @notice Token Initial Coin Offering implementation
/// @dev Pedro
contract TokenICO is Token, ReentrancyGuard {

     /**
     * @notice Using SafeMath library to prevent integer undeflow and overflow
     */
    using SafeMath for uint256;

    /**
     * @notice ICO administrator
     */
    address public admin;

    /**
     * @notice ICO start date (in block numbers)
     */
    uint256 public startDate;

    /**
     * @notice ICO end date (in block numbers)
     */
    uint256 public endDate;

    /**
     * @notice Tokens start trading time (in block numbers; until this pre-defined blok number, tokens cannot be transfered.)
     */
    uint256 public startTradingDate;

    /**
     * @notice Mapping that will track the deposited amount for each investor address
     */
    mapping(address => uint256) public deposits;

    /**
     * @notice Maximum investment value allowed per address
     */
    uint256 public constant maxInvestment = 5 ether;

    /**
     * @notice Minimum investment allowed per address
     */
    uint256 public constant minInvestment = 0.01 ether;

    /**
     * @notice Token price during the ICO,
     */
    uint256 public constant tokenPrice = 0.001 ether;

    /**
     * @notice Threshold that if met, disabled invest function.
     */
    uint256 public constant hardCap = 10 ether;

    /**
     * @notice Threshold that if is not met, all investors are refunded
     */
    uint256 public constant softCap = 5 ether;

    /**
     * @notice Keeps track of the ICO raised amount
     */
    uint256 public raisedAmount;

    /**
     * @notice To keep track of the ICO state
     */
    enum State {
        beforeRunning,
        running,
        afterEnd,
        halted
    }

    /**
     * @notice State variable that will hold the ICO state value
     */
    State public icoState;

    /**
     * @notice Event emitted every time a user invests on the ICO
     */
    event Invest(address indexed investor, uint256 amount, uint256 tokens);

    /**
     * @notice The TokenICO constructor
     * @param _startDate The block number when the ICO starts
     * @param _name Token name
     * @param _symbol Token symbol
     */
    constructor(
        uint256 _startDate,
        string memory _name,
        string memory _symbol
    ) Token(_name, _symbol) {
        /*
        Assigns variables and calculates the endDate and the startTradingDate (Date that until there token transfers are locked)
        Here i am using 40 and 60 to keep the tests easy to run. You can change these values and to set the endDate to 2 weeks after ICO starts
        you can do  5760 x 14 = 80640. One block takes ~15 seconds to mine, so in one day 5760 blocks are mined.
        We are also minting the amount of tokens that will be available for sell. 
        */
        startDate = _startDate;
        endDate = startDate.add(40); //You can adapt this value to your needs
        startTradingDate = endDate.add(60); // You can adapt this value to your needs
        icoState = State.beforeRunning;
        admin = msg.sender;
        _mint(address(this), 100000);
    }

    /**
     * @notice Modifier that only allows contract admin to execute
     */
    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    /**
     * @notice Admin can stop the ICO in emergency situations
     */
    function halt() public onlyAdmin {
        icoState = State.halted;
    }

    /**
     * @notice Admin can resume the ICO
     */
    function resume() public onlyAdmin {
        icoState = State.running;
    }

    /**
     * @notice Function that returns the current ICO state based on some calculations
     */
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

    /**
     * @notice Function that let users invest in the ICO if they follow the contract rules.
     */
    function invest() public payable nonReentrant returns (bool) {
        icoState = getCurrentState();
        require(icoState == State.running, "ICO is not running");
        require(msg.value > minInvestment, "You have to invest more ether");

        deposits[msg.sender] += msg.value;

        require(
            deposits[msg.sender] <= maxInvestment,
            "You have exceeded the max investment per wallet"
        );

        raisedAmount += msg.value;

        require(raisedAmount <= hardCap, "Ico raised amount was exceeded");
        uint256 tokens = msg.value/tokenPrice;
        _transfer(address(this), msg.sender, tokens);
        emit Invest(msg.sender, msg.value, tokens);
        return true;
    }

    /**
     * @notice Function that can be called by any ICO investor if the ICO goal fails. This will return the invested amounts to the respective investor
     */
    function refund() public nonReentrant returns (bool) {
        uint256 value = deposits[msg.sender];
        icoState = getCurrentState();
        require(value > 0, "Nothing to refund.");
        require(
            icoState == State.afterEnd && raisedAmount < softCap,
            "Conditions not met"
        );

        deposits[msg.sender] = 0;
        payable(msg.sender).transfer(value);
        return true;
    }

    /**
     * @notice Overriden function. Implemented require so that tokens are only tradable after startTradingDate
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokens
    ) public override returns (bool success) {
        require(block.number > startTradingDate);
        super.transferFrom(from, to, tokens);
        return true;
    }

    /**
     * @notice Overriden function. Implemented require so that tokens are only tradable after startTradingDate
     */
    function transfer(address to, uint256 tokens)
        public
        override
        returns (bool success)
    {
        require(block.number > startTradingDate);
        super.transfer(to, tokens);
        return true;
    }

    /**
     * @notice Any amount of ether received by the contract will be automatically used to invest
     */
    receive() external payable {
        invest();
    }

    fallback() external payable {}
}
