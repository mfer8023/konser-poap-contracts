const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// =============================================================
//                    CONTRACT AFTER 8th TX
// =============================================================

describe("(3) KonSerPoap UUPS upgradeable proxy contract after 8th tx state testing scope", function () {
    async function eightTxFixture() {
      /**
       * Init accounts
       * $ npx hardhat node
       * ...
       * Account #7: 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955 is receiver #4
       * Account #8: 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f is receiver #5 
       * Account #9: 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720 is receiver #6 
       * Account #10: 0xBcd4042DE499D14e55001CcbB24a551F3b954096 is receiver #7
       * Account #11: 0x71bE63f3384f5fb98995898A86B02Fb2426c5788 is receiver #8
       * Account #12: 0xFABB0ac9d68B0B445fB7357272Ff202C5651694a is receiver #9
       * Account #13: 0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec is receiver #10
       */
      [
        proxyDeployer, adminRole, minterRole, hasNoRole, receiver1, receiver2, receiver3, receiver4, 
        receiver5, receiver6, receiver7, receiver8, receiver9, receiver10
      ] = await ethers.provider.listAccounts();

      // Init signers
      [_proxyDeployer, _adminRole, _minterRole, _hasNoRole, _receiver1, _receiver2] = await ethers.getSigners();

      // Init fee basis points
      const feeBasisPoints = "250";

      // Init Proxy Contract Instance
      const Implementation = await ethers.getContractFactory("KonSerPoap"); 

      /* 1st tx - proxy contract creation */
      const Proxy = await upgrades.deployProxy(
        Implementation,[proxyDeployer, adminRole, minterRole, feeBasisPoints],
        {kind: "uups", initializerERC721A: "initialize", initializer: "initialize"}
      );

      // Init param args for setPoapURI for PoapId #1
      const existingPoapId1 = 1;
      const existingPoapUri1 = "ipfs://FOO...";

      // Init params args for setPoapURI for PoapId #2
      const existingPoapId2 = 2;
      const existingPoapUri2 = "ipfs://DEaD...";

      // Init params args for airdrop receivers
      const airdropReceivers = [
        receiver1, receiver2, receiver3, receiver4, receiver5, receiver6, receiver7, receiver8, receiver9, receiver10
      ];

      // Init `BURNER_ROLE`
      // bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
      const burner_role = ethers.utils.toUtf8Bytes("BURNER_ROLE");
      const BURNER_ROLE = ethers.utils.keccak256(burner_role);

      /* TXs */

      /* 2nd tx - setPoapURI */
      await Proxy.setPoapURI(existingPoapId1, existingPoapUri1);
      /* 3rd tx - setPoapURI */
      await Proxy.setPoapURI(existingPoapId2, existingPoapUri2);

      // ----------------------------
      // |  poapId  |   poapURI     |
      // ----------------------------
      // |    1     | ipfs://FOO... |       
      // |    2     | ipfs://DEaD...|   
      // ----------------------------

      /* 4th tx - mint */
      await Proxy.mint(receiver1, existingPoapId1);
      /* 5th tx - mint */
      await Proxy.mint(receiver2, existingPoapId1);
      /* 6th tx - mint */
      await Proxy.mint(receiver3, existingPoapId1);

      /* 7th tx - airdrop */
      await Proxy.airdrop(airdropReceivers, existingPoapId2);

      // ------------------------------------
      // |  tokenId |   owner    |  poapId  |
      // ------------------------------------
      // |    1     | receiver1  |    1     |    
      // |    2     | receiver2  |    1     |
      // |    3     | receiver3  |    1     |
      // |    4     | receiver1  |    2     |
      // |    5     | receiver2  |    2     |
      // |    6     | receiver3  |    2     |
      // |    7     | receiver4  |    2     |
      // |    8     | receiver5  |    2     |
      // |    9     | receiver6  |    2     |
      // |    10    | receiver7  |    2     |
      // |    11    | receiver8  |    2     |
      // |    12    | receiver9  |    2     |
      // |    13    | receiver10 |    2     |
      // ------------------------------------

      /* 8th tx - grantRole `BURNER_ROLE` to `proxyDeployer` */
      await Proxy.grantRole(BURNER_ROLE, proxyDeployer);

      return { 
        proxyDeployer, adminRole, minterRole, hasNoRole, receiver1, receiver2, receiver3, receiver4,
        receiver5, receiver6, receiver7, receiver8, receiver9, receiver10, _proxyDeployer, _adminRole,
        _minterRole, _hasNoRole, _receiver1, _receiver2, feeBasisPoints, Proxy, existingPoapId1,
        existingPoapUri1, existingPoapId2, existingPoapUri2, BURNER_ROLE
      };
    }

    // ================ SHOULD RETURN WITH VALUE ===================

    /* RETURN BOOLEAN VALUE */

    /**
     * Check BURNER_ROLE
     * See {AccessControlUpgradeable-hasRole}
     */
    it("Should return with value `true` for `proxyDeployer` as the BURNER_ROLE of the proxy contract", async function () {
        const { proxyDeployer, adminRole, minterRole, hasNoRole, Proxy, BURNER_ROLE } = await loadFixture(eightTxFixture);

        // If `proxyDeployer` should return `true`
        expect(await Proxy.hasRole(BURNER_ROLE, proxyDeployer)).to.be.true;

        /* CROSSCHECK */

        // If `adminRole`, `minterRole`, `hasNoRole` should return `false`
        expect(await Proxy.hasRole(BURNER_ROLE, adminRole)).to.be.false;
        expect(await Proxy.hasRole(BURNER_ROLE, minterRole)).to.be.false;
        expect(await Proxy.hasRole(BURNER_ROLE, hasNoRole)).to.be.false;
    });

    /* RETURN NON-BOOLEAN VALUE */

    /**
     * Check total supply
     * See {ERC721AUpgradeable-totalSupply}
     */
    it("Should return with value `13` (thirteen) for totalSupply()", async function () {
      const { Proxy } = await loadFixture(eightTxFixture);

      // Init expected return value
      let expectedReturnValue = 13;

      expect(await Proxy.totalSupply()).to.equal(expectedReturnValue);
    });

    /**
     * Check poap URI for poapId #1
     * See {KonSerPoap-getPoapURI}
     */
    it("Should return with value `ipfs://FOO...` for getPoapURI(1)", async function () {
        const { Proxy, existingPoapId1, existingPoapUri1 } = await loadFixture(eightTxFixture);

        expect(await Proxy.getPoapURI(existingPoapId1)).to.equal(existingPoapUri1);
    });

    /**
     * Check poap URI for poapId #2
     * See {KonSerPoap-getPoapURI}
     */
    it("Should return with value `ipfs://DEaD...` for getPoapURI(2)", async function () {
        const { Proxy, existingPoapId2, existingPoapUri2 } = await loadFixture(eightTxFixture);

        expect(await Proxy.getPoapURI(existingPoapId2)).to.equal(existingPoapUri2);
    });

    /**
     * Check token URI for tokenId #3
     * See {KonSerPoap-tokenURI}
     */
    it("Should return with value `ipfs://FOO...` for tokenURI(3)", async function () {
        const { Proxy, existingPoapUri1 } = await loadFixture(eightTxFixture);

        // Init existing tokenId
        let existingTokenId = 3;

        expect(await Proxy.tokenURI(existingTokenId)).to.equal(existingPoapUri1);
    });

    /**
     * Check token URI for tokenId #4
     * See {KonSerPoap-tokenURI}
     */
    it("Should return with value `ipfs://DEaD...` for tokenURI(4)", async function () {
        const { Proxy, existingPoapUri2 } = await loadFixture(eightTxFixture);

        // Init existing tokenId
        let existingTokenId = 4;

        expect(await Proxy.tokenURI(existingTokenId)).to.equal(existingPoapUri2);
    });

    /**
     * Check poap ID for tokenId #3
     * See {KonSerPoap-tokenURI}
     */
    it("Should return with value 2 (two) for getPoapId(4)", async function () {
      const { Proxy } = await loadFixture(eightTxFixture);

      // Init existing tokenId
      let existingTokenId = 3;
      // Init expected return value
      let expectedReturnValue = 1;

      expect(await Proxy.getPoapId(existingTokenId)).to.equal(expectedReturnValue);
    });

    /**
     * Check poap ID for tokenId #4
     * See {KonSerPoap-tokenURI}
     */
    it("Should return with value 2 (two) for getPoapId(4)", async function () {
        const { Proxy } = await loadFixture(eightTxFixture);

        // Init existing tokenId
        let existingTokenId = 4;
        // Init expected return value
        let expectedReturnValue = 2;

        expect(await Proxy.getPoapId(existingTokenId)).to.equal(expectedReturnValue);
    });

    /**
     * Get tokensOfOwner from `receiver1`
     * See {KonSerPoap-tokensOfOwner}
     */
    it("Should return with value `[1, 4]` for tokensOfOwner(receiver1)", async function () {
      const { receiver1, receiver10, Proxy } = await loadFixture(eightTxFixture);

      // Init expected return value
      let expectedReturnValue = [1, 4];

      expect(await Proxy.tokensOfOwner(receiver1)).to.deep.equal(expectedReturnValue);

      /* CROSSCHECK */

      // Get tokensOfOwner from `receiver10`
      expect(await Proxy.tokensOfOwner(receiver10)).to.deep.equal([13]);

  });

    // ================ SHOULD EMIT THE EVENT ======================

    /*
     * Update existing poap URI
     * See {KonSerPoap-setPoapURI}
     */
    it("Should emit the event `PoapURIUpdated` for setPoapURI(2, 'ipfs://BeEf...')", async function () {
      const { Proxy, existingPoapId2 } = await loadFixture(eightTxFixture);

      // Init new poap URI
      let updatedPoapUri = "ipfs://BeEf";

      await expect(Proxy.setPoapURI(existingPoapId2, updatedPoapUri))
        .to.be.emit(Proxy, "PoapURIUpdated")
        .withArgs(existingPoapId2, updatedPoapUri);
    });

    /**
     * Call transferFrom operation by `receiver1`
     * See {ERC721AUpgradeable-transferFrom}
     */
    it("Should emit the event `Transfer` for transferFrom(receiver1, receiver2, 4)", async function () {
      const { receiver1, receiver2, _receiver1, Proxy } = await loadFixture(eightTxFixture);

      // `receiver1` transfer tokenId #4 to `receiver2`
      await expect(Proxy.connect(_receiver1)
        .transferFrom(receiver1, receiver2, 4))
        .to.be.emit(Proxy, "Transfer")
        .withArgs(receiver1, receiver2, 4);

      /* CROSSCHECK */

      // Check ownerOf from tokenId #1
      expect(await Proxy.ownerOf(4)).to.equal(receiver2);

      // Check balanceOf from `receiver2`
      expect(await Proxy.balanceOf(receiver2)).to.equal(3);
    });

    /**
     * Call approve operation by `receiver1`
     * See {ERC721AUpgradeable-approve}
     */
    it("Should emit the event `Approval` for approve(proxyDeployer, 1)", async function () {
      const { proxyDeployer, receiver1, receiver2, _receiver1, Proxy } = await loadFixture(eightTxFixture);

      // `receiver1` approve tokenId #1 to `proxyDeployer`
      await expect(Proxy.connect(_receiver1)
        .approve(proxyDeployer, 1))
        .to.be.emit(Proxy, "Approval")
        .withArgs(receiver1, proxyDeployer, 1);

      /* CROSSCHECK */

      // Check getApproved for tokenId #1 should return `proxyDeployer`
      expect(await Proxy.getApproved(1)).to.equal(proxyDeployer);

      // `proxyDeployer` transfer tokenId #1 belongs to `receiver1` to `receiver2`
      await expect(Proxy.transferFrom(receiver1, receiver2, 1))
        .to.be.emit(Proxy, "Transfer")
        .withArgs(receiver1, receiver2, 1);

      // Check ownerOf tokenId #1
      expect(await Proxy.ownerOf(1)).to.equal(receiver2);

      // Check balanceOf from `receiver1`
      expect(await Proxy.balanceOf(receiver1)).to.equal(1);

      // Check balanceOf from `receiver1`
      expect(await Proxy.balanceOf(receiver2)).to.equal(3);
    });

    /**
     * Call setApprovalForAll operation by `receiver1`
     * See {ERC721AUpgradeable-setApprovalForAll}
     */
    it("Should emit the event `ApprovalForAll` for setApprovalForAll(proxyDeployer, true)", async function () {
      const { proxyDeployer, receiver1, receiver3, _receiver1, Proxy } = await loadFixture(eightTxFixture);

      // Init operator
      let operator = proxyDeployer;

      // `receiver1` call setApprovalForAll to `proxyDeployer`
      await expect(Proxy.connect(_receiver1)
        .setApprovalForAll(operator, true))
        .to.be.emit(Proxy, "ApprovalForAll")
        .withArgs(receiver1, operator, true);

      /* CROSSCHECK */

      // Check if `operator` isApprovedForAll by `owner`
      expect(await Proxy.isApprovedForAll(receiver1, operator)).to.be.true;

      // `proxyDeployer` transfer tokenId #1 belongs to `receiver1` to `receiver3`
      await expect(Proxy.transferFrom(receiver1, receiver3, 1))
        .to.be.emit(Proxy, "Transfer")
        .withArgs(receiver1, receiver3, 1);

      // `proxyDeployer` transfer tokenId #4 belongs to `receiver1` to `receiver3`
      await expect(Proxy.transferFrom(receiver1, receiver3, 4))
        .to.be.emit(Proxy, "Transfer")
        .withArgs(receiver1, receiver3, 4);      

      // Check ownerOf tokenId #1 & tokenId #4
      expect(await Proxy.ownerOf(1)).to.equal(receiver3);
      expect(await Proxy.ownerOf(4)).to.equal(receiver3);

      // Check balanceOf from `receiver1`
      expect(await Proxy.balanceOf(receiver1)).to.equal(0);

      // Check balanceOf from `receiver3`
      expect(await Proxy.balanceOf(receiver3)).to.equal(4);
    });

    /**
     * Call bun operation by BURNER_ROLE
     * See {KonSerPoap-burn}
     */
    it("Should emit the event `PoapBurned` for burn(receiver3, 3) by BURNER_ROLE", async function () {
        const { receiver3, _proxyDeployer, Proxy, existingPoapId1 } = await loadFixture(eightTxFixture);

        // Check tokensOfOwner from `receiver3` before burn operation
        // Init expected return value
        let expectedReturnValue = [3, 6];

        expect(await Proxy.tokensOfOwner(receiver3)).to.deep.equal(expectedReturnValue);

        // Init tokenId to be burned
        let burnedTokenId = 3;
  
        // `proxyDeployer` burns tokenId #3 on behalf of `receiver3`
        await expect(Proxy.connect(_proxyDeployer)
          .burn(receiver3, burnedTokenId))
          .to.be.emit(Proxy, "PoapBurned")
          .withArgs(receiver3, existingPoapId1, burnedTokenId);
  
        /* CROSSCHECK */     

        // Check balanceOf from `receiver3`
        expect(await Proxy.balanceOf(receiver3)).to.equal(1);

        // Check tokensOfOwner from `receiver3` after burn operation
        expect(await Proxy.tokensOfOwner(receiver3)).to.deep.equal([6]);
  
        // Check ownerOf from `burnedTokenId`
        await expect(Proxy.ownerOf(burnedTokenId))
          .to.be.revertedWithCustomError(Proxy, "OwnerQueryForNonexistentToken");

        // Check token URI for `burnedTokenId`
        await expect(Proxy.tokenURI(burnedTokenId))
          .to.be.revertedWithCustomError(Proxy, "URIQueryForNonexistentToken")

        // Check total supply should return `12`
        expect(await Proxy.totalSupply()).to.equal(12);
    });

    // ============ SHOULD RETURN WITH CUSTOM ERROR ===============

    /**
     * Call BURN operation by BURNER_ROLE
     * See {KonSerPoap-burn}
     */
    it("Should revert with custom error `InvalidTokenOwner` for burn(receiver4, 3) by BURNER_ROLE", async function () {
        const { receiver4, _proxyDeployer, Proxy } = await loadFixture(eightTxFixture);

        // Init invalid token owner
        let invalidTokenOwner = receiver4;
        // Init tokenId to be burned
        let burnedTokenId = 3;
  
        // `proxyDeployer` burns tokenId #3 on behalf of `receiver3`
        await expect(Proxy.connect(_proxyDeployer)
          .burn(invalidTokenOwner, burnedTokenId))
          .to.be.revertedWithCustomError(Proxy, "InvalidTokenOwner");
    });

    // ============ SHOULD RETURN WITH ERROR MESSAGE ===============

    /**
     * Call transferFrom operation when contract is paused
     * See {ERC721AUpgradeable-transferFrom}
     * See {PausableUpgradeable-_requireNotPaused}
     */
    it("Should revert with error message `Pausable: paused` for transferFrom(receiver1, receiver2, 4)", async function () {
      const { proxyDeployer, receiver1, receiver2, _receiver1, Proxy } = await loadFixture(eightTxFixture);

      // Init pause the contract
      await expect(Proxy.pause())
        .to.be.emit(Proxy, "Paused")
        .withArgs(proxyDeployer);

      // `receiver1` transfer tokenId #4 to `receiver2`
      await expect(Proxy.connect(_receiver1)
        .transferFrom(receiver1, receiver2, 4))
        .to.be.revertedWith("Pausable: paused")
    });
});
