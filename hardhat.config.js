require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require("dotenv").config();

const { 
  API_URL_MATIC,
  POLYGONSCAN_API_KEY,
  PRIVATE_KEY_KONSER_DEPLOYER,
  REPORT_GAS,
  COINMARKETCAP_API_KEY 
} = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000,
      },
    },
  },

  networks: {
    matic: {
      url: API_URL_MATIC,
      accounts: [`0x${PRIVATE_KEY_KONSER_DEPLOYER}`]
    },
  },

  etherscan: {
    apiKey: {
      polygon: POLYGONSCAN_API_KEY
    },
  },

  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? true : false,
    currency: "ETH",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  }
};
