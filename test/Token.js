const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

const tokenSymbol = "ICO";

const tokenName = "ICO Token";

describe("TokenICO contract", function () {
  it("Deployment should set the ICO admin, deposit address, Token name and symbol", async function () {

    const [admin] = await ethers.getSigners();

    const startDate = (await ethers.provider.getBlockNumber() + 20);

    const Ico = await ethers.getContractFactory("TokenICO");

    const tokenIco = await Ico.deploy(startDate, tokenName, tokenSymbol);

    let name = await tokenIco.name();

    let symbol = await tokenIco.symbol();

    let icoAdmin = await tokenIco.admin();


    //Checks if contract deployments sets state variables correctly
    expect(name).to.equal(tokenName);
    expect(symbol).to.equal(tokenSymbol);
    expect(icoAdmin).to.equal(admin.address);
    expect(await tokenIco.balanceOf(tokenIco.address)).to.equal(100000);


  });

  it("Should change ICO state after startTime is reached and until that, users can't buy tokens", async () => {
    const [admin, investor] = await ethers.getSigners();

    const startDate = (await ethers.provider.getBlockNumber() + 20);

    const Ico = await ethers.getContractFactory("TokenICO");

    const tokenIco = await Ico.deploy(startDate, tokenName, tokenSymbol);

    const investAmount = ethers.utils.parseEther("1");

    const tokenPrice = ethers.utils.formatEther(await tokenIco.tokenPrice());

    //Testing ICO block number logic for time calculations
    for (let index = 0; index < 10; index++) {
      await ethers.provider.send('evm_mine');
    }

    let icoState = await tokenIco.getCurrentState();

    expect(icoState).to.equal(0);
    await expect(tokenIco.connect(investor).invest({ from: investor.address, value: investAmount })).to.be.reverted;

    for (let index = 0; index < 10; index++) {
      await ethers.provider.send('evm_mine');
    }

    let icoStateAfter = await tokenIco.connect(investor).getCurrentState();
    let tokensMinted = ethers.utils.formatEther(investAmount) / tokenPrice;
    expect(icoStateAfter).to.equal(1);

    //Testing invest function functionality
    await expect(tokenIco.connect(investor).invest({ from: investor.address, value: ethers.utils.parseEther("1") })).to.emit(tokenIco, "Invest").withArgs(investor.address, investAmount, tokensMinted);

    //Checks if deposit address balance have incremented according to sent ether
    await expect(await ethers.provider.getBalance(tokenIco.address)).to.equal(investAmount);
  })

  it("should revert if a wallet reaches the max investment value", async () => {
    const [admin, investor] = await ethers.getSigners();

    const startDate = (await ethers.provider.getBlockNumber() + 20);

    const Ico = await ethers.getContractFactory("TokenICO");

    const tokenIco = await Ico.deploy(startDate, tokenName, tokenSymbol);

    let maxInvestment = await tokenIco.maxInvestment();

    maxInvestment = Number(ethers.utils.formatEther(maxInvestment));

    maxInvestment += 1;

    maxInvestment = ethers.utils.parseEther(maxInvestment.toString());

    for (let index = 0; index < 20; index++) {
      await ethers.provider.send('evm_mine');
    }

    await expect(tokenIco.connect(investor).invest({ from: investor.address, value: maxInvestment })).to.be.reverted;
  })

  it("should revert if ICO hardCap was reached", async () => {
    const [admin, investor1, investor2, investor3] = await ethers.getSigners();

    const startDate = (await ethers.provider.getBlockNumber() + 20);

    const Ico = await ethers.getContractFactory("TokenICO");

    const tokenIco = await Ico.deploy(startDate, tokenName, tokenSymbol);

    tokenIco.connect(investor1).invest({ from: investor1.address, value: ethers.utils.parseEther("5") });

    tokenIco.connect(investor2).invest({ from: investor2.address, value: ethers.utils.parseEther("5") });

    await expect(tokenIco.connect(investor3).invest({ from: investor3.address, value: ethers.utils.parseEther("10") })).to.be.reverted;

  })

  it("should revert if ICO has finished", async () => {
    const [admin, investor] = await ethers.getSigners();

    const startDate = (await ethers.provider.getBlockNumber());

    const Ico = await ethers.getContractFactory("TokenICO");

    const tokenIco = await Ico.deploy(startDate, tokenName, tokenSymbol);

    for (let index = 0; index < 50; index++) {
      await ethers.provider.send('evm_mine');
    }

    await expect(tokenIco.connect(investor).invest({ from: investor.address, value: ethers.utils.parseEther("5") })).to.be.reverted;
    await expect(await tokenIco.getCurrentState()).to.be.equal(2);
  })

  it("should refund all wallets if soft cap is not reached by the end of the ICO", async () => {
    const [admin, investor1, investor2] = await ethers.getSigners();

    const startDate = (await ethers.provider.getBlockNumber() + 20);

    const Ico = await ethers.getContractFactory("TokenICO");

    const tokenIco = await Ico.deploy(startDate, tokenName, tokenSymbol);

    for (let index = 0; index < 25; index++) {
      await ethers.provider.send('evm_mine');
    }

    await tokenIco.connect(investor1).invest({ from: investor1.address, value: ethers.utils.parseEther("2") });

    await tokenIco.connect(investor2).invest({ from: investor2.address, value: ethers.utils.parseEther("2") });

    let i1BalanceAfterInvest = await ethers.provider.getBalance(investor1.address);

    let i2BalanceAfterInvest = await ethers.provider.getBalance(investor2.address);

    for (let index = 0; index < 40; index++) {
      await ethers.provider.send('evm_mine');
    }

    await tokenIco.connect(investor1).refund({ from: investor1.address });
    await tokenIco.connect(investor2).refund({ from: investor2.address });

    let i1BalanceAfterRefund = await ethers.provider.getBalance(investor1.address);

    let i2BalanceAfterAfterRefund = await ethers.provider.getBalance(investor2.address);

    expect(Number(i1BalanceAfterRefund)).to.be.greaterThan(Number(i1BalanceAfterInvest)); // Invested amount is returned to investor1
    expect(Number(i2BalanceAfterAfterRefund)).to.be.greaterThan(Number(i2BalanceAfterInvest)); // Invested amount is returned to investor2
    expect(await ethers.provider.getBalance(tokenIco.address)).be.equal(0);

  })

  it("Should revert if users try to trade tokens before tradingStartTime", async () => {
    const [admin, investor1, investor2] = await ethers.getSigners();

    const startDate = (await ethers.provider.getBlockNumber() + 20);

    const investAmount = ethers.utils.parseEther("1");

    const Ico = await ethers.getContractFactory("TokenICO");

    const tokenIco = await Ico.deploy(startDate, tokenName, tokenSymbol);

    for (let index = 0; index < 30; index++) {
      await ethers.provider.send('evm_mine');
    }

    await tokenIco.connect(investor1).invest({ from: investor1.address, value: investAmount });

    await expect(tokenIco.connect(investor1).transfer(investor2.address, 1)).to.be.reverted;
  })

  it("Should revert if ICO was halted by admin and execute if then resumed", async() =>{

    const [admin, investor] = await ethers.getSigners();

    const startDate = (await ethers.provider.getBlockNumber() + 1);

    const investAmount = ethers.utils.parseEther("1");

    const Ico = await ethers.getContractFactory("TokenICO");

    const tokenIco = await Ico.deploy(startDate, tokenName, tokenSymbol);

    await tokenIco.connect(admin).halt();

    let icoState = await tokenIco.getCurrentState();

    await expect(tokenIco.connect(investor).invest({from: investor.address, value: investAmount })).to.be.reverted;
    expect(icoState).to.equal(3);

    await tokenIco.connect(admin).resume();
    
    let icoStateAfterResume = await tokenIco.getCurrentState();

    await tokenIco.connect(investor).invest({from: investor.address, value: investAmount});

    expect(icoStateAfterResume).to.be.equal(1);
    expect(await ethers.provider.getBalance(tokenIco.address)).to.equal(investAmount);
    
  })

  it("Should revert if users try to trade tokens before startTradingDate", async() => {

    const [admin, investor] = await ethers.getSigners();

    const startDate = (await ethers.provider.getBlockNumber() + 1);

    const investAmount = ethers.utils.parseEther("1");

    const Ico = await ethers.getContractFactory("TokenICO");

    const tokenIco = await Ico.deploy(startDate, tokenName, tokenSymbol);

    for (let index = 0; index < 30; index++) {
      await ethers.provider.send('evm_mine');
    }

    await tokenIco.connect(investor).invest({from: investor.address, value: investAmount});

    await expect(tokenIco.connect(investor).transfer(admin.address,1,{from:investor.address})).to.be.reverted;

    for (let index = 0; index < 80; index++) {
      await ethers.provider.send('evm_mine');
    }

    await tokenIco.connect(investor).transfer(admin.address,1,{from:investor.address});

    await expect(await tokenIco.connect(admin).balanceOf(admin.address)).to.equal(1);

  })
});