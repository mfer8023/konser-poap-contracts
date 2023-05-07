const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// =============================================================
//                 PROXY CONTRACT AFTER 2ND TX
// =============================================================

describe("(2) KonSerPoap UUPS upgradeable proxy contract after 2nd tx state testing scope", function () {
    async function secondTxFixture() {
        // Init accounts
        [proxyDeployer, adminRole, minterRole, hasNoRole, receiver1, receiver2, receiver3] = await ethers.provider.listAccounts();
  
        // Init signers
        [_proxyDeployer, _adminRole, _minterRole, _hasNoRole, _receiver1] = await ethers.getSigners();
  
        // Init fee basis points
        const feeBasisPoints = "250";
  
        // Init Proxy Contract Instance
        const Implementation = await ethers.getContractFactory("KonSerPoap"); 

        /* 1st tx - proxy contract creation */
        const Proxy = await upgrades.deployProxy(
          Implementation,[proxyDeployer, adminRole, minterRole, feeBasisPoints],
          {kind: "uups", initializerERC721A: "initialize", initializer: "initialize"}
        );
  
        // Init params args for setPoapURI for poapId #1
        const existingPoapId1 = 1;
        const existingPoapUri1 = "ipfs://FOO...";
  
        /* 2nd tx - setPoapURI */
        await Proxy.setPoapURI(existingPoapId1, existingPoapUri1);
  
        // ----------------------------
        // |  poapId  |   poapURI     |
        // ----------------------------
        // |    1     | ipfs://FOO... |        
        // ----------------------------
  
        return { 
          proxyDeployer, adminRole, minterRole, hasNoRole, receiver1, receiver2, receiver3, _proxyDeployer,
          _adminRole, _minterRole, _hasNoRole, _receiver1, feeBasisPoints, Proxy, existingPoapId1, existingPoapUri1 
        };
    }
  
    // ================ SHOULD RETURN WITH VALUE ===================
  
    /**
     * Check get poap URI
     * See {KonSerPoapB-getPoapURI}
     */
    it("Should return with value `ipfs://FOO...` for getPoapURI(1)", async function () {
        const { Proxy, existingPoapId1, existingPoapUri1 } = await loadFixture(secondTxFixture);
  
        expect(await Proxy.getPoapURI(existingPoapId1)).to.equal(existingPoapUri1);
    });
  
    // ================ SHOULD EMIT THE EVENT ======================
  
    /*
     * Update existing poap URI by ADMIN_ROLE
     * See {KonSerPoap-setPoapURI}
     */
    it("Should emit the event `PoapURIUpdated` for setPoapURI(1, 'ipfs://BAR...') by ADMIN_ROLE", async function () {
        const { _adminRole, Proxy, existingPoapId1 } = await loadFixture(secondTxFixture);
  
        // Init new POAP URI
        let updatedPoapUri1 = "ipfs://BAR...";
  
        // setPoapURI by ADMIN_ROLE
        await expect(Proxy.connect(_adminRole)
          .setPoapURI(existingPoapId1, updatedPoapUri1))
          .to.be.emit(Proxy, "PoapURIUpdated")
          .withArgs(existingPoapId1, updatedPoapUri1);
  
        /* CROSSCHECK */
  
        // Get poap URI should return `updatedPoapUri1`
        expect(await Proxy.getPoapURI(existingPoapId1)).to.equal(updatedPoapUri1);
    });
  
    /**
     * Call FIRST mint operation by MINTER_ROLE
     * See {KonSerPoap-mint}
     */
    it("Should emit the event `PoapMinted` for mint(receiver1, 1) by MINTER_ROLE", async function () {
        const { receiver1, _minterRole, Proxy, existingPoapId1, existingPoapUri1 } = await loadFixture(secondTxFixture);
  
        // Init expected start token ID of entire collection is `1` (one)
        let expectedFirstTokenId = 1;
        
        // Mint by MINTER_ROLE
        await expect(Proxy.connect(_minterRole)
          .mint(receiver1, existingPoapId1))
          // event PoapMinted(address indexed receiver, uint256 poapId, uint256 tokenId);
          .to.be.emit(Proxy, "PoapMinted")
          .withArgs(receiver1, existingPoapId1, expectedFirstTokenId);
  
        /* CROSSCHECK */
  
        // Total supply (number of existing tokens) in the contract should return `1`
        expect(await Proxy.totalSupply()).to.equal(1);
  
        // tokenURI should return `existingPoapUri1`
        expect(await Proxy.tokenURI(expectedFirstTokenId)).to.equal(existingPoapUri1);
  
        // ownerOf should return `receiver1`
        expect(await Proxy.ownerOf(expectedFirstTokenId)).to.equal(receiver1);
    });
  
    /**
     * Call FIRST airdrop operation by MINTER_ROLE
     * See {KonSerPoap-airdrop}
     */
    it("Should emit the event `PoapDropped` for airdrop([receiver1,receiver2,receiver3], 1) by MINTER_ROLE", async function () {
        const { receiver1, receiver2, receiver3, _minterRole, Proxy, existingPoapId1, existingPoapUri1 } = await loadFixture(secondTxFixture);
  
        // Init receivers
        let receivers = [receiver1, receiver2, receiver3];
        // Init expected start token ID to be minted
        let expectedStartTokenId = 1;
        
        // Airdrop by MINTER_ROLE
        await expect(Proxy.connect(_minterRole)
          .airdrop(receivers, existingPoapId1))
          // event PoapDropped(address[] receivers, uint256 poapId, uint256 startTokenId, uint256 totalMinted);
          .to.be.emit(Proxy, "PoapDropped")
          .withArgs(receivers, existingPoapId1, expectedStartTokenId, 3);
  
        /* CROSSCHECK */
  
        // Total supply should return `3`
        expect(await Proxy.totalSupply()).to.equal(3);
  
        /// Check tokenURI for
        // tokenId #1
        expect(await Proxy.tokenURI(expectedStartTokenId)).to.equal(existingPoapUri1);
        // tokenId #2 (increment +1 from previous tokenId)
        expect(await Proxy.tokenURI(expectedStartTokenId + 1)).to.equal(existingPoapUri1);
        // tokenId #3
        expect(await Proxy.tokenURI(expectedStartTokenId + 2)).to.equal(existingPoapUri1);
  
        /// Check ownerOf for
        // tokenId #1
        expect(await Proxy.ownerOf(expectedStartTokenId)).to.equal(receiver1);
        // tokenId #2
        expect(await Proxy.ownerOf(expectedStartTokenId + 1)).to.equal(receiver2);
        // tokenId #3
        expect(await Proxy.ownerOf(expectedStartTokenId + 2)).to.equal(receiver3);
    });
});
