# TokenICO

This project is the development of a token ICO (Initial Coin Offering).
ICO's represent the first seliing moment in a token's life. It can be used as an initial fund raising for the project team. You can find more about ICO's here.

This project was developed in order to consolidate my Solidity and Hardhat skills.
I have also developed tests for the contract that you can find on the "test" folder.

The technologies i have used on this project are:

- Solidity - To develop the blockchain smart contracts.

- Ethers - Used in testing to connect to the blockchain.

- Hardhat - To test, compile and deploy the smart contracts.

- Visual Studio Code - To write code.

- GIT - To manage version controls.




## Contract

[TokenICO.sol](https://github.com/Oputo50/TokenICO/blob/main/contracts/TokenICO.sol): This contract will represent the Initial Coin Oferring and token contract at the same time. 
At the moment the following features have been developed:
- Contract admin have the privilege to pause and resume the ICO. (This can be controversial because it can destroy the whole sense of decentralization but it is important to have a Plan B in case the contract gets compromised. This can always be implemented as a DAO or multi-sig to make it way less centralized.)
- Contract deployer can decide the starting date and by default the ICO will end 2 weeks after but you can always change that (see code).
- Contract has a pre-defined hard cap and soft cap. 
- If hard cap is achieved the token sell closes.
- If soft cap is not achieved the ICO investors are refunded. 
- Tokens are locked during the next 2 weeks after the ICO ends to prevent Pump & Dump attacks. (The locked period can also be adjusted on code).
