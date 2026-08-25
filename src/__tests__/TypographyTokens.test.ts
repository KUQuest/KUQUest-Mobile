declare const require: (moduleName: string) => { readFileSync(path: string, encoding: string): string };

const { readFileSync } = require('fs');

describe('typography tokens', () => {
  it('uses unitless line-height values for native text utilities', () => {
    const stylesheet = readFileSync('src/global.css', 'utf8');

    expect(stylesheet).not.toMatch(/--text-ku-[\w-]+--line-height:\s*[\d.]+px;/);
  });
});
