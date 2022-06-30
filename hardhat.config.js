require("@nomiclabs/hardhat-waffle");
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.2",
  goerli: {
    url: `https://goerli.infura.io/v3/446dcfb1da084731ae066164feea6c24`,
    accounts: ["0x8b0b640b802ccc4a7b1adbb938859644a569a9a71f1025c12e4b104034527b17"],
     gasPrice: 10000000000
  }
};
