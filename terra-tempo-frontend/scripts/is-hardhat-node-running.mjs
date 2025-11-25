import http from 'http';

const HARDHAT_NODE_URL = 'http://127.0.0.1:8545';

function checkHardhatNode() {
  return new Promise((resolve) => {
    const options = {
      method: 'POST',
      timeout: 2000,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(HARDHAT_NODE_URL, options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'net_version',
      params: [],
      id: 1,
    }));

    req.end();
  });
}

async function main() {
  console.log('Checking if Hardhat node is running...');
  
  const isRunning = await checkHardhatNode();
  
  if (isRunning) {
    console.log('✓ Hardhat node is running');
    process.exit(0);
  } else {
    console.error('✗ Hardhat node is not running');
    console.log('\nPlease start the Hardhat node:');
    console.log('  cd fhevm-hardhat-template');
    console.log('  npx hardhat node');
    console.log('\nThen deploy the contracts:');
    console.log('  npx hardhat deploy --network localhost');
    process.exit(1);
  }
}

main();


