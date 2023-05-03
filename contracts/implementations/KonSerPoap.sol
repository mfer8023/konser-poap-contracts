// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/***************************************************************************************

    ████████████████████████████████████████████████████████████████████████████████
    ████████████████████████████████████████████████████████████████████████████████
    ████████████████████████████████████████████████████████████████████████████████
    █████████▌         ███████████████████████████████████████████        ▐█████████
    █████████▌         ███████████████████████████████████████████        ▐█████████
    █████████▌         ███████████████████████████████████████████        ▐█████████
    █████████▌         ███████████████████████████████████████████        ▐█████████
    █████████▌         ██████████████████████████████████         ██████████████████
    █████████▌         ██████████████████████████████████         ██████████████████
    █████████▌         █████████████████████████                  ██████████████████
    █████████▌         █████████████████████████                  ██████████████████
    █████████▌         █████████████████████████         ███████████████████████████
    █████████▌         █████████████████████████         ███████████████████████████
    █████████▌         ████████████████                  ███████████████████████████
    █████████▌         ████████████████                  ███████████████████████████
    █████████▌         ███▌        ▐███         ████████████████████████████████████
    █████████▌         ███▌        ▐███         ████████████████████████████████████
    █████████▌         ███▌        ▐███         ████████████████████████████████████
    █████████▌         ███▌        ▐███         ████████████████████████████████████
    █████████▌         ████████████████                  ███████████████████████████
    █████████▌         ████████████████                  ███████████████████████████
    █████████▌         █████████████████████████         ███████████████████████████
    █████████▌         █████████████████████████         ███████████████████████████
    █████████▌         █████████████████████████         ███████████████████████████
    █████████▌         █████████████████████████                  ██████████████████
    █████████▌         █████████████████████████                  ██████████████████
    █████████▌         ██████████████████████████████████         ██████████████████
    █████████▌         ██████████████████████████████████         ██████████████████
    █████████▌         ███████████████████████████████████████████        ▐█████████
    █████████▌         ███████████████████████████████████████████        ▐█████████
    █████████▌         ███████████████████████████████████████████        ▐█████████
    █████████▌         ███████████████████████████████████████████20230428▐█████████
    ████████████████████████████████████████████████████████████████████████████████
    ████████████████████████████████████████████████████████████████████████████████
    ████████████████████████████████████████████████████████████████████████████████
        __             _____           __  ___                 __                   
       / /_  __  __   / ___/___  _____/  |/  /___  _________  / /_  ___  __  _______
      / __ \/ / / /   \__ \/ _ \/ ___/ /|_/ / __ \/ ___/ __ \/ __ \/ _ \/ / / / ___/
     / /_/ / /_/ /   ___/ /  __/ /  / /  / / /_/ / /  / /_/ / / / /  __/ /_/ (__  ) 
    /_.___/\__, /   /____/\___/_/  /_/  /_/\____/_/  / .___/_/ /_/\___/\__,_/____/  
          /____/                                    /_/                             

***************************************************************************************/
                                                                                                                                                                                         
import "operator-filter-registry/src/upgradeable/RevokableDefaultOperatorFiltererUpgradeable.sol";
import "operator-filter-registry/src/upgradeable/RevokableOperatorFiltererUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";

import "../extensions/ContractVersion.sol";

/**
 * @title KonSerPoap
 * @author mfer #8023 (https://github.com/mfer8023)
 * @notice A version 1 (one) of customized ERC721-based contract for POAP by KonSer (https://konser.co.id)
 * @dev This contract is intended as an implementation to be deployed using UUPS Proxy pattern 
 * @custom:source https://github.com/mfer8023/konser-poap-contracts
 * @custom:status This contract implementation is NOT audited but had been passed the unit testings
 */
