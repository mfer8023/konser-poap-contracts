// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

abstract contract ContractVersion is Initializable {
    uint8 internal _contractVersion;

    /// Init the contract by setting `contractVersion` to the implementation contract
    function __ContractVersion_init(uint8 contractVersion) internal onlyInitializing {
        __ContractVersion_init_unchained(contractVersion);
    }

    function __ContractVersion_init_unchained(uint8 contractVersion) internal onlyInitializing {
        _contractVersion = contractVersion;
    }

    /// Get contract version
    function getContractVersion() public view virtual returns (uint8) {
        return _contractVersion;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}