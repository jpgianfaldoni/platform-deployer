const { safeRelativePath, sha256 } = require('../../scripts/vendor-terraform');

describe('Terraform source vendoring safeguards', () => {
  it('rejects paths that can escape the artifact root', () => {
    expect(() => safeRelativePath('../secrets')).toThrow();
    expect(() => safeRelativePath('/absolute')).toThrow();
  });

  it('normalizes safe paths and hashes content deterministically', () => {
    expect(safeRelativePath('workspace/tf/main.tf')).toBe('workspace/tf/main.tf');
    expect(sha256(Buffer.from('terraform'))).toBe('94dc3ea57721d541aae09b7bf2368c1e20d4c89996ff6df4349d86048877c0e7');
  });
});
