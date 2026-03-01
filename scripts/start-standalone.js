const fs = require('fs');
const path = require('path');

// Ensure required directories exist
fs.mkdirSync('.next/standalone/.next/static', { recursive: true });
fs.mkdirSync('.next/standalone/public', { recursive: true });

// Helper to copy entire directory recursively
const copyRecursiveSync = (src, dest) => {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else if (exists) {
        fs.copyFileSync(src, dest);
    }
};

// Copy static Next.js assets and public files for the standalone server
if (fs.existsSync('.next/static')) {
    console.log('Copying .next/static to .next/standalone/.next/static...');
    copyRecursiveSync('.next/static', '.next/standalone/.next/static');
}
if (fs.existsSync('public')) {
    console.log('Copying public directory to .next/standalone/public...');
    copyRecursiveSync('public', '.next/standalone/public');
}

// Start the standalone server
console.log('Starting standalone Next.js server...');
require(path.join(process.cwd(), '.next/standalone/server.js'));
