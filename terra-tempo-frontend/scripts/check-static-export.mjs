import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const APP_DIR = join(__dirname, '../app');
const COMPONENTS_DIR = join(__dirname, '../components');

const PROHIBITED_PATTERNS = [
  { pattern: /getServerSideProps/g, name: 'getServerSideProps' },
  { pattern: /getInitialProps/g, name: 'getInitialProps' },
  { pattern: /"use server"/g, name: 'Server Actions ("use server")' },
  { pattern: /from ['"]next\/headers['"]/g, name: 'next/headers import' },
  { pattern: /cookies\(\)/g, name: 'cookies()' },
  { pattern: /headers\(\)/g, name: 'headers()' },
  { pattern: /dynamic\s*=\s*['"]force-dynamic['"]/g, name: 'dynamic = "force-dynamic"' },
];

const errors = [];

async function checkFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    for (const { pattern, name } of PROHIBITED_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        errors.push({
          file: filePath,
          pattern: name,
          count: matches.length,
        });
      }
    }
  } catch (error) {
    // Skip files that can't be read
  }
}

async function checkDirectory(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and .next
        if (entry.name !== 'node_modules' && entry.name !== '.next' && !entry.name.startsWith('.')) {
          await checkDirectory(fullPath);
        }
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
        await checkFile(fullPath);
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }
}

async function checkForAPIRoutes() {
  const apiDir = join(APP_DIR, 'api');
  try {
    await fs.access(apiDir);
    errors.push({
      file: apiDir,
      pattern: 'API Routes directory (app/api)',
      count: 1,
    });
  } catch {
    // No API routes directory, good
  }
}

async function checkDynamicRoutes() {
  async function findDynamicRoutes(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const fullPath = join(dir, entry.name);
        
        // Check if directory name contains [ or ]
        if (entry.name.includes('[') || entry.name.includes(']')) {
          // Check if page.tsx exists and has generateStaticParams
          const pagePath = join(fullPath, 'page.tsx');
          try {
            const pageContent = await fs.readFile(pagePath, 'utf-8');
            if (!pageContent.includes('generateStaticParams')) {
              errors.push({
                file: pagePath,
                pattern: 'Dynamic route without generateStaticParams',
                count: 1,
              });
            }
          } catch {
            // No page.tsx, might be layout or other file
          }
        }
        
        await findDynamicRoutes(fullPath);
      }
    } catch {
      // Skip
    }
  }
  
  await findDynamicRoutes(APP_DIR);
}

async function main() {
  console.log('🔍 Checking for static export compatibility...\n');
  
  await checkForAPIRoutes();
  await checkDirectory(APP_DIR);
  await checkDirectory(COMPONENTS_DIR);
  await checkDynamicRoutes();
  
  if (errors.length > 0) {
    console.error('❌ Found issues that prevent static export:\n');
    
    for (const error of errors) {
      console.error(`  • ${error.pattern}`);
      console.error(`    File: ${error.file}`);
      console.error(`    Occurrences: ${error.count}\n`);
    }
    
    console.error('Please fix these issues before building.');
    process.exit(1);
  } else {
    console.log('✅ No static export issues found!');
    console.log('   Your app is ready for static export.\n');
    process.exit(0);
  }
}

main();