contract KonSerPoap is
    ERC721AUpgradeable,
    UUPSUpgradeable,
    ERC2981Upgradeable,
    AccessControlUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    RevokableDefaultOperatorFiltererUpgradeable,
    ContractVersion
{
    // =============================================================
    //                      CUSTOM ERRORS
    // =============================================================

    /// @dev Revert with an error when token ID does not exist
    error TokenIdDoesNotExist();

    /// @dev Revert with an error when poap ID does not exist
    error PoapIdDoesNotExist();

    /// @dev Revert with an error when poap URI does not exist
    error PoapURIDoesNotExist();

    /// @dev Revert with an error when poap URI is invalid
    error InvalidPoapURI();

    /// @dev Revert with an error when poap URI can not be reset
    error PoapURICanNotBeReset();

    /// @dev Revert with an error when the token owner is invalid
    error InvalidTokenOwner();

    // =============================================================
    //                          EVENTS
    // =============================================================

    /// @dev Emitted when a single poap is minted
    event PoapMinted(address indexed receiver, uint256 poapId, uint256 tokenId);

    /// @dev Emitted when a single poap is airdropped
    event PoapDropped(address[] receivers, uint256 poapId, uint256 startTokenId, uint256 totalMinted);

    /// @dev Emitted when a single poap is burned
    event PoapBurned(address indexed owner, uint256 poapId, uint256 tokenId);

    /// @dev Emitted when a poap URI is updated
    event PoapURIUpdated(uint256 poapId, string uri);

    /// @dev Emitted when a default royalty information is updated
    event RoyaltyInfoUpdated(address indexed royaltyReceiver, uint96 feeBasisPoints);

    // =============================================================
    //                          CONSTANTS
    // =============================================================

    /// @dev `bytes32` identifier for admin role
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @dev `bytes32` identifier for minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev `bytes32` identifier for burner role
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    // =============================================================
    //                          STORAGE
    // =============================================================
    
    /// @dev Mapping from token ID to poap ID
    mapping (uint256 => uint256) internal _poapId;

    /// @dev Mapping from poap ID to total supply
    mapping (uint256 => uint256) internal _totalSupplyByPoapId;

    /// @dev Mapping from poap ID to poap URI
    mapping (uint256 => string) internal _poapURI;

    /// @dev Total poap ID
    uint256 internal _totalPoapId;

    // =============================================================
    //                      CONSTRUCTOR
    // =============================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // =============================================================
    //                      INITIALIZER (V1)
    // =============================================================

    /// @dev Initializer
    function initialize(
        address _initRoyaltyReceiver,
        address _initAdmin,
        address _initMinter,
        uint96 _initFeeBasisPoints
    ) external initializerERC721A initializer {
        // Init contracts
        __ERC721A_init("KonSer POAP", "SerPOAP");
        __Context_init();
        __UUPSUpgradeable_init();
        __ERC2981_init();
        __AccessControl_init();
        __Ownable_init();
        __RevokableDefaultOperatorFilterer_init();
        __ContractVersion_init(1);
        // Setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(ADMIN_ROLE, _initAdmin);
        _setupRole(MINTER_ROLE, _initMinter);
        // Set default royalty info
        _setDefaultRoyalty(_initRoyaltyReceiver, _initFeeBasisPoints);
    }

    // =============================================================
    //                      EXTERNAL FUNCTIONS
    // =============================================================

    /**
     * @notice Mint single quantity of poap
     * @param to cannot be the zero address
     * @param poapId must exist
     */
    function mint(address to, uint256 poapId) external virtual onlyRole(MINTER_ROLE) whenNotPaused {
        _mintSinglePoap(to, poapId);
    }

    /**
     * @notice Airdrop single quantity of poap
     * @param receivers cannot be the zero address
     * @param poapId must exist
     */
    function airdrop(address[] calldata receivers, uint256 poapId) external virtual onlyRole(MINTER_ROLE) whenNotPaused {
        _airdropSinglePoap(receivers, poapId);
    }

    /**
     * @notice Burn single quantity of poap
     * @param tokenOwner is the valid owner of the `tokenId`
     * @param tokenId must exist
     */
    function burn(address tokenOwner, uint256 tokenId) external virtual onlyRole(BURNER_ROLE) whenNotPaused {
        _burnSinglePoap(tokenOwner, tokenId);
    }

    /**
     * @notice Set poap URI
     * @param poapId is the unique identifer as the key of `poapURI`'s value
     * @param poapURI is the URI where the poap's metadata is located
     */
    function setPoapURI(uint256 poapId, string memory poapURI) external virtual onlyRole(ADMIN_ROLE) whenNotPaused {
        _setPoapURI(poapId, poapURI);
    }

    /**
     * @notice Set default royalty information
     * @param royaltyReceiver cannot be the zero address
     * @param feeBasisPoints cannot be greater than 1000 (10%)
     */
    function setRoyaltyInfo(address royaltyReceiver, uint96 feeBasisPoints) external virtual onlyRole(ADMIN_ROLE) whenNotPaused {
        _setDefaultRoyalty(royaltyReceiver, feeBasisPoints);
        emit RoyaltyInfoUpdated(royaltyReceiver, feeBasisPoints);
    }

    /// @notice Pause the contract
    function pause() external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        PausableUpgradeable._pause();
    }

    /// @notice Unpause the contract
    function unpause() external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        PausableUpgradeable._unpause();
    }

    // =============================================================
    //                      PUBLIC FUNCTIONS
    // =============================================================

    /**
     * @notice Returns the poap ID from the `tokenId`
     * @param tokenId must exist
     */
    function getPoapId(uint256 tokenId) public view virtual returns (uint256) {
        if (!_exists(tokenId)) revert TokenIdDoesNotExist();
        return _poapId[tokenId];
    }

    /**
     * @notice Returns the poap URI from the `poapId`
     * @param poapId must exist
     */
    function getPoapURI(uint256 poapId) public view virtual returns (string memory) {
        if (bytes(_poapURI[poapId]).length == 0) revert PoapIdDoesNotExist();
        return _poapURI[poapId];
    }

    /**
     * @notice Returns total recent poap IDs
     */
    function getTotalPoapId() public view virtual returns (uint256) {
        return _totalPoapId;
    }

    /**
     * @notice Returns total supply by the `poapId`
     * @param poapId must exist
     */
    function getTotalSupplyByPoapId(uint256 poapId) public view virtual returns (uint256) {
        if (bytes(_poapURI[poapId]).length == 0) revert PoapIdDoesNotExist();
        return _totalSupplyByPoapId[poapId];
    }

    /**
     * @notice Returns the Uniform Resource Identifier (URI) for `tokenId` token.
     * @dev See {ERC721AUpgradeable-tokenURI}
     * @param tokenId must exist
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

        uint256 poapId = _poapId[tokenId];
        string memory poapURI = _poapURI[poapId];
        
        return poapURI;
    }

    /**
     * @notice Returns token IDs owned by `tokenOwner`
     * @dev Inspired by https://github.com/0xInuarashi/ERC721G/blob/main/contracts/ERC721G.sol#L712
     * @param tokenOwner is the owner of token IDs
     */
    function tokensOfOwner(address tokenOwner) public view virtual returns (uint256[] memory) {
        uint256 balance = balanceOf(tokenOwner);
        uint256[] memory tokenIds = new uint256[] (balance);
        uint256 currentIndex;
        uint256 i = _startTokenId();

        while (currentIndex < balance) {
            if (_exists(i) && ownerOf(i) == tokenOwner) { 
                tokenIds[currentIndex++] = i; 
            }
            unchecked { ++i; }
        }

        return tokenIds;
    }

    /// @dev See {IERC165-supportsInterface}
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721AUpgradeable, ERC2981Upgradeable, AccessControlUpgradeable)
        returns (bool) 
    {
        return 
            // ERC165 interface ID for ERC721.
            interfaceId == 0x80ac58cd || 
            // ERC165 interace ID for ERC721Metadata.
            interfaceId == 0x5b5e139f || 
            super.supportsInterface(interfaceId);
    }

    // =============================================================
    //                    OPERATOR FILTER REGISTRY
    // =============================================================

    /// @dev See {IERC721-setApprovalForAll}
    function setApprovalForAll(address operator, bool approved) public override onlyAllowedOperatorApproval(operator) {
        super.setApprovalForAll(operator, approved);
    }

    /// @dev See {IERC721-approve}
    function approve(address operator, uint256 tokenId) public payable override onlyAllowedOperatorApproval(operator) {
        super.approve(operator, tokenId);
    }

    /// @dev See {IERC721-transferFrom}
    function transferFrom(address from, address to, uint256 tokenId) public payable override onlyAllowedOperator(from) {
        super.transferFrom(from, to, tokenId);
    }

    /// @dev See {IERC721-safeTransferFrom}
     
    function safeTransferFrom(address from, address to, uint256 tokenId) public payable override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId);
    }

    /// @dev See {IERC721-safeTransferFrom}
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data)
        public
        payable
        override
        onlyAllowedOperator(from)
    {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    /// @dev Returns the owner of the ERC721 token contract
    function owner()
        public
        view
        virtual
        override (OwnableUpgradeable, RevokableOperatorFiltererUpgradeable)
        returns (address)
    {
        return OwnableUpgradeable.owner();
    }

    // =============================================================
    //                      INTERNAL FUNCTIONS
    // =============================================================

    /// @dev Mint internal logic
    function _mintSinglePoap(address to, uint256 poapId) internal virtual {
        if (bytes(_poapURI[poapId]).length == 0) revert PoapURIDoesNotExist();

        uint256 tokenId = _nextTokenId();
        _poapId[tokenId] = poapId;

        unchecked { _totalSupplyByPoapId[poapId] += 1; }
        
        _mint(to, 1);

        emit PoapMinted(to, poapId, tokenId);
    }

    /// @dev Airdrop internal logic
    function _airdropSinglePoap(address[] calldata receivers, uint256 poapId) internal virtual {
        uint256 _startFromTokenId = _nextTokenId();
        uint256 receiversLength = receivers.length;

        for (uint256 i = 0; i < receiversLength;) {
            address _receivers = receivers[i];

            if (bytes(_poapURI[poapId]).length == 0) revert PoapURIDoesNotExist();

            uint256 tokenId = _nextTokenId();
            _poapId[tokenId] = poapId;

            unchecked { _totalSupplyByPoapId[poapId] += 1; }

            _mint(_receivers, 1);

            unchecked { ++i; }   
        }

        emit PoapDropped(receivers, poapId, _startFromTokenId, receiversLength);
    }

    /// @dev Burn internal logic
    function _burnSinglePoap(address tokenOwner, uint256 tokenId) internal virtual {
        if (ownerOf(tokenId) != tokenOwner) revert InvalidTokenOwner();

        uint256 poapId = _poapId[tokenId];

        unchecked { _totalSupplyByPoapId[poapId] -= 1; }

        delete _poapId[tokenId];
        
        _burn(tokenId);

        emit PoapBurned(tokenOwner, poapId, tokenId);
    }

    /// @dev Set poap URI internal logic
    function _setPoapURI(uint256 poapId, string memory poapURI) internal virtual {
        if (_totalSupplyByPoapId[poapId] == 0) {
            if (bytes(_poapURI[poapId]).length == 0 && bytes(poapURI).length == 0) { 
                // Invalid URI
                revert InvalidPoapURI();
            } else if (bytes(_poapURI[poapId]).length == 0 && bytes(poapURI).length != 0) {
                // Set new URI
                _poapURI[poapId] = poapURI;
                unchecked { _totalPoapId += 1; }
            } else if (bytes(_poapURI[poapId]).length != 0 && bytes(poapURI).length == 0) {
                // Reset existing URI
                delete _poapURI[poapId];
                unchecked { _totalPoapId -= 1; }
            } else {
                // Update existing URI
                _poapURI[poapId] = poapURI;
            }
        }

        if (_totalSupplyByPoapId[poapId] != 0) {
            if (bytes(poapURI).length == 0) {
                // Existing URI can not be reset
                revert PoapURICanNotBeReset();
            } else if (bytes(_poapURI[poapId]).length != 0 && bytes(poapURI).length != 0) {
                // Update existing URI
                _poapURI[poapId] = poapURI;
            }
        }

        emit PoapURIUpdated (poapId, poapURI);
    }

    /// @dev See {ERC721AUpgradeable-_startTokenId}
    function _startTokenId() internal view virtual override returns (uint256) {
        // Token ID starts from 1 (one)
        return 1;
    }

    /// @dev See {ERC721AUpgradeable-_beforeTokenTransfer}
    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal virtual override whenNotPaused {}

    /// @dev See {UUPSUpgradeable - _authorizeUpgrade}
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
