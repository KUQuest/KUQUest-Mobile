const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const dgram = require('node:dgram');

const envPath = path.resolve(__dirname, '..', '.env.local');
const defaultApiPort = 5000;

function getDefaultRouteAddress() {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket('udp4');

    socket.once('error', (error) => {
      socket.close();
      reject(error);
    });
    socket.connect(80, '1.1.1.1', () => {
      const address = socket.address();
      socket.close();
      resolve(typeof address === 'object' ? address.address : undefined);
    });
  });
}

function getFallbackAddress() {
  const interfaces = Object.values(os.networkInterfaces()).flatMap((entries) => entries ?? []);
  return interfaces.find((entry) => entry.family === 'IPv4' && !entry.internal)?.address;
}

function getApiConfig(envContent) {
  const match = envContent.match(/^EXPO_PUBLIC_API_URL=(.*)$/m);
  if (!match?.[1]) return { protocol: 'http:', port: defaultApiPort };

  const currentUrl = new URL(match[1]);
  return {
    protocol: currentUrl.protocol,
    port: currentUrl.port || defaultApiPort,
  };
}

async function main() {
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local was not found');
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const apiConfig = getApiConfig(envContent);
  const host = await getDefaultRouteAddress().catch(() => getFallbackAddress());

  if (!host) {
    throw new Error('Could not detect a local IPv4 address');
  }

  const apiUrl = `${apiConfig.protocol}//${host}:${apiConfig.port}`;
  const updatedEnv = /^EXPO_PUBLIC_API_URL=.*$/m.test(envContent)
    ? envContent.replace(/^EXPO_PUBLIC_API_URL=.*$/m, `EXPO_PUBLIC_API_URL=${apiUrl}`)
    : `${envContent.trimEnd()}\nEXPO_PUBLIC_API_URL=${apiUrl}\n`;

  fs.writeFileSync(envPath, updatedEnv);
  console.log(`Updated EXPO_PUBLIC_API_URL=${apiUrl}`);
}

main().catch((error) => {
  console.error(`Unable to update API URL: ${error.message}`);
  process.exitCode = 1;
});
