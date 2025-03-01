// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract HealthAttestations is ERC721Enumerable, Ownable {
    using Strings for uint256;

    enum ActivityType { Steps, Calories, Sleep }

    struct Attestation {
        ActivityType activityType;
        string username;
        uint256 value;
        uint256 date; // Unix timestamp
        uint256 streak;
    }

    // Mapping from token ID to attestation data
    mapping(uint256 => Attestation) private _attestations;
    
    // Mapping from username to their token IDs
    mapping(string => uint256[]) private _userTokens;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // Token counter
    uint256 private _tokenIdCounter;

    event AttestationMinted(
        uint256 indexed tokenId,
        ActivityType activityType,
        string username,
        uint256 value,
        uint256 date,
        uint256 streak
    );

    constructor() ERC721("Health Attestations", "HEALTH") Ownable(msg.sender) {
        _tokenIdCounter = 1;
    }

    function mint(
        ActivityType activityType,
        string memory username,
        uint256 value,
        uint256 date,
        uint256 streak
    ) public returns (uint256) {
        require(bytes(username).length > 0, "Username cannot be empty");
        require(
            activityType == ActivityType.Steps || 
            activityType == ActivityType.Calories || 
            activityType == ActivityType.Sleep,
            "Invalid activity type"
        );

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, tokenId);

        _attestations[tokenId] = Attestation({
            activityType: activityType,
            username: username,
            value: value,
            date: date,
            streak: streak
        });

        _userTokens[username].push(tokenId);

        emit AttestationMinted(tokenId, activityType, username, value, date, streak);

        return tokenId;
    }

    function getAttestation(uint256 tokenId) public view returns (
        ActivityType activityType,
        string memory username,
        uint256 value,
        uint256 date,
        uint256 streak
    ) {
        require(_exists(tokenId), "Token does not exist");
        
        Attestation memory attestation = _attestations[tokenId];
        
        return (
            attestation.activityType,
            attestation.username,
            attestation.value,
            attestation.date,
            attestation.streak
        );
    }

    function getUserTokens(string memory username) public view returns (uint256[] memory) {
        return _userTokens[username];
    }

    function getActivityTypeString(ActivityType activityType) public pure returns (string memory) {
        if (activityType == ActivityType.Steps) return "Steps";
        if (activityType == ActivityType.Calories) return "Calories";
        if (activityType == ActivityType.Sleep) return "Sleep";
        revert("Invalid activity type");
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        string memory baseURI = _baseURI();
        if (bytes(baseURI).length == 0) {
            return "";
        }
        
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

    // Helper function to check if a token exists
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}

