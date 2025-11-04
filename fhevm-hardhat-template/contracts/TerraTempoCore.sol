// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title TerraTempoCore
 * @notice Privacy-preserving agricultural community management platform
 * @dev Simplified version with core encrypted fields only
 */
contract TerraTempoCore is ZamaEthereumConfig {
    // ============ State Variables ============
    
    struct CropRecord {
        uint256 id;
        address farmer;
        euint32 cropType;         // Encrypted
        euint32 landArea;         // Encrypted (hectares * 100)
        euint32 actualYield;      // Encrypted (kg)
        uint256 submittedAt;      // Public timestamp
        bool isActive;
    }
    
    struct Guidance {
        uint256 id;
        address expert;
        string title;
        string ipfsHash;
        uint256 category;
        uint256 publishedAt;
        uint256 helpfulVotes;
    }
    
    // Storage
    uint256 public totalRecords;
    uint256 public totalGuidance;
    
    // Record mappings
    mapping(uint256 => CropRecord) public records;
    mapping(address => uint256[]) public farmerRecords;
    mapping(address => bool) public experts;
    mapping(uint256 => Guidance) public guidanceList;
    mapping(address => mapping(uint256 => bool)) public hasVoted;
    
    // Access control
    address public owner;
    uint256 public constant MIN_AGGREGATION_THRESHOLD = 10;
    
    // ============ Events ============
    
    event CropRecordSubmitted(uint256 indexed recordId, address indexed farmer, uint256 timestamp);
    event ExpertGranted(address indexed expert, uint256 timestamp);
    event ExpertRevoked(address indexed expert, uint256 timestamp);
    event GuidanceSubmitted(uint256 indexed guidanceId, address indexed expert, string title, uint256 timestamp);
    event GuidanceVoted(uint256 indexed guidanceId, address indexed voter, uint256 newVoteCount);
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    modifier onlyExpert() {
        require(experts[msg.sender], "Not an expert");
        _;
    }
    
    modifier onlyFarmer(uint256 recordId) {
        require(records[recordId].farmer == msg.sender, "Not record owner");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        owner = msg.sender;
        experts[msg.sender] = true;
    }
    
    // ============ Farmer Functions ============
    
    /**
     * @notice Submit encrypted crop record (simplified with 3 core fields)
     */
    function submitCropRecord(
        externalEuint32 encryptedCropType,
        bytes calldata inputProofCropType,
        externalEuint32 encryptedLandArea,
        bytes calldata inputProofLandArea,
        externalEuint32 encryptedActualYield,
        bytes calldata inputProofActualYield
    ) external returns (uint256) {
        totalRecords++;
        uint256 recordId = totalRecords;
        
        euint32 cropType = FHE.fromExternal(encryptedCropType, inputProofCropType);
        euint32 landArea = FHE.fromExternal(encryptedLandArea, inputProofLandArea);
        euint32 actualYield = FHE.fromExternal(encryptedActualYield, inputProofActualYield);
        
        records[recordId] = CropRecord({
            id: recordId,
            farmer: msg.sender,
            cropType: cropType,
            landArea: landArea,
            actualYield: actualYield,
            submittedAt: block.timestamp,
            isActive: true
        });
        
        farmerRecords[msg.sender].push(recordId);
        
        // Allow farmer to decrypt
        FHE.allowThis(cropType);
        FHE.allowThis(landArea);
        FHE.allowThis(actualYield);
        FHE.allow(cropType, msg.sender);
        FHE.allow(landArea, msg.sender);
        FHE.allow(actualYield, msg.sender);
        
        emit CropRecordSubmitted(recordId, msg.sender, block.timestamp);
        
        return recordId;
    }
    
    function getMyRecordIds() external view returns (uint256[] memory) {
        return farmerRecords[msg.sender];
    }
    
    function getRecordData(uint256 recordId) external onlyFarmer(recordId) returns (
        euint32 cropType,
        euint32 landArea,
        euint32 actualYield,
        uint256 submittedAt
    ) {
        CropRecord memory record = records[recordId];
        
        // Re-authorize the encrypted values for decryption
        // This is necessary because view functions don't trigger ACL events
        FHE.allow(record.cropType, msg.sender);
        FHE.allow(record.landArea, msg.sender);
        FHE.allow(record.actualYield, msg.sender);
        
        return (record.cropType, record.landArea, record.actualYield, record.submittedAt);
    }
    
    function getPersonalStats() external returns (uint256 recordCount, euint32 totalYield) {
        uint256[] memory recordIds = farmerRecords[msg.sender];
        recordCount = recordIds.length;
        
        if (recordCount == 0) {
            return (0, FHE.asEuint32(0));
        }
        
        euint32 sum = FHE.asEuint32(0);
        for (uint256 i = 0; i < recordCount; i++) {
            CropRecord memory record = records[recordIds[i]];
            if (record.isActive) {
                sum = FHE.add(sum, record.actualYield);
            }
        }
        
        FHE.allow(sum, msg.sender);
        return (recordCount, sum);
    }
    
    function deleteRecord(uint256 recordId) external onlyFarmer(recordId) {
        records[recordId].isActive = false;
    }
    
    // ============ Expert Functions ============
    
    function getAggregatedStats() external onlyExpert returns (
        uint256 totalActiveRecords,
        euint32 globalTotalYield,
        bool sufficientData
    ) {
        uint256 activeCount = 0;
        euint32 sumYield = FHE.asEuint32(0);
        
        for (uint256 i = 1; i <= totalRecords; i++) {
            if (records[i].isActive) {
                activeCount++;
                sumYield = FHE.add(sumYield, records[i].actualYield);
            }
        }
        
        sufficientData = activeCount >= MIN_AGGREGATION_THRESHOLD;
        
        if (sufficientData) {
            FHE.allow(sumYield, msg.sender);
        }
        
        return (activeCount, sumYield, sufficientData);
    }
    
    function submitGuidance(string memory title, string memory ipfsHash, uint256 category) external onlyExpert returns (uint256) {
        totalGuidance++;
        uint256 guidanceId = totalGuidance;
        
        guidanceList[guidanceId] = Guidance({
            id: guidanceId,
            expert: msg.sender,
            title: title,
            ipfsHash: ipfsHash,
            category: category,
            publishedAt: block.timestamp,
            helpfulVotes: 0
        });
        
        emit GuidanceSubmitted(guidanceId, msg.sender, title, block.timestamp);
        return guidanceId;
    }
    
    function getGuidance(uint256 guidanceId) external view returns (Guidance memory) {
        return guidanceList[guidanceId];
    }
    
    function voteHelpful(uint256 guidanceId) external {
        require(guidanceId > 0 && guidanceId <= totalGuidance, "Invalid guidance ID");
        require(!hasVoted[msg.sender][guidanceId], "Already voted");
        
        hasVoted[msg.sender][guidanceId] = true;
        guidanceList[guidanceId].helpfulVotes++;
        
        emit GuidanceVoted(guidanceId, msg.sender, guidanceList[guidanceId].helpfulVotes);
    }
    
    function getAllGuidanceIds() external view returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](totalGuidance);
        for (uint256 i = 0; i < totalGuidance; i++) {
            ids[i] = i + 1;
        }
        return ids;
    }
    
    // ============ Admin Functions ============
    
    function grantExpertRole(address expert) external onlyOwner {
        experts[expert] = true;
        emit ExpertGranted(expert, block.timestamp);
    }
    
    function revokeExpertRole(address expert) external onlyOwner {
        experts[expert] = false;
        emit ExpertRevoked(expert, block.timestamp);
    }
    
    function isExpert(address addr) external view returns (bool) {
        return experts[addr];
    }
    
    function getTotalActiveRecords() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= totalRecords; i++) {
            if (records[i].isActive) {
                count++;
            }
        }
        return count;
    }
}
