// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ChainShield – Decentralized Cybersecurity Log Registry (Improved)
 * @notice Tamper-proof log anchoring for multi-tenant organizations
 * @dev Optimized for gas & clarity:
 *  - Store only keccak256(rawLogBytes) + refURI (IPFS/Arweave/S3)
 *  - Events are the primary indexing layer (for TheGraph, etc.)
 *  - Modular role system per-org using AccessControl
 *  - Per-org pause for granular fail-safes
 *  - On-chain verifyLog for auditors
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract ChainShield is AccessControl, Pausable {
    // ======== Roles ========
    bytes32 public constant PLATFORM_ADMIN_ROLE = keccak256("PLATFORM_ADMIN_ROLE");
    bytes32 public constant ORG_ADMIN_ROLE      = keccak256("ORG_ADMIN_ROLE");

    // ======== Types ========
    struct Org {
        bool exists;
        string name;
        uint256 nextLogId;
    }

    struct User {
        bool exists;
        string did;         
        string displayName;
    }

    enum LogType {
        Auth, FileAccess, Network, Firewall, App, Email, Txn
    }

    struct LogEntry {
        uint256 logId;
        bytes32 orgId;
        bytes32 userKey;
        LogType logType;
        bytes32 logHash;
        string  refURI;
        uint64  timestamp;
        address submittedBy;
    }

    // ======== Storage ========
    mapping(bytes32 => Org) private orgs;
    mapping(bytes32 => bool) private orgPaused;
    mapping(bytes32 => mapping(bytes32 => User)) private users;
    mapping(bytes32 => mapping(uint256 => LogEntry)) private logs;

    // ======== Events ========
    event OrgRegistered(bytes32 indexed orgId, string name, address indexed admin);
    event OrgAdminGranted(bytes32 indexed orgId, address indexed admin);
    event OrgAdminRevoked(bytes32 indexed orgId, address indexed admin);

    event OrgPaused(bytes32 indexed orgId, address indexed by);
    event OrgUnpaused(bytes32 indexed orgId, address indexed by);

    event UserRegistered(bytes32 indexed orgId, bytes32 indexed userId, string did, string displayName);
    event UserUpdated(bytes32 indexed orgId, bytes32 indexed userId, string did, string displayName);

    event LogSaved(
        bytes32 indexed orgId,
        uint256 indexed logId,
        bytes32 indexed userKey,
        LogType logType,
        bytes32 logHash,
        string refURI
    );

    // ======== Constructor ========
    constructor(address platformAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PLATFORM_ADMIN_ROLE, platformAdmin == address(0) ? msg.sender : platformAdmin);
    }

    // ======== Role Utilities ========
    function _orgRole(bytes32 orgId, bytes32 role) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(role, orgId));
    }

    modifier onlyOrgAdmin(bytes32 orgId) {
        require(hasRole(_orgRole(orgId, ORG_ADMIN_ROLE), msg.sender), "Not org admin");
        _;
    }

    modifier whenOrgNotPaused(bytes32 orgId) {
        require(!orgPaused[orgId], "Org paused");
        _;
    }

    // ======== Org & Admin Management ========
    function registerOrg(bytes32 orgId, string calldata name, address orgAdmin)
        external
        onlyRole(PLATFORM_ADMIN_ROLE)
    {
        require(!orgs[orgId].exists, "Org exists");
        require(orgAdmin != address(0), "Invalid admin");

        orgs[orgId] = Org(true, name, 1);
        _grantRole(_orgRole(orgId, ORG_ADMIN_ROLE), orgAdmin);

        emit OrgRegistered(orgId, name, orgAdmin);
        emit OrgAdminGranted(orgId, orgAdmin);
    }

    function grantOrgAdmin(bytes32 orgId, address admin)
        external
        onlyRole(PLATFORM_ADMIN_ROLE)
    {
        require(orgs[orgId].exists, "No org");
        require(admin != address(0), "Invalid admin");

        _grantRole(_orgRole(orgId, ORG_ADMIN_ROLE), admin);
        emit OrgAdminGranted(orgId, admin);
    }

    function revokeOrgAdmin(bytes32 orgId, address admin)
        external
        onlyRole(PLATFORM_ADMIN_ROLE)
    {
        _revokeRole(_orgRole(orgId, ORG_ADMIN_ROLE), admin);
        emit OrgAdminRevoked(orgId, admin);
    }

    // Global pause
    function pause() external onlyRole(PLATFORM_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(PLATFORM_ADMIN_ROLE) { _unpause(); }

    // Per-org pause
    function pauseOrg(bytes32 orgId) external onlyRole(PLATFORM_ADMIN_ROLE) {
        require(orgs[orgId].exists, "No org");
        orgPaused[orgId] = true;
        emit OrgPaused(orgId, msg.sender);
    }

    function unpauseOrg(bytes32 orgId) external onlyRole(PLATFORM_ADMIN_ROLE) {
        require(orgs[orgId].exists, "No org");
        orgPaused[orgId] = false;
        emit OrgUnpaused(orgId, msg.sender);
    }

    // ======== User Management ========
    function registerUser(bytes32 orgId, bytes32 userId, string calldata did, string calldata displayName)
        external
        whenNotPaused
        whenOrgNotPaused(orgId)
        onlyOrgAdmin(orgId)
    {
        require(orgs[orgId].exists, "No org");
        require(!users[orgId][userId].exists, "User exists");

        users[orgId][userId] = User(true, did, displayName);
        emit UserRegistered(orgId, userId, did, displayName);
    }

    function updateUser(bytes32 orgId, bytes32 userId, string calldata did, string calldata displayName)
        external
        whenNotPaused
        whenOrgNotPaused(orgId)
        onlyOrgAdmin(orgId)
    {
        require(users[orgId][userId].exists, "No user");
        users[orgId][userId].did = did;
        users[orgId][userId].displayName = displayName;
        emit UserUpdated(orgId, userId, did, displayName);
    }

    // ======== Log Storage ========
    function saveLog(
        bytes32 orgId,
        bytes32 userId,
        LogType logType,
        bytes32 logHash,
        string calldata refURI
    )
        external
        whenNotPaused
        whenOrgNotPaused(orgId)
        onlyOrgAdmin(orgId)
    {
        require(orgs[orgId].exists, "No org");
        require(users[orgId][userId].exists, "No user");
        require(logHash != bytes32(0), "Empty hash");

        uint256 newId = orgs[orgId].nextLogId++;
        bytes32 userKey = keccak256(abi.encode(orgId, userId));

        logs[orgId][newId] = LogEntry(
            newId,
            orgId,
            userKey,
            logType,
            logHash,
            refURI,
            uint64(block.timestamp),
            msg.sender
        );

        emit LogSaved(orgId, newId, userKey, logType, logHash, refURI);
    }

    // ======== Read & Verify ========
    function getLog(bytes32 orgId, uint256 logId) external view returns (LogEntry memory) {
        return logs[orgId][logId];
    }

    function getUser(bytes32 orgId, bytes32 userId) external view returns (User memory) {
        return users[orgId][userId];
    }

    function orgExists(bytes32 orgId) external view returns (bool) {
        return orgs[orgId].exists;
    }

    function verifyLog(bytes32 orgId, uint256 logId, bytes calldata rawLog) external view returns (bool) {
        LogEntry memory entry = logs[orgId][logId];
        require(entry.logId != 0, "No log");
        return keccak256(rawLog) == entry.logHash;
    }
}
