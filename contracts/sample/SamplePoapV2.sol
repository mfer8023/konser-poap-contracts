// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ERC2771ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";

import "./SamplePoapV1.sol";

/// Custom errors
error InvalidOwner();

contract SamplePoapV2 is SamplePoapV1, ERC2771ContextUpgradeable {
    /// Event to be emitted
    event PoapBurned(address indexed owner, uint256 poapId, uint256 tokenId);

    /// Constant
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(
        address _initTrustedForwarder
    ) ERC2771ContextUpgradeable(_initTrustedForwarder) {
        _disableInitializers();
    }
   
    /// Initializer V2
    function initializeV2() external reinitializer(2) {
        __ContractVersion_init(2);
    }

    /// Burn
    function burn(address tokenOwner, uint256 tokenId) external virtual onlyRole(BURNER_ROLE) {
        _burnSinglePoap(tokenOwner, tokenId);
    }

    /// Burn internal
    function _burnSinglePoap(address tokenOwner, uint256 tokenId) internal virtual {
        if (ownerOf(tokenId) != tokenOwner) revert InvalidOwner();

        uint256 poapId = _poapId[tokenId];
        
        ERC721AUpgradeable._burn(tokenId);

        unchecked {
            _totalSupplyByPoapId[poapId] -= 1;
        }
        delete _poapId[tokenId];

        emit PoapBurned(tokenOwner, poapId, tokenId);
    }

    /// Overrides required by {ERC2771ContextUpgradeable}
    function _msgSender() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (address) {
        return ERC2771ContextUpgradeable._msgSender();
    }

    /// Overrides required by {ERC2771ContextUpgradeable}
    function _msgData() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (bytes calldata) {
        return ERC2771ContextUpgradeable._msgData();
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
