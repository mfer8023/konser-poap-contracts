// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ERC721AUpgradeable} from "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import {ERC2981Upgradeable} from "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {RevokableDefaultOperatorFiltererUpgradeable} from"operator-filter-registry/src/upgradeable/RevokableDefaultOperatorFiltererUpgradeable.sol";
import {RevokableOperatorFiltererUpgradeable} from "operator-filter-registry/src/upgradeable/RevokableOperatorFiltererUpgradeable.sol";

import "../extensions/ContractVersion.sol";

/// Custom errors
error TokenIdDoesNotExist();
error PoapIdDoesNotExist();
error URIDoesNotExist();
error InvalidURI();
error URICanNotBeReset();

contract SamplePoapV1 is
    Initializable,
    ContextUpgradeable,
    ERC721AUpgradeable,
    UUPSUpgradeable,
    ERC2981Upgradeable,
    AccessControlUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    RevokableDefaultOperatorFiltererUpgradeable,
    ContractVersion
{
    /// Events to be emitted
    event PoapMinted(address indexed receiver, uint256 poapId, uint256 tokenId);
    event PoapDropped(address[] receivers, uint256 poapId, uint256 startTokenId, uint256 totalMinted);
    event PoapURIUpdated(uint256 poapId, string uri);
    event DefaultRoyaltyUpdated(address indexed royaltyReceiver, uint96 feeBasisPoints);

    /// Constants
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// Storage
    mapping (uint256 => uint256) internal _poapId;
    mapping (uint256 => uint256) internal _totalSupplyByPoapId;
    mapping (uint256 => string) internal _poapUri;
    uint256 internal _totalPoapId;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// Initializer
    function initialize(
        address _initRoyaltyReceiver,
        address _initAdmin,
        address _initMinter,
        uint96 _initFeeBasisPoints
    ) external initializerERC721A initializer {
        __ERC721A_init("Sample POAP", "POAP");
        __Context_init();
        __UUPSUpgradeable_init();
        __ERC2981_init();
        __AccessControl_init();
        __Ownable_init();
        __RevokableDefaultOperatorFilterer_init();
        __ContractVersion_init(1);

        ERC2981Upgradeable._setDefaultRoyalty(_initRoyaltyReceiver, _initFeeBasisPoints);
        AccessControlUpgradeable._setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        AccessControlUpgradeable._setupRole(ADMIN_ROLE, _msgSender());
        AccessControlUpgradeable._setupRole(MINTER_ROLE, _msgSender());
        AccessControlUpgradeable._setupRole(ADMIN_ROLE, _initAdmin);
        AccessControlUpgradeable._setupRole(MINTER_ROLE, _initMinter);
    }

    /// Mint
    function mint(address to, uint256 poapId) external virtual onlyRole(MINTER_ROLE) whenNotPaused {
        _mintSinglePoap(to, poapId);
    }

    /// Airdrop
    function airdrop(address[] calldata receivers, uint256 poapId) external virtual onlyRole(MINTER_ROLE) whenNotPaused {
        _airdropSinglePoap(receivers, poapId);
    }

    /// Set Poap URI
    function setPoapURI(uint256 poapId, string memory poapURI) external virtual onlyRole(ADMIN_ROLE) whenNotPaused {
        _setPoapURI(poapId, poapURI);
    }

    /// Set default royalty information
    function setDefaultRoyalty(address royaltyReceiver, uint96 feeBasisPoints) external virtual onlyRole(ADMIN_ROLE) whenNotPaused {
        ERC2981Upgradeable._setDefaultRoyalty(royaltyReceiver, feeBasisPoints);
        emit DefaultRoyaltyUpdated(royaltyReceiver, feeBasisPoints);
    }

    /// Pause contract
    function pause() external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        PausableUpgradeable._pause();
    }

    /// Unpause contract
    function unpause() external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        PausableUpgradeable._unpause();
    }

    /// Get Poap ID
    function getPoapId(uint256 tokenId) public view virtual returns (uint256) {
        if (!_exists(tokenId)) revert TokenIdDoesNotExist();
        return _poapId[tokenId];
    }

    /// Get Poap URI
    function getPoapURI(uint256 poapId) public view virtual returns (string memory) {
        if (bytes(_poapUri[poapId]).length == 0) revert PoapIdDoesNotExist();
        return _poapUri[poapId];
    }

    /// Get total Poap ID
    function getTotalPoapId() public view virtual returns (uint256) {
        return _totalPoapId;
    }

    /// Get total supply by Poap ID
    function getTotalSupplyByPoapId(uint256 poapId) public view virtual returns (uint256) {
        if (bytes(_poapUri[poapId]).length == 0) revert PoapIdDoesNotExist();
        return _totalSupplyByPoapId[poapId];
    }

    /// See {IERC721Metadata-tokenURI}
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

        uint256 poapId = _poapId[tokenId];
        string memory poapURI = _poapUri[poapId];
        
        return bytes(poapURI).length > 0 
            ? string(abi.encodePacked(poapURI))
            : "";
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     *      In this example the added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
     */
    function setApprovalForAll(address operator, bool approved) public override onlyAllowedOperatorApproval(operator) {
        super.setApprovalForAll(operator, approved);
    }

    /**
     * @dev See {IERC721-approve}.
     *      In this example the added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
     */
    function approve(address operator, uint256 tokenId) public payable override onlyAllowedOperatorApproval(operator) {
        super.approve(operator, tokenId);
    }

    /**
     * @dev See {IERC721-transferFrom}.
     *      In this example the added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
     */
    function transferFrom(address from, address to, uint256 tokenId) public payable override onlyAllowedOperator(from) {
        super.transferFrom(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     *      In this example the added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) public payable override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     *      In this example the added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data)
        public
        payable
        override
        onlyAllowedOperator(from)
    {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    /**
     * @dev Returns the owner of the ERC721 token contract.
     */
    function owner()
        public
        view
        virtual
        override (OwnableUpgradeable, RevokableOperatorFiltererUpgradeable)
        returns (address)
    {
        return OwnableUpgradeable.owner();
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
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

    /// Mint internal
    function _mintSinglePoap(address to, uint256 poapId) internal virtual {
        if (bytes(_poapUri[poapId]).length == 0) revert URIDoesNotExist();

        uint256 tokenId = _nextTokenId();
        _poapId[tokenId] = poapId;
        
        ERC721AUpgradeable._mint(to, 1);

        unchecked {
            _totalSupplyByPoapId[poapId] += 1;
        }

        emit PoapMinted(to, poapId, tokenId);
    }

    /// Airdrop internal
    function _airdropSinglePoap(address[] calldata receivers, uint256 poapId) internal virtual {
        uint256 _startFromTokenId = _nextTokenId();
        uint256 receiversLength = receivers.length;

        for (uint256 i = 0; i < receiversLength;) {
            address _receivers = receivers[i];

            if (bytes(_poapUri[poapId]).length == 0) revert URIDoesNotExist();

            uint256 tokenId = _nextTokenId();
            _poapId[tokenId] = poapId;

            ERC721AUpgradeable._mint(_receivers, 1);

            unchecked {
                _totalSupplyByPoapId[poapId] += 1;
                ++i;
            }   
        }

        emit PoapDropped(receivers, poapId, _startFromTokenId, receiversLength);
    }

    /// Set Poap URI internal
    function _setPoapURI(uint256 poapId, string memory poapURI) internal virtual {
        // If total supply by Poap ID is zero
        if (_totalSupplyByPoapId[poapId] == 0) {
            // If Poap URI does not exist and new Poap URI is empty string
            if (bytes(_poapUri[poapId]).length == 0 && bytes(poapURI).length == 0) { 
                revert InvalidURI();
            // If Poap URI does not exist and new Poap URI is non-empty string
            } else if (bytes(_poapUri[poapId]).length == 0 && bytes(poapURI).length != 0) {
                // Set new URI
                _poapUri[poapId] = poapURI;
                unchecked {
                    _totalPoapId += 1;
                }
            // If Poap URI does exist and new Poap URI is empty string
            } else if (bytes(_poapUri[poapId]).length != 0 && bytes(poapURI).length == 0) {
                // Reset existing URI
                delete _poapUri[poapId];
                unchecked {
                    _totalPoapId -= 1;
                }
            // If Poap URI does exist and new Poap URI is non-empty string
            } else {
                // Update existing URI
                _poapUri[poapId] = poapURI;
            }
        }
        // If total supply by Poap ID is non-zero
        if (_totalSupplyByPoapId[poapId] != 0) {
            // If new Poap URI is empty string
            if (bytes(poapURI).length == 0) {
                // URI can not be reset
                revert URICanNotBeReset();
            // If Poap URI does exist and new Poap URI is non-empty string
            } else if (bytes(_poapUri[poapId]).length != 0 && bytes(poapURI).length != 0) {
                // Update existing URI
                _poapUri[poapId] = poapURI;
            }
        }

        emit PoapURIUpdated (poapId, poapURI);
    }

    /// The starting token ID
    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }

    ///  Overrides _beforeTokenTransfers() hook from {ERC721AUpgradeable}
    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal virtual override whenNotPaused {}

    /// Overrides _autohorizeUpgrade from {UUPSUpgradeable}
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
