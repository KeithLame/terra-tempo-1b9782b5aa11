/**
 * Application constants for Terra Tempo
 */

// Network configurations
export const NETWORKS = {
  LOCALHOST: {
    chainId: 31337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
  },
  SEPOLIA: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://rpc.sepolia.org',
  },
} as const;

// Storage keys
export const STORAGE_KEYS = {
  WALLET_CONNECTED: 'wallet.connected',
  WALLET_CONNECTOR_ID: 'wallet.lastConnectorId',
  WALLET_ACCOUNTS: 'wallet.lastAccounts',
  WALLET_CHAIN_ID: 'wallet.lastChainId',
  FHEVM_DECRYPTION_SIGNATURE: (address: string) =>
    `fhevm.decryptionSignature.${address.toLowerCase()}`,
  THEME_MODE: 'theme.mode',
  SPACING_MODE: 'spacing.mode',
} as const;

// Crop types
export const CROP_TYPES = [
  { value: 0, label: 'Wheat' },
  { value: 1, label: 'Corn' },
  { value: 2, label: 'Rice' },
  { value: 3, label: 'Vegetables' },
  { value: 4, label: 'Fruits' },
  { value: 5, label: 'Other' },
] as const;

// Quality grades
export const QUALITY_GRADES = [
  { value: 0, label: 'Grade A' },
  { value: 1, label: 'Grade B' },
  { value: 2, label: 'Grade C' },
  { value: 3, label: 'Grade D' },
] as const;

// Soil types
export const SOIL_TYPES = [
  { value: 0, label: 'Clay' },
  { value: 1, label: 'Sandy' },
  { value: 2, label: 'Loam' },
  { value: 3, label: 'Silt' },
] as const;

// Weather summaries
export const WEATHER_SUMMARIES = [
  { value: 0, label: 'Normal' },
  { value: 1, label: 'Drought' },
  { value: 2, label: 'Flood' },
  { value: 3, label: 'Storm' },
] as const;

// Fertilizer types
export const FERTILIZER_TYPES = [
  { value: 0, label: 'Organic' },
  { value: 1, label: 'Chemical' },
  { value: 2, label: 'Mixed' },
  { value: 3, label: 'None' },
] as const;

// Knowledge base categories
export const KNOWLEDGE_CATEGORIES = [
  { value: 0, label: 'Wheat Farming' },
  { value: 1, label: 'Corn Farming' },
  { value: 2, label: 'Rice Farming' },
  { value: 3, label: 'Vegetable Farming' },
  { value: 4, label: 'Fruit Farming' },
  { value: 5, label: 'General Best Practices' },
  { value: 6, label: 'Irrigation' },
  { value: 7, label: 'Pest Control' },
  { value: 8, label: 'Soil Management' },
] as const;

// App routes
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  RECORDS: '/records',
  RECORDS_NEW: '/records/new',
  RECORDS_DETAIL: (id: string) => `/records/detail?id=${id}`,
  ANALYTICS: '/analytics',
  ANALYTICS_PREDICTION: '/analytics/prediction',
  EXPERT: '/expert',
  KNOWLEDGE: '/knowledge',
  KNOWLEDGE_ARTICLE: (id: string) => `/knowledge/detail?id=${id}`,
} as const;

// Transaction confirmations
export const TX_CONFIRMATIONS = 1;

// Minimum aggregation threshold for expert stats
export const MIN_AGGREGATION_THRESHOLD = 10;

