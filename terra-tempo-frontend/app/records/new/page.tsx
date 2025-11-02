'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletPersistence } from '../../../hooks/useWalletPersistence';
import { useTerraTempoContract } from '../../../hooks/useTerraTempoContract';
import { useFhevm } from '../../../fhevm/useFhevm';
import { CROP_TYPES, FERTILIZER_TYPES, SOIL_TYPES, WEATHER_SUMMARIES, QUALITY_GRADES, ROUTES } from '../../../lib/constants';

export default function NewRecordPage() {
  const router = useRouter();
  const { isConnected, provider, chainId } = useWalletPersistence();
  const { submitRecord } = useTerraTempoContract(provider, chainId);
  const { instance } = useFhevm();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cropType: '0',
    plantingDate: '',
    harvestDate: '',
    landArea: '',
    seedsUsed: '',
    waterUsage: '',
    fertilizerAmount: '',
    fertilizerType: '0',
    pesticideAmount: '',
    laborHours: '',
    equipmentCost: '',
    actualYield: '',
    qualityGrade: '0',
    soilType: '0',
    weatherSummary: '0',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !instance) {
      setError('Please connect wallet and initialize FHEVM');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      console.log('🔐 Starting encryption process...');

      // NOTE: Contract is currently simplified to accept only 3 core fields:
      // cropType, landArea, actualYield
      // Full 15-field version would require resolving "Stack Too Deep" error
      
      if (!provider || !chainId) {
        throw new Error('Provider not available');
      }

      // Get contract address
      const network = chainId === 31337 ? 'localhost' : 'sepolia';
      const contractAddress = await import('../../../abi/TerraTempoCoreAddresses').then(
        mod => mod.getTerraTempoCoreAddress(network)
      );
      
      if (!contractAddress) {
        throw new Error(`Contract not deployed on ${network}`);
      }

      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // For Mock mode, use addresses as-is (MockFhevmInstance may handle checksumming internally)
      // For real mode, ensure addresses are checksummed
      const { getAddress } = await import('ethers');
      const checksummedContractAddress = chainId === 31337 ? contractAddress : getAddress(contractAddress);
      const checksummedUserAddress = chainId === 31337 ? userAddress : getAddress(userAddress);

      // Prepare values
      const cropTypeValue = parseInt(formData.cropType);
      const landAreaValue = Math.floor(parseFloat(formData.landArea) * 100); // Scale by 100
      const actualYieldValue = parseInt(formData.actualYield);

      if (isNaN(cropTypeValue) || isNaN(landAreaValue) || isNaN(actualYieldValue)) {
        throw new Error('Please fill in all required fields with valid numbers');
      }

      console.log('Values to encrypt:', { cropTypeValue, landAreaValue, actualYieldValue });
      
      // Validate instance and addresses
      if (!instance) {
        throw new Error('FHEVM instance not initialized');
      }

      // Check if createEncryptedInput method exists
      if (typeof instance.createEncryptedInput !== 'function') {
        console.error('Instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
        throw new Error('FHEVM instance does not have createEncryptedInput method');
      }

      if (!checksummedContractAddress || !checksummedContractAddress.startsWith('0x')) {
        throw new Error(`Invalid contract address: ${checksummedContractAddress}`);
      }
      if (!checksummedUserAddress || !checksummedUserAddress.startsWith('0x')) {
        throw new Error(`Invalid user address: ${checksummedUserAddress}`);
      }

      // Verify contract exists on chain (for Mock mode, this helps catch deployment issues)
      try {
        const code = await provider.getCode(checksummedContractAddress);
        if (code === '0x' || code === '0x0') {
          throw new Error(`Contract not deployed at ${checksummedContractAddress}. Please deploy the contract first.`);
        }
        console.log('✓ Contract verified on chain');
      } catch (err: any) {
        if (err.message.includes('Contract not deployed')) {
          throw err;
        }
        console.warn('⚠️ Could not verify contract on chain:', err.message);
      }

      console.log('Creating encrypted input with:', {
        contractAddress: checksummedContractAddress,
        userAddress: checksummedUserAddress,
        contractAddressLength: checksummedContractAddress.length,
        userAddressLength: checksummedUserAddress.length,
        instanceMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).filter(m => !m.startsWith('_')),
      });

      // Create encrypted input using FHEVM instance (synchronous, not async)
      // FHEVM v0.9: createEncryptedInput is synchronous
      // Use checksummed addresses (required by FHEVM)
      // NOTE: For Mock mode, the contract must be deployed on the Hardhat node
      let encryptedInput;
      try {
        encryptedInput = instance.createEncryptedInput(checksummedContractAddress, checksummedUserAddress);
      } catch (err: any) {
        console.error('Failed to create encrypted input:', err);
        throw new Error(`Failed to create encrypted input: ${err.message || err}`);
      }
      
      // Add values to encrypted input (all as 32-bit)
      encryptedInput.add32(cropTypeValue);
      encryptedInput.add32(landAreaValue);
      encryptedInput.add32(actualYieldValue);

      // Encrypt and get handles + proof (async)
      const encrypted = await encryptedInput.encrypt();
      
      console.log('✓ Data encrypted (3 core fields)');
      console.log('  - Handles:', encrypted.handles.length);
      console.log('  - InputProof length:', encrypted.inputProof.length);

      // Build parameter array matching contract signature:
      // submitCropRecord(externalEuint32, bytes, externalEuint32, bytes, externalEuint32, bytes)
      const encryptedValues = [
        encrypted.handles[0],  // cropType handle
        encrypted.inputProof,
        encrypted.handles[1],  // landArea handle
        encrypted.inputProof,
        encrypted.handles[2],  // actualYield handle
        encrypted.inputProof,
      ];

      console.log('📤 Submitting to blockchain...');

      const receipt = await submitRecord(encryptedValues);
      
      console.log('✓ Transaction confirmed:', receipt.hash);
      
      alert('Crop record submitted successfully! Transaction: ' + receipt.hash);
      router.push(ROUTES.RECORDS);
      
    } catch (err: any) {
      console.error('Submit failed:', err);
      setError(err.message || 'Failed to submit record');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to submit crop records
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
        Submit New Crop Record
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        All data will be encrypted before submission. Only you can decrypt your own records.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger text-danger rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Basic Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Crop Type *
              </label>
              <select
                name="cropType"
                value={formData.cropType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {CROP_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Land Area (hectares) *
              </label>
              <input
                type="number"
                step="0.01"
                name="landArea"
                value={formData.landArea}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Input Data */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Resources Used
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Seeds Used (kg) *
              </label>
              <input
                type="number"
                name="seedsUsed"
                value={formData.seedsUsed}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Water Usage (liters) *
              </label>
              <input
                type="number"
                name="waterUsage"
                value={formData.waterUsage}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Fertilizer Amount (kg) *
              </label>
              <input
                type="number"
                name="fertilizerAmount"
                value={formData.fertilizerAmount}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Fertilizer Type *
              </label>
              <select
                name="fertilizerType"
                value={formData.fertilizerType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {FERTILIZER_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Labor Hours *
              </label>
              <input
                type="number"
                name="laborHours"
                value={formData.laborHours}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Pesticide Amount (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                name="pesticideAmount"
                value={formData.pesticideAmount}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Output Data */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Output Data
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Actual Yield (kg) *
              </label>
              <input
                type="number"
                name="actualYield"
                value={formData.actualYield}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Quality Grade *
              </label>
              <select
                name="qualityGrade"
                value={formData.qualityGrade}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {QUALITY_GRADES.map(grade => (
                  <option key={grade.value} value={grade.value}>{grade.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Soil Type *
              </label>
              <select
                name="soilType"
                value={formData.soilType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {SOIL_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Weather Summary *
              </label>
              <select
                name="weatherSummary"
                value={formData.weatherSummary}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {WEATHER_SUMMARIES.map(weather => (
                  <option key={weather.value} value={weather.value}>{weather.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-gray-400 text-white rounded-lg transition font-semibold"
          >
            {isSubmitting ? 'Encrypting & Submitting...' : 'Submit Record'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

