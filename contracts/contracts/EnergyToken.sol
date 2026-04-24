// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EnergyToken is ERC1155, Ownable {
    // tokenId tracker
    uint256 public currentTokenId;

    // Address of the oracle/backend that is allowed to mint
    address public oracleAddress;

    // Mapping from tokenId to kWh (stored as Wh to avoid decimals)
    mapping(uint256 => uint256) public tokenEnergyAmount;

    // Events
    event MintConfirmed(address indexed producer, uint256 indexed tokenId, uint256 amount);

    constructor(address _oracleAddress) ERC1155("https://api.solarix.dev/metadata/{id}.json") Ownable(msg.sender) {
        oracleAddress = _oracleAddress;
    }

    function setOracleAddress(address _oracleAddress) external onlyOwner {
        oracleAddress = _oracleAddress;
    }

    // Called by the oracle/backend to mint energy tokens to a producer
    function confirmMint(address producer, uint256 amountInWh) external returns (uint256) {
        require(msg.sender == oracleAddress || msg.sender == owner(), "Not authorized to mint");
        
        currentTokenId++;
        uint256 newTokenId = currentTokenId;
        
        // We mint 1 unit of this specific NFT (which represents `amountInWh` of energy)
        _mint(producer, newTokenId, 1, "");
        tokenEnergyAmount[newTokenId] = amountInWh;

        emit MintConfirmed(producer, newTokenId, amountInWh);
        return newTokenId;
    }
}
