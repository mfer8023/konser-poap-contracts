const { ethers, upgrades } = require("hardhat");

async function main() {
  // Initializer parameter arguments
  const CONTRACT_NAME = "KonSerPoap"
  const DEPLOYER_ADDRESS =  "0xF86297cB2a5976C0F3Dc482212313d878f31aB05";   // KonSer Deployer 
  const ADMIN_ADDRESS =  "0x33AB037d48f0aDdCb87d53000d8c344113DF296f";      // KonSer Admin
  const MINTER_ADDRESS = "0x8A72e37153Fae0bE53095D445DE340F8032c2c50";      // KonSer Minter
  const FEE_BASIS_POINTS = "250";                                           // _initFeeBasisPoints

  const Implementation = await ethers.getContractFactory(CONTRACT_NAME); 
  const Proxy = await upgrades.deployProxy(
    Implementation,
    [
      DEPLOYER_ADDRESS,                
      ADMIN_ADDRESS,           
      MINTER_ADDRESS,             
      FEE_BASIS_POINTS      
    ],
    { 
      kind: "uups",
      initializerERC721A: "initialize",
      initializer: "initialize",
    }
  );
  await Proxy.deployed();

  console.log(`Proxy Contract is deployed to: ${Proxy.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
