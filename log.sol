// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ChainShield – Decentralized Cybersecurity Log Registry
 * @notice Stores tamper-proof hashes of security logs scoped by organization.
 * @dev Save only hashes + optional URI (IPFS/Arweave/S3). Raw logs stay off-chain.
 *
 *  - Platform admin registers orgs and assigns org admins
 *  - Org admins register users (DIDs) for that org
 *  - Org admins submit log hashes with metadata
 *  - Auditors verify integrity by recomputing hashes off-chain or via verifyLog()
 *
 * Gas tips:
 *  - Store only keccak256(rawLogBytes) on-chain + a compact refURI
 *  - Use events for indexing/streaming (off-chain indexers like TheGraph)
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
        uint256 nextLogId; // org-scoped auto-increment id for logs
    }

    struct User {
        bool exists;
        string did;          // e.g., "did:example:123" or enterprise UID
        string displayName;  // optional
    }

    enum LogType {
        Auth,        // login, logout, mfa, privilege change
        FileAccess,  // read/write/delete
        Network,     // connection, IDS/IPS events
        Firewall,    // allow/deny
        App,         // app/system logs
        Email,       // phishing/spam detections
        Txn          // financial/business transactions
    }

    struct LogEntry {
        uint256 logId;        // auto-increment per org
        bytes32 orgId;        // tenant
        bytes32 userKey;      // keccak256(abi.encode(orgId, userId)) or a derived stable key
        LogType logType;
        bytes32 logHash;      // keccak256(rawLog)
        string  refURI;       // ipfs://... or https://... (optional)
        uint64  timestamp;    // block time cast
        address submittedBy;  // admin address that submitted
    }

    // ======== Storage ========
    // orgId => Org
    mapping(bytes32 => Org) public orgs;

    // orgId => paused?
    mapping(bytes32 => bool) public orgPaused;

    // orgId => (userId => User)
    mapping(bytes32 => mapping(bytes32 => User)) public users;

    // orgId => (logId => LogEntry)
    mapping(bytes32 => mapping(uint256 => LogEntry)) public logs;

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

    // ======== Modifiers & Role Helpers ========
    function _orgRole(bytes32 orgId, bytes32 role) internal pure returns (bytes32) {
        // Namespace the role by org
        return keccak256(abi.encodePacked(role, orgId));
    }

    modifier onlyOrgAdmin(bytes32 orgId) {
        require(hasRole(_orgRole(orgId, ORG_ADMIN_ROLE), msg.sender), "ChainShield: not org admin");
        _;
    }

    modifier whenOrgNotPaused(bytes32 orgId) {
        require(!orgPaused[orgId], "ChainShield: org paused");
        _;
    }

    // ======== Org & Admin Management ========
    function registerOrg(bytes32 orgId, string calldata name, address orgAdmin)
        external
        onlyRole(PLATFORM_ADMIN_ROLE)
    {
        require(!orgs[orgId].exists, "ChainShield: org exists");
        require(orgAdmin != address(0), "ChainShield: admin=0");

        orgs[orgId] = Org({ exists: true, name: name, nextLogId: 1 });
        _grantRole(_orgRole(orgId, ORG_ADMIN_ROLE), orgAdmin);

        emit OrgRegistered(orgId, name, orgAdmin);
        emit OrgAdminGranted(orgId, orgAdmin);
    }

    function grantOrgAdmin(bytes32 orgId, address admin)
        external
        onlyRole(PLATFORM_ADMIN_ROLE)
    {
        require(orgs[orgId].exists, "ChainShield: no org");
        require(admin != address(0), "ChainShield: admin=0");

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

    // Global pause/unpause (affects functions using whenNotPaused)
    function pause() external onlyRole(PLATFORM_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(PLATFORM_ADMIN_ROLE) { _unpause(); }

    // Per-org pause/unpause (granular kill switch)
    function pauseOrg(bytes32 orgId) external onlyRole(PLATFORM_ADMIN_ROLE) {
        require(orgs[orgId].exists, "ChainShield: no org");
        orgPaused[orgId] = true;
        emit OrgPaused(orgId, msg.sender);
    }

    function unpauseOrg(bytes32 orgId) external onlyRole(PLATFORM_ADMIN_ROLE) {
        require(orgs[orgId].exists, "ChainShield: no org");
        orgPaused[orgId] = false;
        emit OrgUnpaused(orgId, msg.sender);
    }

    // ======== User (DID) Management ========
    /**
     * @param orgId  Tenant ID (e.g., keccak256("acme"))
     * @param userId Enterprise user identifier hashed to bytes32 (off-chain) or bytes32-coded
     * @param did    DID string or enterprise UID
     * @param displayName Optional label
     */
    function registerUser(
        bytes32 orgId,
        bytes32 userId,
        string calldata did,
        string calldata displayName
    )
        external
        whenNotPaused
        whenOrgNotPaused(orgId)
        onlyOrgAdmin(orgId)
    {
        require(orgs[orgId].exists, "ChainShield: no org");
        require(!users[orgId][userId].exists, "ChainShield: user exists");

        users[orgId][userId] = User({ exists: true, did: did, displayName: displayName });
        emit UserRegistered(orgId, userId, did, displayName);
    }

    /**
     * @notice Update DID / displayName for an existing user
     */
    function updateUser(
        bytes32 orgId,
        bytes32 userId,
        string calldata did,
        string calldata displayName
    )
        external
        whenNotPaused
        whenOrgNotPaused(orgId)
        onlyOrgAdmin(orgId)
    {
        require(users[orgId][userId].exists, "ChainShield: no user");
        users[orgId][userId].did = did;
        users[orgId][userId].displayName = displayName;
        emit UserUpdated(orgId, userId, did, displayName);
    }

    // ======== Log Storage ========
    /**
     * @notice Save a log hash for a user within an org.
     * @param orgId     Tenant id
     * @param userId    Enterprise user id (bytes32)
     * @param logType   Category enum
     * @param logHash   keccak256(rawLogBytes)
     * @param refURI    ipfs://... or https://... (optional)
     */
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
        require(orgs[orgId].exists, "ChainShield: no org");
        require(users[orgId][userId].exists, "ChainShield: no user");
        require(logHash != bytes32(0), "ChainShield: empty hash");

        uint256 newId = orgs[orgId].nextLogId++;
        bytes32 userKey = keccak256(abi.encode(orgId, userId));

        logs[orgId][newId] = LogEntry({
            logId: newId,
            orgId: orgId,
            userKey: userKey,
            logType: logType,
            logHash: logHash,
            refURI: refURI,
            timestamp: uint64(block.timestamp),
            submittedBy: msg.sender
        });

        emit LogSaved(orgId, newId, userKey, logType, logHash, refURI);
    }

    // ======== Read & Verify Helpers ========
    function getLog(bytes32 orgId, uint256 logId) external view returns (LogEntry memory) {
        return logs[orgId][logId];
    }

    function getUser(bytes32 orgId, bytes32 userId) external view returns (User memory) {
        return users[orgId][userId];
    }

    /**
     * @notice Convenience on-chain verification helper
     * @dev Auditors submit the original raw log bytes; function recomputes keccak and compares.
     * @return true if keccak256(rawLog) matches the stored hash
     */
    function verifyLog(
        bytes32 orgId,
        uint256 logId,
        bytes calldata rawLog
    ) external view returns (bool) {
        LogEntry memory entry = logs[orgId][logId];
        require(entry.logId != 0, "ChainShield: no log");
        return keccak256(rawLog) == entry.logHash;
    }
}
