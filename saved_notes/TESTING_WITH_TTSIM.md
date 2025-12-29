# Testing Extension Lessons with ttsim

## Overview

This document outlines how to use **ttsim** (Tenstorrent's full-system simulator) to create automated tests for the extension's walkthrough lessons. ttsim allows us to validate lesson commands and scripts without requiring physical hardware.

## What is ttsim?

- **Full-system simulator** for Wormhole and Blackhole architectures
- Runs on any Linux/x86_64 system without hardware
- Provides a virtual TT device via environment variable (`TT_METAL_SIMULATOR`)
- Slower than silicon but **fast enough for unit tests**
- Perfect for CI/CD pipelines and development validation

**Repository:** https://github.com/tenstorrent/ttsim

## What Can Be Tested

### ✅ Can Test (Practical for Unit Tests)

| Lesson | Test Coverage | Test Value |
|--------|---------------|------------|
| **Lesson 2** | Programming examples (add 2 integers) | ⭐⭐⭐⭐⭐ High |
| **Lesson 13** | TT-Metalium basic operations | ⭐⭐⭐⭐⭐ High |
| **Script templates** | Python syntax, imports | ⭐⭐⭐⭐ Medium |
| **TTNN operations** | Basic tensor operations | ⭐⭐⭐⭐ Medium |

### ❌ Cannot Test (Too Slow or Incompatible)

| Lesson | Reason |
|--------|--------|
| **Lesson 1** | `tt-smi` doesn't work with simulator (requires real hardware) |
| **Lessons 3-9** | Full model inference too slow (hours per query vs seconds) |
| **Lessons 10-12** | Compiler workloads require real hardware performance |
| **vLLM** | Production server too slow for practical testing |

## Test Infrastructure Setup

### 1. Install Dependencies

```bash
# Add to package.json
npm install --save-dev mocha @types/mocha chai @types/chai
```

### 2. Download ttsim

```bash
# Create test resources directory
mkdir -p test/resources

# Download simulator
wget -O test/resources/libttsim_wh.so \
  https://github.com/tenstorrent/ttsim/releases/latest/download/libttsim_wh.so
```

### 3. Create Test Helper Script

**File:** `test/setup-ttsim.sh`

```bash
#!/bin/bash

# Test setup script for ttsim
set -e

# Ensure TT_METAL_HOME is set
if [ -z "$TT_METAL_HOME" ]; then
  echo "Error: TT_METAL_HOME not set"
  exit 1
fi

# Setup simulator directory
TTSIM_DIR="${TTSIM_DIR:-$HOME/ttsim}"
mkdir -p "$TTSIM_DIR"

# Copy simulator (assuming it's in test/resources)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cp "$REPO_ROOT/test/resources/libttsim_wh.so" "$TTSIM_DIR/"

# Copy SOC descriptor
cp "$TT_METAL_HOME/tt_metal/soc_descriptors/wormhole_b0_80_arch.yaml" \
   "$TTSIM_DIR/soc_descriptor.yaml"

# Export environment variables
export TT_METAL_SIMULATOR="$TTSIM_DIR/libttsim_wh.so"
export TT_METAL_SLOW_DISPATCH_MODE=1

echo "✓ ttsim configured at $TTSIM_DIR"
echo "✓ TT_METAL_SIMULATOR=$TT_METAL_SIMULATOR"
echo "✓ TT_METAL_SLOW_DISPATCH_MODE=$TT_METAL_SLOW_DISPATCH_MODE"
```

### 4. Create Test Directory Structure

```
test/
├── setup-ttsim.sh           # ttsim setup helper
├── resources/
│   └── libttsim_wh.so       # Simulator binary (downloaded)
├── lesson-tests/
│   ├── lesson02.test.ts     # Test Lesson 2 (verify installation)
│   ├── lesson13.test.ts     # Test Lesson 13 (TT-Metalium)
│   └── templates.test.ts    # Test script templates
└── integration/
    └── ttnn-basic.test.ts   # Test basic TTNN operations
```

## Specific Test Cases

### Test 1: Lesson 2 - Verify Installation (Programming Example)

**What we test:** The `metal_example_add_2_integers_in_riscv` program works

**File:** `test/lesson-tests/lesson02.test.ts`

```typescript
import { expect } from 'chai';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

describe('Lesson 2: Verify Installation', () => {
  before(async function() {
    this.timeout(30000); // Setup can take time

    // Run setup-ttsim.sh
    const setupScript = path.join(__dirname, '..', 'setup-ttsim.sh');
    await execAsync(`bash ${setupScript}`);
  });

  it('should run metal_example_add_2_integers_in_riscv', async function() {
    this.timeout(60000); // Simulator is slower

    const ttMetalHome = process.env.TT_METAL_HOME;
    if (!ttMetalHome) {
      throw new Error('TT_METAL_HOME not set');
    }

    const examplePath = path.join(
      ttMetalHome,
      'build/programming_examples/metal_example_add_2_integers_in_riscv'
    );

    const { stdout, stderr } = await execAsync(examplePath, {
      env: {
        ...process.env,
        TT_METAL_SIMULATOR: process.env.TT_METAL_SIMULATOR,
        TT_METAL_SLOW_DISPATCH_MODE: '1'
      }
    });

    // Check for success indicators
    expect(stdout).to.include('PASSED');
    // Or check for specific output
    expect(stdout).to.match(/Result:\s*\d+/);
  });
});
```

### Test 2: Script Templates Validation

**What we test:** Script templates have valid Python syntax and imports

**File:** `test/lesson-tests/templates.test.ts`

```typescript
import { expect } from 'chai';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

describe('Script Templates', () => {
  const templatesDir = path.join(__dirname, '../../content/templates');

  async function validatePythonSyntax(filePath: string): Promise<void> {
    const { stdout, stderr } = await execAsync(
      `python3 -m py_compile ${filePath}`,
      { cwd: templatesDir }
    );
    // py_compile exits with error if syntax is invalid
  }

  it('tt-chat-direct.py has valid syntax', async () => {
    await validatePythonSyntax('tt-chat-direct.py');
  });

  it('tt-api-server-direct.py has valid syntax', async () => {
    await validatePythonSyntax('tt-api-server-direct.py');
  });

  it('tt-coding-assistant.py has valid syntax', async () => {
    await validatePythonSyntax('tt-coding-assistant.py');
  });

  it('tt-forge-classifier.py has valid syntax', async () => {
    await validatePythonSyntax('tt-forge-classifier.py');
  });

  it('start-vllm-server.py has valid syntax', async () => {
    await validatePythonSyntax('start-vllm-server.py');
  });
});
```

### Test 3: Basic TTNN Operations

**What we test:** TTNN import and basic tensor operations work

**File:** `test/integration/ttnn-basic.test.ts`

```typescript
import { expect } from 'chai';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

describe('TTNN Basic Operations', () => {
  let testScript: string;

  before(async function() {
    this.timeout(30000);

    // Setup ttsim
    const setupScript = path.join(__dirname, '..', 'setup-ttsim.sh');
    await execAsync(`bash ${setupScript}`);

    // Create test script
    testScript = path.join(os.tmpdir(), 'test-ttnn-basic.py');
    await fs.writeFile(testScript, `
import ttnn
import torch

# Test TTNN import
print("✓ TTNN imported")

# Test device detection
device = ttnn.open_device(0)
print(f"✓ Device opened: {device}")

# Test basic tensor creation
tensor = torch.randn(1, 32, 32)
tt_tensor = ttnn.from_torch(tensor, device=device)
print(f"✓ Created tensor: {tt_tensor.shape}")

# Test basic operation (add)
result = ttnn.add(tt_tensor, tt_tensor)
print(f"✓ Add operation: {result.shape}")

ttnn.close_device(device)
print("✓ All tests passed")
`);
  });

  after(async () => {
    // Cleanup
    await fs.unlink(testScript).catch(() => {});
  });

  it('should import ttnn and perform basic operations', async function() {
    this.timeout(120000); // Simulator can be slow

    const { stdout } = await execAsync(`python3 ${testScript}`, {
      env: {
        ...process.env,
        TT_METAL_SIMULATOR: process.env.TT_METAL_SIMULATOR,
        TT_METAL_SLOW_DISPATCH_MODE: '1'
      }
    });

    expect(stdout).to.include('✓ TTNN imported');
    expect(stdout).to.include('✓ Device opened');
    expect(stdout).to.include('✓ Created tensor');
    expect(stdout).to.include('✓ Add operation');
    expect(stdout).to.include('✓ All tests passed');
  });
});
```

## Running Tests

### Add NPM Scripts

**Update `package.json`:**

```json
{
  "scripts": {
    "test": "mocha -r ts-node/register 'test/**/*.test.ts'",
    "test:lesson02": "mocha -r ts-node/register test/lesson-tests/lesson02.test.ts",
    "test:templates": "mocha -r ts-node/register test/lesson-tests/templates.test.ts",
    "test:ttnn": "mocha -r ts-node/register test/integration/ttnn-basic.test.ts"
  },
  "devDependencies": {
    "@types/chai": "^4.3.0",
    "@types/mocha": "^10.0.0",
    "chai": "^4.3.0",
    "mocha": "^10.0.0",
    "ts-node": "^10.9.0"
  }
}
```

### Local Testing

```bash
# Ensure TT_METAL_HOME is set
export TT_METAL_HOME=~/tt-metal

# Run all tests
npm test

# Run specific test suites
npm run test:lesson02
npm run test:templates
npm run test:ttnn
```

### CI/CD Integration (GitHub Actions)

**File:** `.github/workflows/test.yml`

```yaml
name: Test Extension Lessons

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-22.04

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Install TT-Metal
        run: |
          cd ~
          git clone https://github.com/tenstorrent/tt-metal.git
          cd tt-metal
          git checkout main
          ./install_dependencies.sh
          ./build_metal.sh --build-programming-examples
        env:
          TT_METAL_HOME: ~/tt-metal

      - name: Download ttsim
        run: |
          mkdir -p test/resources
          wget -O test/resources/libttsim_wh.so \
            https://github.com/tenstorrent/ttsim/releases/latest/download/libttsim_wh.so

      - name: Run tests
        run: npm test
        env:
          TT_METAL_HOME: ~/tt-metal
```

## Benefits of ttsim Testing

### ✅ Advantages

1. **No Hardware Required**
   - CI/CD runners can run tests
   - Developers without hardware can validate
   - Faster iteration during development

2. **Consistent Environment**
   - Same simulator version across all environments
   - Deterministic behavior
   - No hardware variability

3. **Fast Feedback**
   - Catch Python syntax errors
   - Validate TTNN imports
   - Test programming examples
   - Verify script templates

4. **Regression Prevention**
   - Detect breaking changes in templates
   - Validate environment setup
   - Test extension commands

### ⚠️ Limitations

1. **Performance Testing Not Possible**
   - Simulator is much slower than hardware
   - Cannot validate inference speed
   - Cannot test production workloads

2. **Hardware Features Limited**
   - `tt-smi` doesn't work
   - Some hardware-specific features missing
   - Fast dispatch mode unsupported

3. **Model Inference Impractical**
   - Full model inference takes hours
   - Not suitable for testing Lessons 3-9
   - Only basic operations are practical

## Recommended Testing Strategy

### Phase 1: Template Validation (Immediate Value)
- ✅ Python syntax checking
- ✅ Import validation
- ✅ Script generation correctness

**Effort:** 1-2 days
**Value:** High (catches common errors)

### Phase 2: Basic TTNN Operations (Medium Value)
- ✅ TTNN import and device creation
- ✅ Basic tensor operations
- ✅ Simple kernel execution

**Effort:** 2-3 days
**Value:** Medium (validates environment)

### Phase 3: Programming Examples (High Value)
- ✅ Lesson 2 verification
- ✅ TT-Metalium basic operations
- ✅ Kernel compilation tests

**Effort:** 3-5 days
**Value:** High (validates core functionality)

### Phase 4: CI/CD Integration (Long-term Value)
- ✅ Automated testing on PRs
- ✅ Regression detection
- ✅ Release validation

**Effort:** 2-3 days
**Value:** High (ongoing quality assurance)

## Next Steps

1. **Install dependencies:**
   ```bash
   npm install --save-dev mocha @types/mocha chai @types/chai ts-node
   ```

2. **Download ttsim:**
   ```bash
   mkdir -p test/resources
   wget -O test/resources/libttsim_wh.so \
     https://github.com/tenstorrent/ttsim/releases/latest/download/libttsim_wh.so
   ```

3. **Create test directory:**
   ```bash
   mkdir -p test/{lesson-tests,integration}
   ```

4. **Start with template validation** (easiest, highest ROI)
   - Implement `templates.test.ts` first
   - Add to CI/CD
   - Expand to other tests over time

5. **Document test requirements** in README.md
   - How to run tests
   - Required environment variables
   - Known limitations

## Conclusion

ttsim provides a **practical way to test fundamental aspects** of the extension without requiring physical hardware. While it cannot replace hardware testing for inference and performance validation, it offers significant value for:

- ✅ Template validation
- ✅ Environment setup verification
- ✅ Basic TTNN operations
- ✅ Programming example validation

**Recommended approach:** Start with template validation (immediate value), then expand to TTNN operations and programming examples as time permits.
