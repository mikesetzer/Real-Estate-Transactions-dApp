pragma solidity ^0.8.0;

// Importing OpenZeppelin Contracts library
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * Mints NFTs representing real estate properties using ERC721URIStorage
 * OpenZeppelin for NFT functionality.
 */
contract RealEstate is ERC721URIStorage {
    using Counters for Counters.Counter; // Utilizing Counters for managing tokenIds

    Counters.Counter private _tokenIds; // Counter for tracking the current token ID

    /**
     * Constructor that sets the NFT collection name and symbol
     */
    constructor() ERC721("Real Estate", "REAL") {}

    /**
     * Mints a new real estate NFT to the caller's address.
     * tokenURI URI for the token's metadata
     * Returns newItemId ID of the newly minted token
     * Increments the token ID counter, mints a new token to the caller, and sets its metadata URI
     */
    function mint(string memory tokenURI) public returns (uint256) {
        _tokenIds.increment(); // Increment the counter to get a new ID

        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    /**
     * Fetches the total number of tokens minted
     * Provides a view function to get the current count from the token ID counter
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
}
