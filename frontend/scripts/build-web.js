// Gera o site web: landing em "/" e o sistema (Expo) em "/app".
// A landing é HTML puro fora do bundle do Expo, então nunca entra no APK.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

execSync('npx expo export --platform web', { cwd: root, stdio: 'inherit' });

fs.mkdirSync(path.join(dist, 'app'), { recursive: true });
fs.mkdirSync(path.join(dist, 'landing'), { recursive: true });

// o index gerado pelo Expo vira a entrada do sistema
fs.renameSync(path.join(dist, 'index.html'), path.join(dist, 'app', 'index.html'));

// a landing assume a raiz do site
fs.copyFileSync(path.join(root, 'landing', 'index.html'), path.join(dist, 'index.html'));
fs.copyFileSync(path.join(root, 'assets', 'icon.png'), path.join(dist, 'landing', 'icon.png'));

console.log('OK: landing em / e sistema em /app');
