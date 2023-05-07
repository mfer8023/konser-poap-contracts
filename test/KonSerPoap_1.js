const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// =============================================================
//                PROXY CONTRACT AT INITIAL STATE
// =============================================================

describe("(1) KonSerPoap UUPS upgradeable proxy contract initial state testing scope", function () {
    // See https://hardhat.org/hardhat-runner/docs/guides/test-contracts#using-fixtures
    async function deployProxyContractFixture() {
        /**
         * Init accounts
         * $ npx hardhat node
         * Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 is proxy deployer/owner/default admin
         * Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 is admin role 
         * Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC is minter role 
         * Account #3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 is has no role
         * Account #4: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 is receiver #1
         * Account #5: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc is receiver #2
         * Account #6: 0x976EA74026E726554dB657fA54763abd0C3a0aa9 is receiver #3
         * and so on...
         */
        [proxyDeployer, adminRole, minterRole, hasNoRole, receiver1, receiver2, receiver3] = await ethers.provider.listAccounts();

        // Init signers
        [_proxyDeployer, _adminRole, _minterRole, _hasNoRole] = await ethers.getSigners();

        // Init fee basis points
        const feeBasisPoints = "250";

        // Init proxy contract instance
        const Implementation = await ethers.getContractFactory("KonSerPoap"); 

        /* 1st tx - proxy contract creation */
        const Proxy = await upgrades.deployProxy(
          Implementation,[proxyDeployer, adminRole, minterRole, feeBasisPoints],
          {kind: "uups", initializerERC721A: "initialize", initializer: "initialize"}
        );

        return { 
          proxyDeployer, adminRole, minterRole, hasNoRole, receiver1, receiver2, receiver3, _proxyDeployer,
          _adminRole, _minterRole, _hasNoRole, feeBasisPoints, Proxy 
        };
    }

    // ================ SHOULD RETURN WITH VALUE ===================

    /* RETURN BOOLEAN VALUE */

    /**
     * Check DEFAULT_ADMIN_ROLE
     * See {AccessControlUpgradeable-hasRole}
     */
    it("Should return with value `true` for `proxyDeployer` as the DEFAULT_ADMIN_ROLE of the proxy contract", async function () {
        const { proxyDeployer, adminRole, minterRole, hasNoRole, Proxy } = await loadFixture(deployProxyContractFixture);
    
        // bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
        // https://docs.ethers.org/v5/api/utils/strings/#utils-formatBytes32
        let DEFAULT_ADMIN_ROLE = ethers.utils.formatBytes32String(0x00);

        // If `proxyDeployer` should return `true`
        expect(await Proxy.hasRole(DEFAULT_ADMIN_ROLE, proxyDeployer)).to.be.true;

        /* CROSSCHECK */

        // If `adminRole`, `minterRole`, `hasNoRole` should return `false`
        expect(await Proxy.hasRole(DEFAULT_ADMIN_ROLE, adminRole)).to.be.false;
        expect(await Proxy.hasRole(DEFAULT_ADMIN_ROLE, minterRole)).to.be.false;
        expect(await Proxy.hasRole(DEFAULT_ADMIN_ROLE, hasNoRole)).to.be.false;
    });

    /**
     * Check ADMIN_ROLE
     * See {AccessControlUpgradeable-hasRole}
     */
    it("Should return with value `true` for `proxyDeployer` & `adminRole` as the ADMIN_ROLE of the proxy contract", async function () {
        const { proxyDeployer, adminRole, minterRole, hasNoRole, Proxy } = await loadFixture(deployProxyContractFixture);

        // bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
        // https://docs.ethers.org/v5/api/utils/strings/#utils-toUtf8Bytes
        let admin_role = ethers.utils.toUtf8Bytes("ADMIN_ROLE");
        let ADMIN_ROLE = ethers.utils.keccak256(admin_role);

        // If `proxyDeployer`, `adminRole` should return `true`
        expect(await Proxy.hasRole(ADMIN_ROLE, proxyDeployer)).to.be.true;
        expect(await Proxy.hasRole(ADMIN_ROLE, adminRole)).to.be.true;
        
        /* CROSSCHECK */

        // If `minterRole`, `hasNoRole` should return `false`
        expect(await Proxy.hasRole(ADMIN_ROLE, minterRole)).to.be.false;
        expect(await Proxy.hasRole(ADMIN_ROLE, hasNoRole)).to.be.false;
    });

    /**
     * Check MINTER_ROLE
     * See {AccessControlUpgradeable-hasRole}
     */
    it("Should return with value `true` for `proxyDeployer` & `adminRole` as the MINTER_ROLE of the proxy contract", async function () {
        const { proxyDeployer, adminRole, minterRole, hasNoRole, Proxy } = await loadFixture(deployProxyContractFixture);

        // bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
        let minter_role = ethers.utils.toUtf8Bytes("MINTER_ROLE");
        let MINTER_ROLE = ethers.utils.keccak256(minter_role);

        // If `proxyDeployer`, `minterRole` should return `true`
        expect(await Proxy.hasRole(MINTER_ROLE, proxyDeployer)).to.be.true;
        expect(await Proxy.hasRole(MINTER_ROLE, minterRole)).to.be.true;

        // If `adminRole`, `hasNoRole` should return `false`
        expect(await Proxy.hasRole(MINTER_ROLE, adminRole)).to.be.false;
        expect(await Proxy.hasRole(MINTER_ROLE, hasNoRole)).to.be.false;
    });

    /**
     * Check supports interface for ERC165, ERC721, ERC721Metadata, ERC2981 interface IDs
     * See {ERC721AUpgradeable-supportsInterface}
     */
    it("Should return with value `true` for supportsInterface() with (ERC165 / ERC721 / ERC721Metadata / ERC2981)'s interface ID", async function () {
      const { Proxy } = await loadFixture(deployProxyContractFixture);

      // See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-165.md#how-to-detect-if-a-contract-implements-erc-165
      const ERC165InterfaceId = "0x01ffc9a7";
      
      // See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md#specification
      const ERC721InterfaceId = "0x80ac58cd";

      // See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md#specification
      const ERC721MetadataInterfaceId = "0x5b5e139f";

      // See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2981.md#specification
      const ERC2981InterfaceId = "0x2a55205a";

      // ERC165, ERC721, ERC721Metadata, ERC2981
      expect(await Proxy.supportsInterface(ERC165InterfaceId)).to.be.true;
      expect(await Proxy.supportsInterface(ERC721InterfaceId)).to.be.true;
      expect(await Proxy.supportsInterface(ERC721MetadataInterfaceId)).to.be.true;
      expect(await Proxy.supportsInterface(ERC2981InterfaceId)).to.be.true;

      /* CROSSCHECK */

      // If `0xffffffff` should return `false`
      const falseInterfaceId = "0xffffffff";
      expect(await Proxy.supportsInterface(falseInterfaceId)).to.be.false;

      // If random interface should return `false`
      const randomInterfaceId = "0x00000042";
      expect(await Proxy.supportsInterface(randomInterfaceId)).to.be.false;
    });

    /**
     * Check paused status
     * See {PausableUpgradeable-paused}
     */
    it("Should return with value `false` for paused()", async function () {
      const { Proxy } = await loadFixture(deployProxyContractFixture);

      expect(await Proxy.paused()).to.be.false;
    });

    /**
     * Check isOperatorFilterRegistryRevoked status
     * See {RevokableOperatorFiltererUpgradeable-isOperatorFilterRegistryRevoked}
     */
    it("Should return with value `false` for isOperatorFilterRegistryRevoked()", async function () {
      const { Proxy } = await loadFixture(deployProxyContractFixture);

      expect(await Proxy.isOperatorFilterRegistryRevoked()).to.be.false;
    });

    /* RETURN NON-BOOLEAN VALUE */

    /**
     * Check owner of the proxy contract
     * See {OwnableUpgradeable-owner}
     */
    it("Should return with value `proxyDeployer` as the Owner of the proxy contract", async function () {
      const { proxyDeployer, Proxy } = await loadFixture(deployProxyContractFixture);

      expect(await Proxy.owner()).to.equal(proxyDeployer);
    });

    /**
     * Check royalty info
     * See {ERC2981Upgradeable-royaltyInfo}
     */
    it("Should return with value `proxyDeployer` as royalty receiver and `25_000_000` as royalty amount for royaltyInfo(1, 1_000_000_000)",
    async function () {
        const { proxyDeployer, feeBasisPoints, Proxy } = await loadFixture(deployProxyContractFixture);
        
        /* HOMEWORK -- need to be tested with big numbers value */
        
        // Init fee denominator
        const feeDenominator = 10_000;

        // Init variables
        let nonExistentTokenId = 1;
        let salePrice = 1_000_000_000; // 0.000000001 Ether

        // uint256 royaltyAmount = (_salePrice * royalty.royaltyFraction) / _feeDenominator(); 
        let expectedRoyaltyAmount = 25_000_000; // 25_000_000 wei
        
        // expect([1, 2]).to.deep.equal([1, 2]);
        expect(await Proxy.royaltyInfo(nonExistentTokenId, salePrice))
          .to.deep.equal([proxyDeployer, expectedRoyaltyAmount]);
    });

    /**
     * Check contract name
     * See {ERC721AUpgradeable-name}
     */
    it("Should return with value `KonSer POAP` for name()", async function () {
      const { Proxy } = await loadFixture(deployProxyContractFixture);

      // Init expected return value
      let expectedReturnValue = "KonSer POAP";

      expect(await Proxy.name()).to.equal(expectedReturnValue);
    });

    /**
    * Check contract symbol
    * See {ERC721AUpgradeable-symbol}
    */
    it("Should return with value `SerPOAP` for symbol()", async function () {
        const { Proxy } = await loadFixture(deployProxyContractFixture);

      // Init expected return value
      let expectedReturnValue = "SerPOAP";

        expect(await Proxy.symbol()).to.equal(expectedReturnValue);
    });

    /**
     * Check contract version
     * See {ContractVersion-getContractVersion}
     */
    it("Should return with value `1` (one) for getContractVersion()", async function () {
        const { Proxy } = await loadFixture(deployProxyContractFixture);

        // Init expected return value
        let expectedReturnValue = 1;

        expect(await Proxy.getContractVersion()).to.equal(expectedReturnValue);
    });

    /**
     * Check total supply
     * See {ERC721AUpgradeable-totalSupply}
     */
    it("Should return with value `0` (zero) for totalSupply()", async function () {
      const { Proxy } = await loadFixture(deployProxyContractFixture);

      // Init expected return value
      let expectedReturnValue = 0;

      expect(await Proxy.totalSupply()).to.equal(expectedReturnValue);
    });

    // ============= SHOULD RETURN WITH CUSTOM ERROR ===============

    /**
     * Check get poap ID
     * See {KonSerPoap-getPoapId}
     */
    it("Should revert with custom error `TokenIdDoesNotExist` for getPoapId(1)", async function () {
        const { Proxy } = await loadFixture(deployProxyContractFixture);

        // Init non-existent tokenId
        let nonExistentTokenId = 1;

        // See https://hardhat.org/hardhat-chai-matchers/docs/overview#reverts
        await expect(Proxy.getPoapId(nonExistentTokenId))
          .to.be.revertedWithCustomError(Proxy, "TokenIdDoesNotExist");
    });

    /**
     * Check get poap URI
     * See {KonSerPoap-getPoapURI}
     */
    it("Should revert with custom error `PoapIdDoesNotExist` for getPoapURI(1)", async function () {
        const { Proxy } = await loadFixture(deployProxyContractFixture);

        // Init non-existent poapId
        let nonExistentPoapId = 1;

        await expect(Proxy.getPoapURI(nonExistentPoapId))
          .to.be.revertedWithCustomError(Proxy, "PoapIdDoesNotExist");
    });

    /**
     * Check token URI
     * See {KonSerPoap-tokenURI}
     */
    it("Should revert with custom error `URIQueryForNonexistentToken` for tokenURI(1)", async function () {
        const { Proxy } = await loadFixture(deployProxyContractFixture);

        // Init non-existent tokenId
        let nonExistentTokenId = 1;

        await expect(Proxy.tokenURI(nonExistentTokenId))
          .to.be.revertedWithCustomError(Proxy, "URIQueryForNonexistentToken");
    });

    /**
     * Call mint with non-existent poapId
     * See {KonSerPoap-mint}
     */
    it("Should revert with custom error `PoapIdDoesNotExist` for mint(receiver1, 42)", async function () {
      const { receiver1, Proxy } = await loadFixture(deployProxyContractFixture);

      // Init non-existent poapId
      let nonExistentPoapId = 42;

      await expect(Proxy.mint(receiver1, nonExistentPoapId))
        .to.be.revertedWithCustomError(Proxy, "PoapIdDoesNotExist");
    });

    /**
    * Call airdrop with non-existent poapId
    * See {KonSerPoap-airdrop}
    */
    it("Should revert with custom error `PoapIdDoesNotExist` for airdrop([receiver1, receiver2, receiver3], 69)", async function () {
      const { receiver1, receiver2, receiver3, Proxy } = await loadFixture(deployProxyContractFixture);

      // Init receivers
      let receivers = [receiver1, receiver2, receiver3];

      // Init non-existent poapId
      let nonExistentPoapId = 69;

      await expect(Proxy.airdrop(receivers, nonExistentPoapId))
        .to.be.revertedWithCustomError(Proxy, "PoapIdDoesNotExist");
    });

    /**
    * Set `empty string` as poap URI
    * See {KonSerPoap-setPoapURI}
    */
    it("Should revert with custom error `InvalidPoapURI` for setPoapURI(1, '')", async function () {
      const { Proxy } = await loadFixture(deployProxyContractFixture);

      // Init new Poap ID
      let newPoapId = 1;
      // Init empty string as new Poap URI
      let newPoapURI = "";

      await expect(Proxy.setPoapURI(newPoapId, newPoapURI))
        .to.be.revertedWithCustomError(Proxy, "InvalidPoapURI");
    });

    /**
     * Call revokeOperatorFilterRegistry by non-authorized roles
     * See {RevokableOperatorFiltererUpgradeable-revokeOperatorFilterRegistry}
     */
    it("Should revert with custom error `OnlyOwner` if revokeOperatorFilterRegistry() called by != Owner", async function () {
      const { _proxyDeployer, _adminRole, _minterRole, _hasNoRole, Proxy } = await loadFixture(deployProxyContractFixture);

      // If `hasNoRole`
      await expect(Proxy.connect(_hasNoRole)
        .revokeOperatorFilterRegistry())
        .to.be.revertedWithCustomError(Proxy, "OnlyOwner");

      // If `adminRole`
      await expect(Proxy.connect(_adminRole)
        .revokeOperatorFilterRegistry())
        .to.be.revertedWithCustomError(Proxy, "OnlyOwner");
      
      // If `minterRole`
      await expect(Proxy.connect(_minterRole)
        .revokeOperatorFilterRegistry())
        .to.be.revertedWithCustomError(Proxy, "OnlyOwner");

      /* CROSSCHECK */

      // If `proxyDeployer`
      await expect(Proxy.connect(_proxyDeployer)
        .revokeOperatorFilterRegistry())
        .to.not.be.revertedWithCustomError(Proxy, "OnlyOwner");
  });

    // ============ SHOULD RETURN WITH ERROR MESSAGE ===============

    /**
     * Call initialize
     * See {KonSerPoap-initialize}
     */
    it("Should revert with error message 'ERC721A__Initializable: contract is already initialized'", async function () {
        const { proxyDeployer, adminRole, minterRole, feeBasisPoints, Proxy } = await loadFixture(deployProxyContractFixture);

        await expect(Proxy.initialize(proxyDeployer, adminRole, minterRole, feeBasisPoints))
          .to.be.revertedWith("ERC721A__Initializable: contract is already initialized");
    });

    /**
     * Set default royalty information
     * See {KonSerPoap-SetRoyaltyInfo}
     */
    it("Should revert with error message 'ERC2981: royalty fee will exceed salePrice'", async function () {
      const { proxyDeployer, adminRole, minterRole, feeBasisPoints, Proxy } = await loadFixture(deployProxyContractFixture);

      // Init invalid fee basis points
      let invalidFeeBasisPoints = 10_001;

      await expect(Proxy.setRoyaltyInfo(proxyDeployer, invalidFeeBasisPoints))
        .to.be.revertedWith("ERC2981: royalty fee will exceed salePrice");
  });

    /**
     * Call mint with non-existent poapId by non-authorized roles
     * See {KonSerPoap-mint}
     */
    it("Should revert with error message `/AccessControl: account .* is missing role .*/` if mint() called by != MINTER_ROLE", async function () {
        const { receiver1, _proxyDeployer, _adminRole, _minterRole, _hasNoRole, Proxy } = await loadFixture(deployProxyContractFixture);

        // Init non-existent poap ID
        let nonExistentPoapId = 1;

        // If `hasNoRole`
        // See https://hardhat.org/hardhat-runner/docs/guides/test-contracts#using-a-different-address
        await expect(Proxy.connect(_hasNoRole)
          .mint(receiver1, nonExistentPoapId))
          .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

        // If `adminRole`
        await expect(Proxy.connect(_adminRole)
          .mint(receiver1, nonExistentPoapId))
          .to.be.revertedWith(/AccessControl: account .* is missing role .*/);
        
        /* CROSSCHECK */

        // If `minterRole`
        await expect(Proxy.connect(_minterRole)
          .mint(receiver1, nonExistentPoapId))
          .to.not.be.revertedWith(/AccessControl: account .* is missing role .*/);

        // If `proxyDeployer`
        await expect(Proxy.connect(_proxyDeployer)
          .mint(receiver1, nonExistentPoapId))
          .to.not.be.revertedWith(/AccessControl: account .* is missing role .*/);
    });

    /**
     * Call airdrop with non-existent poapId by non-authorized roles
     * See {KonSerPoap-airdrop}
     */
    it("Should revert with error message `/AccessControl: account .* is missing role .*/` if airdrop() called by != MINTER_ROLE ", async function () {
        const { receiver1, receiver2, receiver3, _proxyDeployer, _adminRole, _minterRole, _hasNoRole, Proxy } = await loadFixture(deployProxyContractFixture);

        // Init receivers
        let receivers = [receiver1, receiver2, receiver3];

        // Init non-existent poap ID
        let nonExistentPoapId = 1;

        // If `hasNoRole`
        await expect(Proxy.connect(_hasNoRole)
          .airdrop(receivers, nonExistentPoapId))
          .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

        // If `adminRole`
        await expect(Proxy.connect(_adminRole)
          .airdrop(receivers, nonExistentPoapId))
          .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

        /* CROSSCHECK */

        // If `minterRole`
        await expect(Proxy.connect(_minterRole)
          .airdrop(receivers, nonExistentPoapId))
          .to.not.be.revertedWith(/AccessControl: account .* is missing role .*/);

        // If `proxyDeployer`
        await expect(Proxy.connect(_proxyDeployer)
          .airdrop(receivers, nonExistentPoapId))
          .to.not.be.revertedWith(/AccessControl: account .* is missing role .*/);
    });

    /*
     * Set poap URI by non-authorized roles
     * See {KonSerPoap-setPoapURI}
     */
    it("Should revert with error message `/AccessControl: account .* is missing role .*/` if setPoapURI() called by != ADMIN_ROLE", async function () {
        const { _proxyDeployer, _adminRole, _minterRole, _hasNoRole, Proxy } = await loadFixture(deployProxyContractFixture);

        // Init non-existing poap ID
        let nonExistentPoapId = 1;

        // Init new Poap URI
        let newPoapUri = "ipfs://FOO...";

        // If `hasNoRole`
        await expect(Proxy.connect(_hasNoRole)
          .setPoapURI(nonExistentPoapId, newPoapUri))
          .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

        // If `minterRole`
        await expect(Proxy.connect(_minterRole)
          .setPoapURI(nonExistentPoapId, newPoapUri))
          .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

        
        /* CROSSCHECK */

        // If `adminRole`
        await expect(Proxy.connect(_adminRole)
          .setPoapURI(nonExistentPoapId, newPoapUri))
          .to.not.be.revertedWith(/AccessControl: account .* is missing role .*/);

        // If `proxyDeployer`
        await expect(Proxy.connect(_proxyDeployer)
          .setPoapURI(nonExistentPoapId, newPoapUri))
          .to.not.be.revertedWith(/AccessControl: account .* is missing role .*/);
    });

    /*
     * Set default royalty information by non-authorized roles
     * See {KonSerPoap-setRoyaltyInfo}
     */
    it("Should revert with error message `/AccessControl: account .* is missing role .*/` if setRoyaltyInfo() called by != ADMIN_ROLE", async function () {
        const { hasNoRole, _proxyDeployer, _adminRole, _minterRole, _hasNoRole, Proxy } = await loadFixture(deployProxyContractFixture);

        // Init new royalty receiver
        let newRoyaltyReceiver = hasNoRole;

        // Init new fee basis points
        let newFeeBasisPoints = 420;

        // If `hasNoRole`
        await expect(Proxy.connect(_hasNoRole)
          .setRoyaltyInfo(newRoyaltyReceiver, newFeeBasisPoints))
          .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

        // If `minterRole`
        await expect(Proxy.connect(_minterRole)
          .setRoyaltyInfo(newRoyaltyReceiver, newFeeBasisPoints))
          .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

        
        /* CROSSCHECK */

        // If `adminRole`
        await expect(Proxy.connect(_adminRole)
          .setRoyaltyInfo(newRoyaltyReceiver, newFeeBasisPoints))
          .to.not.be.revertedWith(/AccessControl: account .* is missing role .*/);

        // If `proxyDeployer`
        await expect(Proxy.connect(_proxyDeployer)
          .setRoyaltyInfo(newRoyaltyReceiver, newFeeBasisPoints))
          .to.not.be.revertedWith(/AccessControl: account .* is missing role .*/);
    });

    /*
     * Pause the contract by non-authorized roles
     * See {KonSerPoap-pause}
     */
    it("Should revert with error message `/AccessControl: account .* is missing role .*/` if pause() called by != DEFAULT_ADMIN_ROLE", async function () {
        const { _proxyDeployer, _adminRole, _minterRole, _hasNoRole, Proxy } = await loadFixture(deployProxyContractFixture);

        // If `hasNoRole`
        await expect(Proxy.connect(_hasNoRole)
          .pause())
          .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

        // If `adminRole`
        await expect(Proxy.connect(_adminRole)
          .pause())
          .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

        // If `minterRole`
        await expect(Proxy.connect(_minterRole)
          .pause())
          .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

        /* CROSSCHECK */

        // If `proxyDeployer`
        await expect(Proxy.connect(_proxyDeployer)
          .pause())
          .to.not.be.revertedWith(/AccessControl: account .* is missing role .*/);
    });

    /*
     * Unpause the contract by non-authorized roles
     * See {KonSerPoap-Unpause}
     */
    it("Should revert with error message `/AccessControl: account .* is missing role .*/` if unpause() called by != DEFAULT_ADMIN_ROLE", async function () {
      const { proxyDeployer, _proxyDeployer, _adminRole, _minterRole, _hasNoRole, Proxy } = await loadFixture(deployProxyContractFixture);

      // Init pause the contract
      await expect(Proxy.pause())
        .to.be.emit(Proxy, "Paused")
        .withArgs(proxyDeployer);

      // Check paused status
      expect(await Proxy.paused()).to.be.true;

      // If `hasNoRole`
      await expect(Proxy.connect(_hasNoRole)
        .unpause())
        .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

      // If `adminRole`
      await expect(Proxy.connect(_adminRole)
        .unpause())
        .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

      // If `minterRole`
      await expect(Proxy.connect(_minterRole)
        .unpause())
        .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

      /* CROSSCHECK */

      // If `proxyDeployer`
      await expect(Proxy.connect(_proxyDeployer)
        .unpause())
        .to.not.be.revertedWith(/AccessControl: account .* is missing role .*/);
    });

    /*
     * Call UpgradeTo
     * See {UUPSUpgradeable-upgradeTo}
     */
    it("Should revert with error message `/AccessControl: account .* is missing role .*/` if upgradeTo() called by != DEFAULT_ADMIN_ROLE", async function () {
      const { _proxyDeployer, _adminRole, _minterRole, _hasNoRole, Proxy } = await loadFixture(deployProxyContractFixture);

      // Init new implementation address
      let newImplementation = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";

      // If `hasNoRole`
      await expect(Proxy.connect(_hasNoRole)
        .upgradeTo(newImplementation))
        .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

      // If `adminRole`
      await expect(Proxy.connect(_adminRole)
        .upgradeTo(newImplementation))
        .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

      // If `minterRole`
      await expect(Proxy.connect(_minterRole)
        .upgradeTo(newImplementation))
        .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

      /* CROSSCHECK */

      // If `proxyDeployer`
      // function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
      await expect(Proxy.connect(_proxyDeployer)
        .upgradeTo(newImplementation))
        .to.not.be.revertedWith(/AccessControl: account .* is missing role .*/);
    });

    /*
     * Call UpgradeToAndCall
     * See {UUPSUpgradeable-upgradeToAndCall}
     */
    it("Should revert with error message `/AccessControl: account .* is missing role .*/` if upgradeToAndCall() called by != DEFAULT_ADMIN_ROLE", async function () {
      const { _proxyDeployer, _adminRole, _minterRole, _hasNoRole, Proxy } = await loadFixture(deployProxyContractFixture);

      // Init new implementation address
      let newImplementation = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";

      // Init call data
      let calldata = 0x0;

      // If `hasNoRole`
      await expect(Proxy.connect(_hasNoRole)
        .upgradeToAndCall(newImplementation, calldata))
        .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

      // If `adminRole`
      await expect(Proxy.connect(_adminRole)
        .upgradeToAndCall(newImplementation, calldata))
        .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

      // If `minterRole`
      await expect(Proxy.connect(_minterRole)
        .upgradeToAndCall(newImplementation, calldata))
        .to.be.revertedWith(/AccessControl: account .* is missing role .*/);

      /* CROSSCHECK */

      // If `proxyDeployer`
      // function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
      await expect(Proxy.connect(_proxyDeployer)
        .upgradeToAndCall(newImplementation, calldata))
        .to.not.be.revertedWith(/AccessControl: account .* is missing role .*/);
    });

    // ================ SHOULD EMIT THE EVENT ======================

    /**
    * Set FIRST poap URI by ADMIN_ROLE
    * See {KonSerPoap-setPoapURI}
    */
    it("Should emit the event `PoapURIUpdated` for setPoapURI(1, 'ipfs://FOO..') by ADMIN_ROLE", async function () {
      const { receiver1, _adminRole, Proxy } = await loadFixture(deployProxyContractFixture);

      // Init Poap ID
      let newPoapId = 1;
      // Init non-empty string as new Poap URI
      let newPoapURI = "ipfs://FOO...";

      // Call setPoapURI by ADMIN_ROLE
      await expect(Proxy.connect(_adminRole)
        .setPoapURI(newPoapId, newPoapURI))
        // See https://hardhat.org/hardhat-chai-matchers/docs/overview#events-with-arguments
        // event PoapURIUpdated(uint256 poapId, string uri);
        .to.be.emit(Proxy, "PoapURIUpdated")
        .withArgs(newPoapId, newPoapURI);

      /* CROSSCHECK */

      // Get Poap URI
      expect(await Proxy.getPoapURI(newPoapId)).to.equal(newPoapURI);

      // Mint Poap ID #1
      await expect(Proxy.mint(receiver1, newPoapId))
        .to.be.emit(Proxy, "PoapMinted")
        .withArgs(receiver1, newPoapId, 1);
    });

    /**
     * Set new default royalty information by ADMIN_ROLE
     * See {KonSerPoap-setRoyaltyInfo}
     */
    it("Should emit the event `RoyaltyInfoUpdated` for setDefaultRoyalty(adminRole, 420) by ADMIN_ROLE", async function () {
      const { adminRole, _adminRole, Proxy } = await loadFixture(deployProxyContractFixture);

      // Init new royalty receiver
      let newRoyaltyReceiver = adminRole;
      // Init new fee basis points
      let newFeeBasisPoints = 420;

      await expect(Proxy.connect(_adminRole)
        .setRoyaltyInfo(newRoyaltyReceiver, newFeeBasisPoints))
        // event RoyaltyInfoUpdated(address indexed royaltyReceiver, uint96 feeBasisPoints);
        .to.be.emit(Proxy, "RoyaltyInfoUpdated")
        .withArgs(newRoyaltyReceiver, newFeeBasisPoints);

      /* CROSSCHECK */

      const feeDenominator = 10_000;
      let nonExistentTokenId = 1;
      let salePrice = 1_000_000_000; // 0.000000001 Ether
      let expectedRoyaltyAmount = 42_000_000; // 42_000_000 wei
      
      // Get royalty info
      expect(await Proxy.royaltyInfo(nonExistentTokenId, salePrice))
        .to.deep.equal([newRoyaltyReceiver, expectedRoyaltyAmount]);
    });

    /*
     * Pause the contract
     * See {KonSerPoap-pause}
     * See {PausableUpgradeable-_pause}
     */
    it("Should emit the event `Paused` for pause()", async function () {
      const { proxyDeployer, Proxy } = await loadFixture(deployProxyContractFixture);

      await expect(Proxy.pause())
        // event Paused(address account);
        .to.be.emit(Proxy, "Paused")
        .withArgs(proxyDeployer);
    });

    /*
     * Unpause the contract
     * See {KonSerPoap-unpause}
     * See {PausableUpgradeable-_unpause}
     */
    it("Should emit the event `Unpaused` for unpause()", async function () {
      const { proxyDeployer, Proxy } = await loadFixture(deployProxyContractFixture);

      // Init pause the contract
      await expect(Proxy.pause())
        .to.be.emit(Proxy, "Paused")
        .withArgs(proxyDeployer);

      // Check paused status
      expect(await Proxy.paused()).to.be.true;

      await expect(Proxy.unpause())
        // event Unpaused(address account);
        .to.be.emit(Proxy, "Unpaused")
        .withArgs(proxyDeployer);
    });

    /**
     * Revoke Operator Filter Registry
     * See {RevokeableOperatorFiltererUpgradeable-revokeOperatorFilterRegistry}
     */
    it("Should emit the event `OperatorFilterRegistryRevoked` for revokeOperatorFilterRegistry()", async function () {
      const { _proxyDeployer, Proxy } = await loadFixture(deployProxyContractFixture);

      await expect(Proxy.revokeOperatorFilterRegistry())
        // event OperatorFilterRegistryRevoked();
        .to.be.emit(Proxy, "OperatorFilterRegistryRevoked");

      /* CROSSCHECK */

      // Check isOperatorFilterRegistryRevoked
      expect(await Proxy.isOperatorFilterRegistryRevoked()).to.be.true;

      // If it is called after revoked
      await expect(Proxy.connect(_proxyDeployer)
        .revokeOperatorFilterRegistry())
        .to.be.revertedWithCustomError(Proxy, "AlreadyRevoked");
    });

    /*
     * Grant ADMIN_ROLE to `hasNoRole`
     * See {AccessControlUpgradeable-grantRole}
     */
    it("Should emit the event `RoleGranted` for grantRole(ADMIN_ROLE, hasNoRole)", async function () {
      const { proxyDeployer, hasNoRole, Proxy } = await loadFixture(deployProxyContractFixture);

      // Init bytes32 for `ADMIN_ROLE`
      let admin_role = ethers.utils.toUtf8Bytes("ADMIN_ROLE");
      let ADMIN_ROLE = ethers.utils.keccak256(admin_role);

      // Init new admin role
      let newAdminRole = hasNoRole;

      await expect(Proxy.grantRole(ADMIN_ROLE, newAdminRole))
        // event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
        .to.be.emit(Proxy, "RoleGranted")
        .withArgs(ADMIN_ROLE, newAdminRole, proxyDeployer);

      /* CROSSCHECK */
      expect(await Proxy.hasRole(ADMIN_ROLE, newAdminRole)).to.be.true;
    });

    /*
     * Revoke `adminRole` from ADMIN_ROLE
     * See {AccessControlUpgradeable-revokeRole}
     */
    it("Should emit the event `RoleRevoked` for revokeRole(ADMIN_ROLE, adminRole)", async function () {
      const { proxyDeployer, adminRole, Proxy } = await loadFixture(deployProxyContractFixture);

      // Init bytes32 for `ADMIN_ROLE`
      let admin_role = ethers.utils.toUtf8Bytes("ADMIN_ROLE");
      let ADMIN_ROLE = ethers.utils.keccak256(admin_role);

      // Init existing admin role
      let existingAdminRole = adminRole;

      await expect(Proxy.revokeRole(ADMIN_ROLE, existingAdminRole))
        // event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
        .to.be.emit(Proxy, "RoleRevoked")
        .withArgs(ADMIN_ROLE, existingAdminRole, proxyDeployer);

      /* CROSSCHECK */
      expect(await Proxy.hasRole(ADMIN_ROLE, existingAdminRole)).to.be.false;
    });

    /**
     * Transfer Ownership
     * See {OwnableUpgradeable-transferOwnership}
     */
    it("Should emit the event `OwnershipTransferred` for transferOwnership(adminRole)", async function () {
      const { proxyDeployer, adminRole, Proxy } = await loadFixture(deployProxyContractFixture);

      // Init previous owner
      let previousOwner = proxyDeployer;
      // Init new owner
      let newOwner = adminRole;

      await expect(Proxy.transferOwnership(newOwner))
        // event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
        .to.be.emit(Proxy, "OwnershipTransferred")
        .withArgs(previousOwner, newOwner);

      /* CROSSCHECK */
      expect(await Proxy.owner()).to.equal(newOwner);
    });

    /**
     * Renounce Ownership
     * See {OwnableUpgradeable-renounceOwnership}
     */
    it("Should emit the event `OwnershipTransferred` for renounceOwnership()", async function () {
      const { proxyDeployer, Proxy } = await loadFixture(deployProxyContractFixture);

      // Init previous owner
      let previousOwner = proxyDeployer;
      // Init zero address
      let zeroAddress = "0x0000000000000000000000000000000000000000";

      await expect(Proxy.renounceOwnership())
        .to.be.emit(Proxy, "OwnershipTransferred")
        .withArgs(previousOwner, zeroAddress);

      /* CROSSCHECK */
      expect(await Proxy.owner()).to.equal(zeroAddress);
    }); 
});
