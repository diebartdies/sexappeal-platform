const { spawn } = require('child_process');

console.log('🚀 Starting development server...');
console.log('   Your application will now run directly on http://localhost:5000');

// Start the server with node.
// The `shell: true` option is important for compatibility on Windows.
const server = spawn('node server.js', { stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
    console.log('\n🛑 Stopping development server...');
    server.kill('SIGINT');
    process.exit();
});