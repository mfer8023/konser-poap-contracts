// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title ContractVersion
 * @author mfer #8023 (https://github.com/mfer8023)
 * @notice A contract module to set & track the recent version of the implementation contract
 * @dev This contract module should be used through inheritance by the implementation contract
 */
abstract contract ContractVersion is Initializable {
    /// @dev Init contract version
    uint8 internal _contractVersion;

    /// @dev Init the contract by setting `contractVersion` to the proxy contract
    function __ContractVersion_init(uint8 contractVersion) internal onlyInitializing {
        __ContractVersion_init_unchained(contractVersion);
    }

    function __ContractVersion_init_unchained(uint8 contractVersion) internal onlyInitializing {
        _contractVersion = contractVersion;
    }

    /// @dev Returns recent contract version
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
