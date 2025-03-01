import { Address } from 'viem';

export const HEALTH_ATTESTATIONS_ADDRESS = "0xeE925Ab29d84e7351965F186a2C37f2cEb2b86Bb" as Address;

export const HEALTH_ATTESTATIONS_ABI = [
  {
    "inputs": [
      {"internalType": "enum HealthAttestations.ActivityType", "name": "activityType", "type": "uint8"},
      {"internalType": "string", "name": "username", "type": "string"},
      {"internalType": "uint256", "name": "value", "type": "uint256"},
      {"internalType": "uint256", "name": "date", "type": "uint256"},
      {"internalType": "uint256", "name": "streak", "type": "uint256"}
    ],
    "name": "mint",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "username", "type": "string"}],
    "name": "getUserTokens",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getAttestation",
    "outputs": [
      {"internalType": "enum HealthAttestations.ActivityType", "name": "activityType", "type": "uint8"},
      {"internalType": "string", "name": "username", "type": "string"},
      {"internalType": "uint256", "name": "value", "type": "uint256"},
      {"internalType": "uint256", "name": "date", "type": "uint256"},
      {"internalType": "uint256", "name": "streak", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const; 