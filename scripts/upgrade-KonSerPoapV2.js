const { ethers,upgrades } = require("hardhat");

async function main() { 
  // IF needed

  // Polygon Mainnet
  // const PROXY_ADDRESS = "0x5D1473dDFacB856FAfE2051e92Be7BDA564F28F7";
  
  const newImplementation = await ethers.getContractFactory("KonSerPoapV2");
  await upgrades.upgradeProxy(
    PROXY_ADDRESS,
    newImplementation,
    {
      initializer: "initializeV2"
    }
  );

  console.log("Implementation Contract is upgraded.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
