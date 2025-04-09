const { spawn } = require('child_process');

function floorpython({ building_description }) {
  return new Promise((resolve, reject) => {
    const py = spawn('python', ['fe/Final/image_gen.py']);

    let stdout = '';
    let stderr = '';

    py.stdin.write(JSON.stringify({ building_description }));
    py.stdin.end();

    py.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    py.stderr.on('data', (data) => {
      stderr += data.toString(); // this is where ✅ logs go now
    });

    py.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || `Python script exited with code ${code}`));
      }
      try {
        // Keep only the last JSON-looking line
        const lines = stdout.trim().split('\n');
        const lastJsonLine = lines.reverse().find(line => line.trim().startsWith('{'));
        const result = JSON.parse(lastJsonLine);
        resolve([result.floor_plan, result.front_view]);
      } catch (err) {
        reject(new Error("Failed to parse Python output: " + err.message));
      }
      
    });
  });
}

module.exports = { floorpython };