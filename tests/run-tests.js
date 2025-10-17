const { spawn } = require('child_process');
const runner = spawn(process.execPath, ['tests/jsonStore.test.js'], { stdio: 'inherit' });
runner.on('exit', code => process.exit(code));
