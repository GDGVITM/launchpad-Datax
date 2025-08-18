const { ethers } = require('ethers');
const config = require('../config');
const { logger } = require('../utils/logger');
const CryptoUtils = require('../utils/crypto');

/**
 * Blockchain Service
 * Handles blockchain interactions for ChainShield log anchoring and verification
 */
class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.chainShieldContract = null;
    this.initialized = false;
    this.orgId = null;
    
    this.initialize();
  }

  /**
   * Initialize blockchain connection with ChainShield contract
   */
  async initialize() {
    try {
      if (!config.BLOCKCHAIN_ENABLED) {
        logger.info('Blockchain service disabled');
        return;
      }

      // Initialize provider
      if (config.BLOCKCHAIN_NETWORK === 'mainnet') {
        this.provider = new ethers.providers.InfuraProvider(
          'mainnet',
          config.INFURA_PROJECT_ID
        );
      } else if (config.BLOCKCHAIN_NETWORK === 'polygon') {
        this.provider = new ethers.providers.JsonRpcProvider(
          config.POLYGON_RPC_URL
        );
      } else {
        // Default to configured RPC URL
        this.provider = new ethers.providers.JsonRpcProvider(
          config.BLOCKCHAIN_RPC_URL
        );
      }

      // Initialize wallet
      if (config.BLOCKCHAIN_PRIVATE_KEY) {
        this.wallet = new ethers.Wallet(
          config.BLOCKCHAIN_PRIVATE_KEY,
          this.provider
        );
      }

      // Initialize ChainShield contract
      if (config.CHAINSHIELD_CONTRACT_ADDRESS) {
        this.chainShieldContract = new ethers.Contract(
          config.CHAINSHIELD_CONTRACT_ADDRESS,
          this.getChainShieldABI(),
          this.wallet
        );
      }

      // Set organization ID
      this.orgId = this.generateOrgId(config.CHAINSHIELD_ORG_ID || 'default_org');

      // Verify organization exists or create it
      await this.ensureOrganizationExists();

      this.initialized = true;
      logger.info('ChainShield blockchain service initialized', {
        network: config.BLOCKCHAIN_NETWORK,
        contractAddress: config.CHAINSHIELD_CONTRACT_ADDRESS,
        orgId: this.orgId
      });
    } catch (error) {
      logger.error('Blockchain service initialization error:', error.message);
      this.initialized = false;
    }
  }

  /**
   * Ensure organization exists on ChainShield contract
   */
  async ensureOrganizationExists() {
    try {
      if (!this.chainShieldContract) {
        return;
      }

      // Check if organization exists
      const orgExists = await this.chainShieldContract.orgExists(this.orgId);
      
      if (!orgExists) {
        logger.info('Organization does not exist on ChainShield, attempting to register...');
        
        // Note: Only platform admin can register organizations
        // In production, this should be done through proper admin flow
        try {
          const tx = await this.chainShieldContract.registerOrg(
            this.orgId,
            config.CHAINSHIELD_ORG_ID || 'Cybersecurity SaaS Platform',
            this.wallet.address,
            {
              gasLimit: 200000
            }
          );
          
          await tx.wait();
          logger.info('Organization registered on ChainShield', {
            orgId: this.orgId,
            txHash: tx.hash
          });
        } catch (registerError) {
          logger.warn('Could not register organization (may need platform admin)', {
            error: registerError.message,
            orgId: this.orgId
          });
        }
      } else {
        logger.info('Organization exists on ChainShield', { orgId: this.orgId });
      }
    } catch (error) {
      logger.error('Error checking organization existence:', error.message);
    }
  }

  /**
   * Register a user on ChainShield contract
   * @param {string} userId - User ID
   * @param {string} did - Decentralized identifier
   * @param {string} displayName - User display name
   * @returns {Promise<Object>} Registration result
   */
  async registerUser(userId, did, displayName) {
    try {
      if (!this.initialized || !this.chainShieldContract) {
        throw new Error('ChainShield contract not initialized');
      }

      const userIdBytes32 = this.generateUserId(userId);

      const tx = await this.chainShieldContract.registerUser(
        this.orgId,
        userIdBytes32,
        did || `did:user:${userId}`,
        displayName || `User ${userId}`,
        {
          gasLimit: 150000
        }
      );

      const receipt = await tx.wait();

      logger.info('User registered on ChainShield', {
        userId,
        orgId: this.orgId,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      });

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      logger.error('User registration error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Anchor a log entry to ChainShield contract
   * @param {string} userId - User ID
   * @param {string} logHash - Hash of the log data
   * @param {string} logType - Type of log
   * @param {string} refURI - Reference URI (IPFS, Arweave, etc.)
   * @returns {Promise<Object>} Anchoring result
   */
  async anchorLog(userId, logHash, logType = 'App', refURI = '') {
    try {
      if (!this.initialized || !this.chainShieldContract) {
        return this.mockAnchorLog(userId, logHash, logType, refURI);
      }

      const userIdBytes32 = this.generateUserId(userId);
      const logTypeEnum = this.mapLogType(logType);

      const tx = await this.chainShieldContract.saveLog(
        this.orgId,
        userIdBytes32,
        logTypeEnum,
        logHash,
        refURI,
        {
          gasLimit: 200000
        }
      );

      const receipt = await tx.wait();

      // Extract log ID from events
      const logSavedEvent = receipt.events?.find(e => e.event === 'LogSaved');
      const logId = logSavedEvent?.args?.logId?.toString();

      logger.info('Log anchored to ChainShield', {
        userId,
        logId,
        logHash,
        logType,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      });

      return {
        success: true,
        logId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Log anchoring error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Anchor hash directly to transaction data (fallback method)
   * @param {string} hash - Hash to anchor
   * @returns {Promise<Object>} Anchoring result
   */
  async anchorHashToTransaction(hash) {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }

      // Create transaction with hash in data field
      const tx = await this.wallet.sendTransaction({
        to: this.wallet.address, // Send to self
        value: ethers.utils.parseEther('0'), // No value transfer
        data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(hash)),
        gasLimit: 21000
      });

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      logger.error('Hash anchoring error:', error.message);
      throw error;
    }
  }

  /**
   * Verify log on ChainShield contract
   * @param {string} logId - Log ID on blockchain
   * @param {string} rawLogData - Raw log data to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyLogOnChain(logId, rawLogData) {
    try {
      if (!this.initialized || !this.chainShieldContract) {
        return this.mockVerifyLog(logId, rawLogData);
      }

      // Get log entry from contract
      const logEntry = await this.chainShieldContract.getLog(this.orgId, logId);
      
      if (logEntry.logId === 0) {
        return {
          verified: false,
          reason: 'Log not found on blockchain'
        };
      }

      // Verify the log using contract's verify function
      const isValid = await this.chainShieldContract.verifyLog(
        this.orgId,
        logId,
        ethers.utils.toUtf8Bytes(rawLogData)
      );

      return {
        verified: isValid,
        data: {
          logId: logEntry.logId.toString(),
          orgId: logEntry.orgId,
          userKey: logEntry.userKey,
          logType: logEntry.logType,
          logHash: logEntry.logHash,
          refURI: logEntry.refURI,
          timestamp: new Date(logEntry.timestamp * 1000),
          submittedBy: logEntry.submittedBy
        }
      };
    } catch (error) {
      logger.error('ChainShield verification error:', error.message);
      return {
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Get log from ChainShield contract
   * @param {string} logId - Log ID
   * @returns {Promise<Object>} Log entry
   */
  async getLogFromChain(logId) {
    try {
      if (!this.initialized || !this.chainShieldContract) {
        throw new Error('ChainShield contract not initialized');
      }

      const logEntry = await this.chainShieldContract.getLog(this.orgId, logId);
      
      if (logEntry.logId === 0) {
        throw new Error('Log not found');
      }

      return {
        logId: logEntry.logId.toString(),
        orgId: logEntry.orgId,
        userKey: logEntry.userKey,
        logType: this.reverseMapLogType(logEntry.logType),
        logHash: logEntry.logHash,
        refURI: logEntry.refURI,
        timestamp: new Date(logEntry.timestamp * 1000),
        submittedBy: logEntry.submittedBy
      };
    } catch (error) {
      logger.error('Get log from chain error:', error.message);
      throw error;
    }
  }

  /**
   * Batch anchor multiple logs (legacy support)
   * @param {string} batchHash - Hash of the log batch
   * @param {Array} logIds - Array of log IDs
   * @returns {Promise<Object>} Anchoring result
   */
  async anchorBatch(batchHash, logIds) {
    try {
      // For ChainShield, we anchor logs individually
      // This method provides compatibility with existing batch processing
      
      if (!this.initialized || !config.BLOCKCHAIN_ENABLED) {
        return this.mockAnchorBatch(batchHash, logIds);
      }

      // Store batch information as a special log entry
      const batchResult = await this.anchorLog(
        'system',
        batchHash,
        'App',
        `batch:${logIds.length}:${Date.now()}`
      );

      if (batchResult.success) {
        logger.info('Batch metadata anchored to ChainShield', {
          batchHash,
          logCount: logIds.length,
          transactionHash: batchResult.transactionHash
        });
      }

      return batchResult;
    } catch (error) {
      logger.error('Batch anchoring error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify contract logs for anchored data
   * @param {Object} receipt - Transaction receipt
   * @param {string} expectedHash - Expected hash
   * @returns {Object} Verification result
   */
  async verifyContractLogs(receipt, expectedHash) {
    try {
      const logs = receipt.logs;
      
      for (const log of logs) {
        if (log.address.toLowerCase() === this.contract.address.toLowerCase()) {
          const parsedLog = this.contract.interface.parseLog(log);
          
          if (parsedLog.name === 'LogBatchAnchored') {
            const anchoredHash = parsedLog.args.batchHash;
            return {
              verified: anchoredHash === expectedHash,
              hash: anchoredHash
            };
          }
        }
      }

      return {
        verified: false,
        hash: null
      };
    } catch (error) {
      logger.error('Contract log verification error:', error.message);
      return {
        verified: false,
        hash: null
      };
    }
  }

  /**
   * Get blockchain network status
   * @returns {Promise<Object>} Network status
   */
  async getNetworkStatus() {
    try {
      if (!this.initialized || !this.provider) {
        return {
          connected: false,
          network: 'disconnected'
        };
      }

      const [network, blockNumber, gasPrice] = await Promise.all([
        this.provider.getNetwork(),
        this.provider.getBlockNumber(),
        this.provider.getGasPrice()
      ]);

      let walletBalance = null;
      if (this.wallet) {
        walletBalance = await this.wallet.getBalance();
      }

      return {
        connected: true,
        network: network.name,
        chainId: network.chainId,
        blockNumber,
        gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
        walletBalance: walletBalance ? ethers.utils.formatEther(walletBalance) : null
      };
    } catch (error) {
      logger.error('Network status error:', error.message);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Estimate gas for anchoring operation
   * @param {string} batchHash - Batch hash
   * @param {number} logCount - Number of logs in batch
   * @returns {Promise<Object>} Gas estimation
   */
  async estimateAnchoringGas(batchHash, logCount) {
    try {
      if (!this.initialized || !this.contract) {
        return {
          estimated: false,
          reason: 'Contract not available'
        };
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const gasEstimate = await this.contract.estimateGas.anchorLogBatch(
        batchHash,
        timestamp,
        logCount
      );

      const gasPrice = await this.provider.getGasPrice();
      const gasCost = gasEstimate.mul(gasPrice);

      return {
        estimated: true,
        gasLimit: gasEstimate.toString(),
        gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
        estimatedCost: ethers.utils.formatEther(gasCost),
        estimatedCostWei: gasCost.toString()
      };
    } catch (error) {
      logger.error('Gas estimation error:', error.message);
      return {
        estimated: false,
        error: error.message
      };
    }
  }

  /**
   * Get anchoring history from blockchain
   * @param {number} limit - Number of records to fetch
   * @returns {Promise<Array>} Anchoring history
   */
  async getAnchoringHistory(limit = 10) {
    try {
      if (!this.initialized || !this.contract) {
        return [];
      }

      // Get past events from contract
      const filter = this.contract.filters.LogBatchAnchored();
      const events = await this.contract.queryFilter(filter, -1000); // Last 1000 blocks

      const history = await Promise.all(
        events.slice(-limit).map(async (event) => {
          const block = await this.provider.getBlock(event.blockNumber);
          
          return {
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            blockHash: event.blockHash,
            timestamp: new Date(block.timestamp * 1000),
            batchHash: event.args.batchHash,
            logCount: event.args.logCount.toNumber(),
            anchorTimestamp: new Date(event.args.timestamp.toNumber() * 1000)
          };
        })
      );

      return history.reverse(); // Most recent first
    } catch (error) {
      logger.error('Anchoring history error:', error.message);
      return [];
    }
  }

  /**
   * Mock anchoring for testing/development
   * @param {string} userId - User ID
   * @param {string} logHash - Log hash
   * @param {string} logType - Log type
   * @param {string} refURI - Reference URI
   * @returns {Object} Mock result
   */
  mockAnchorLog(userId, logHash, logType, refURI) {
    const mockTxHash = '0x' + CryptoUtils.generateHash(logHash + Date.now()).substring(0, 64);
    const mockBlockNumber = Math.floor(Math.random() * 1000000) + 15000000;
    const mockLogId = Math.floor(Math.random() * 10000) + 1;

    logger.info('Mock log anchoring', {
      userId,
      logHash,
      logType,
      refURI,
      mockTxHash,
      mockBlockNumber,
      mockLogId
    });

    return {
      success: true,
      logId: mockLogId.toString(),
      transactionHash: mockTxHash,
      blockNumber: mockBlockNumber,
      gasUsed: '150000',
      timestamp: Date.now()
    };
  }

  /**
   * Mock batch anchoring for testing/development
   * @param {string} batchHash - Batch hash
   * @param {Array} logIds - Log IDs
   * @returns {Object} Mock result
   */
  mockAnchorBatch(batchHash, logIds) {
    const mockTxHash = '0x' + CryptoUtils.generateHash(batchHash + Date.now()).substring(0, 64);
    const mockBlockNumber = Math.floor(Math.random() * 1000000) + 15000000;

    logger.info('Mock batch anchoring', {
      batchHash,
      logCount: logIds.length,
      mockTxHash,
      mockBlockNumber
    });

    return {
      success: true,
      transactionHash: mockTxHash,
      blockNumber: mockBlockNumber,
      gasUsed: '200000',
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * Mock verification for testing/development
   * @param {string} logId - Log ID
   * @param {string} rawLogData - Raw log data
   * @returns {Object} Mock verification result
   */
  mockVerifyLog(logId, rawLogData) {
    const mockHash = CryptoUtils.generateHash(rawLogData);
    
    return {
      verified: true,
      data: {
        logId: logId,
        orgId: this.orgId,
        userKey: '0x' + CryptoUtils.generateHash('mock_user').substring(0, 64),
        logType: 'application',
        logHash: '0x' + mockHash.substring(0, 64),
        refURI: `mock://reference/${logId}`,
        timestamp: new Date(),
        submittedBy: this.wallet?.address || '0x0000000000000000000000000000000000000000'
      }
    };
  }

  /**
   * Get ChainShield contract ABI
   * @returns {Array} Contract ABI
   */
  getChainShieldABI() {
    return [
      // Constructor
      {
        "inputs": [{"internalType": "address", "name": "platformAdmin", "type": "address"}],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      // Events
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "bytes32", "name": "orgId", "type": "bytes32"},
          {"indexed": false, "internalType": "string", "name": "name", "type": "string"},
          {"indexed": true, "internalType": "address", "name": "admin", "type": "address"}
        ],
        "name": "OrgRegistered",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "bytes32", "name": "orgId", "type": "bytes32"},
          {"indexed": true, "internalType": "bytes32", "name": "userId", "type": "bytes32"},
          {"indexed": false, "internalType": "string", "name": "did", "type": "string"},
          {"indexed": false, "internalType": "string", "name": "displayName", "type": "string"}
        ],
        "name": "UserRegistered",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "bytes32", "name": "orgId", "type": "bytes32"},
          {"indexed": true, "internalType": "uint256", "name": "logId", "type": "uint256"},
          {"indexed": true, "internalType": "bytes32", "name": "userKey", "type": "bytes32"},
          {"indexed": false, "internalType": "uint8", "name": "logType", "type": "uint8"},
          {"indexed": false, "internalType": "bytes32", "name": "logHash", "type": "bytes32"},
          {"indexed": false, "internalType": "string", "name": "refURI", "type": "string"}
        ],
        "name": "LogSaved",
        "type": "event"
      },
      // Main functions
      {
        "inputs": [
          {"internalType": "bytes32", "name": "orgId", "type": "bytes32"},
          {"internalType": "string", "name": "name", "type": "string"},
          {"internalType": "address", "name": "orgAdmin", "type": "address"}
        ],
        "name": "registerOrg",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "bytes32", "name": "orgId", "type": "bytes32"},
          {"internalType": "bytes32", "name": "userId", "type": "bytes32"},
          {"internalType": "string", "name": "did", "type": "string"},
          {"internalType": "string", "name": "displayName", "type": "string"}
        ],
        "name": "registerUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "bytes32", "name": "orgId", "type": "bytes32"},
          {"internalType": "bytes32", "name": "userId", "type": "bytes32"},
          {"internalType": "uint8", "name": "logType", "type": "uint8"},
          {"internalType": "bytes32", "name": "logHash", "type": "bytes32"},
          {"internalType": "string", "name": "refURI", "type": "string"}
        ],
        "name": "saveLog",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "bytes32", "name": "orgId", "type": "bytes32"},
          {"internalType": "uint256", "name": "logId", "type": "uint256"}
        ],
        "name": "getLog",
        "outputs": [
          {
            "components": [
              {"internalType": "uint256", "name": "logId", "type": "uint256"},
              {"internalType": "bytes32", "name": "orgId", "type": "bytes32"},
              {"internalType": "bytes32", "name": "userKey", "type": "bytes32"},
              {"internalType": "uint8", "name": "logType", "type": "uint8"},
              {"internalType": "bytes32", "name": "logHash", "type": "bytes32"},
              {"internalType": "string", "name": "refURI", "type": "string"},
              {"internalType": "uint64", "name": "timestamp", "type": "uint64"},
              {"internalType": "address", "name": "submittedBy", "type": "address"}
            ],
            "internalType": "struct ChainShield.LogEntry",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "bytes32", "name": "orgId", "type": "bytes32"}],
        "name": "orgExists",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "bytes32", "name": "orgId", "type": "bytes32"},
          {"internalType": "uint256", "name": "logId", "type": "uint256"},
          {"internalType": "bytes", "name": "rawLog", "type": "bytes"}
        ],
        "name": "verifyLog",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      }
    ];
  }

  /**
   * Generate organization ID as bytes32
   * @param {string} orgName - Organization name
   * @returns {string} Bytes32 organization ID
   */
  generateOrgId(orgName) {
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(orgName));
  }

  /**
   * Generate user ID as bytes32
   * @param {string} userId - User ID
   * @returns {string} Bytes32 user ID
   */
  generateUserId(userId) {
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(userId));
  }

  /**
   * Map log type to contract enum
   * @param {string} logType - Log type string
   * @returns {number} Enum value
   */
  mapLogType(logType) {
    const typeMap = {
      'authentication': 0,     // Auth
      'file_access': 1,        // FileAccess
      'network': 2,            // Network
      'firewall': 3,           // Firewall
      'application': 4,        // App
      'email': 5,              // Email
      'transaction': 6,        // Txn
      'user_login': 0,         // Auth
      'user_logout': 0,        // Auth
      'data_access': 1,        // FileAccess
      'system_event': 4,       // App
      'threat_detected': 2,    // Network
      'alert_generated': 4     // App
    };
    
    return typeMap[logType.toLowerCase()] || 4; // Default to App
  }

  /**
   * Reverse map log type from contract enum
   * @param {number} enumValue - Enum value
   * @returns {string} Log type string
   */
  reverseMapLogType(enumValue) {
    const typeMap = {
      0: 'authentication',
      1: 'file_access',
      2: 'network',
      3: 'firewall',
      4: 'application',
      5: 'email',
      6: 'transaction'
    };
    
    return typeMap[enumValue] || 'application';
  }

  /**
   * Deploy log anchoring contract (utility function)
   * @returns {Promise<Object>} Deployment result
   */
  async deployContract() {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }

      // Simple Solidity contract bytecode (would be compiled from source)
      const contractBytecode = "0x608060405234801561001057600080fd5b50610234806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80634a8a5e471461003b578063a7e49e8714610057575b600080fd5b610055600480360381019061005091906101a6565b610087565b005b610071600480360381019061006c9190610149565b6100f8565b60405161007e9190610203565b60405180910390f35b806000836040516100989190610186565b908152602001604051809103902060000181905550426000836040516100be9190610186565b9081526020016040518091039020600101819055507f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258282426040516100f49392919061022e565b60405180910390a15050565b60008060008360405161011391906101a6565b908152602001604051809103902060000154600084604051610135919061019d565b9081526020016040518091039020600101549150915091565b60006020828403121561016057600080fd5b813567ffffffffffffffff81111561017757600080fd5b61018384828501610198565b91505092915050565b600061019782610265565b9050919050565b60006101a982610265565b9050919050565b6000602082840312156101c257600080fd5b813567ffffffffffffffff8111156101d957600080fd5b6101e584828501610198565b91505092915050565b6101f781610270565b82525050565b6000602082019050610212600083018461027a565b92915050565b6000606082019050610218600083018661027a565b610225602083018561027a565b61023260408301846101ee565b949350505050565b600081519050919050565b600082825260208201905092915050565b6000819050919050565b600061026b8261023a565b61027582610245565b935061028081610256565b8060005b838110156102b157815161029881876102bc565b96506102a38361029f565b925050600181019050610284565b5085935050505092915050565b60006102c98261023a565b6102d38185610245565b93506102e3818560208601610256565b6102ec816102f7565b840191505092915050565b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fdfea2646970667358221220c4a9c3e4d5f6789a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3564736f6c63430008070033";

      const contractFactory = new ethers.ContractFactory(
        this.getContractABI(),
        contractBytecode,
        this.wallet
      );

      const contract = await contractFactory.deploy({
        gasLimit: 500000
      });

      await contract.deployed();

      logger.info('Contract deployed', {
        address: contract.address,
        transactionHash: contract.deployTransaction.hash
      });

      return {
        address: contract.address,
        transactionHash: contract.deployTransaction.hash,
        blockNumber: contract.deployTransaction.blockNumber
      };
    } catch (error) {
      logger.error('Contract deployment error:', error.message);
      throw error;
    }
  }
}

module.exports = new BlockchainService();
