const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const copies = [
  ['node_modules/bootstrap/dist/css/bootstrap.min.css', 'deploy/libs/bootstrap/css/bootstrap.min.css'],
  ['node_modules/bootstrap/dist/js/bootstrap.bundle.min.js', 'deploy/libs/bootstrap/js/bootstrap.bundle.min.js'],
  ['node_modules/bootstrap-icons/font/bootstrap-icons.css', 'deploy/libs/bootstrap-icons/font/bootstrap-icons.css'],
  ['node_modules/bootstrap-icons/font/fonts', 'deploy/libs/bootstrap-icons/font/fonts'],
  ['node_modules/choices.js/public/assets/styles/choices.min.css', 'deploy/libs/choices.js/css/choices.min.css'],
  ['node_modules/choices.js/public/assets/scripts/choices.min.js', 'deploy/libs/choices.js/js/choices.min.js'],
  ['node_modules/jszip/dist/jszip.min.js', 'deploy/libs/jszip/jszip.min.js'],
  ['node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2', 'deploy/fonts/manrope/manrope-latin-wght-normal.woff2'],
  ['node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2', 'deploy/fonts/space-grotesk/space-grotesk-latin-wght-normal.woff2'],
  ['node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', 'deploy/fonts/jetbrains-mono/jetbrains-mono-latin-400-normal.woff2'],
  ['node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2', 'deploy/fonts/jetbrains-mono/jetbrains-mono-latin-500-normal.woff2'],
  ['node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2', 'deploy/fonts/jetbrains-mono/jetbrains-mono-latin-700-normal.woff2']
];

for (const fontDir of ['manrope', 'space-grotesk', 'jetbrains-mono']) {
  fs.rmSync(path.join(root, 'deploy', 'fonts', fontDir), { recursive: true, force: true });
}

for (const [from, to] of copies) {
  const source = path.join(root, from);
  const target = path.join(root, to);
  if (!fs.existsSync(source)) throw new Error(`Missing dependency asset: ${from}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true, force: true });
}

process.stdout.write('Local browser libraries copied.\n');
