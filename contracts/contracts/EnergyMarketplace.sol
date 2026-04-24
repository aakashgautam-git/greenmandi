// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EnergyMarketplace is ERC1155Holder, ReentrancyGuard {
    IERC1155 public energyToken;

    struct Listing {
        uint256 listingId;
        address seller;
        uint256 tokenId;
        uint256 price; // Price in WEI (MATIC)
        bool active;
    }

    uint256 public currentListingId;
    mapping(uint256 => Listing) public listings;

    event TokenListed(uint256 indexed listingId, address indexed seller, uint256 indexed tokenId, uint256 price);
    event TokenPurchased(uint256 indexed listingId, address indexed buyer, uint256 indexed tokenId, uint256 price);
    event ListingCancelled(uint256 indexed listingId);

    constructor(address _energyTokenAddress) {
        energyToken = IERC1155(_energyTokenAddress);
    }

    function listToken(uint256 _tokenId, uint256 _price) external {
        require(_price > 0, "Price must be greater than 0");
        require(energyToken.balanceOf(msg.sender, _tokenId) >= 1, "Must own the token to list");
        require(energyToken.isApprovedForAll(msg.sender, address(this)), "Marketplace not approved");

        currentListingId++;
        
        listings[currentListingId] = Listing({
            listingId: currentListingId,
            seller: msg.sender,
            tokenId: _tokenId,
            price: _price,
            active: true
        });

        // Transfer token to marketplace escrow
        energyToken.safeTransferFrom(msg.sender, address(this), _tokenId, 1, "");

        emit TokenListed(currentListingId, msg.sender, _tokenId, _price);
    }

    function buyToken(uint256 _listingId) external payable nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.active, "Listing is not active");
        require(msg.value == listing.price, "Incorrect MATIC sent");

        listing.active = false;

        // Transfer MATIC to seller
        (bool success, ) = payable(listing.seller).call{value: msg.value}("");
        require(success, "Transfer to seller failed");

        // Transfer token to buyer
        energyToken.safeTransferFrom(address(this), msg.sender, listing.tokenId, 1, "");

        emit TokenPurchased(_listingId, msg.sender, listing.tokenId, listing.price);
    }

    function cancelListing(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.active, "Listing is not active");
        require(msg.sender == listing.seller, "Only seller can cancel");

        listing.active = false;

        // Return token to seller
        energyToken.safeTransferFrom(address(this), msg.sender, listing.tokenId, 1, "");

        emit ListingCancelled(_listingId);
    }
}
