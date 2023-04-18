// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./SamplePoapV1.sol";

/// Custom errors
error InvalidOwner();

contract SamplePoapV2 is SamplePoapV1 {
    // =============================================================
    //                            EVENTS
    // =============================================================

    event PoapBurned(address indexed owner, uint256 poapId, uint256 tokenId);

    // =============================================================
    //                            CONSTANTS
    // =============================================================

    /// `bytes32` identifier for burner role.
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    // =============================================================
    //                          CONSTRUCTOR
    // =============================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
   
    // =============================================================
    //                          INITIALIZER
    // =============================================================

    /// Initializer V2
    function initializeV2() external reinitializer(2) {
        __ContractVersion_init(2);
    }

    // =============================================================
    //                      EXTERNAL FUNCTIONS
    // =============================================================

    /// Burn
    function burn(address tokenOwner, uint256 tokenId) external virtual onlyRole(BURNER_ROLE) {
        _burnSinglePoap(tokenOwner, tokenId);
    }

    // =============================================================
    //                      INTERNAL FUNCTIONS
    // =============================================================

    /// Burn
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

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
