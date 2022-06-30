async function main() {
    const [deployer] = await ethers.getSigners();

    const tokenSymbol = "ICO";

    const tokenName = "ICO Token";

    const startDate = (await ethers.provider.getBlockNumber() + 20);

    console.log(ethers, deployer);
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const Token = await ethers.getContractFactory("TokenICO");
    const token = await Token.deploy(startDate,tokenName,tokenSymbol);
    await token.deployed();
  
    console.log("Token address:", token.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });