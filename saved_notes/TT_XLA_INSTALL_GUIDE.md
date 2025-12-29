# TT-XLA Installation Guide for Cloud Image

## Your Environment
- Ubuntu
- Python 3.10.12 (cannot change)
- tt-metal at `~/tt-metal` (SHA: 9b67e09)
- Cannot change Python or tt-metal version

## Best Approach: Install TT-XLA Wheel

TT-XLA can be installed via prebuilt wheels without requiring Python 3.11 or building from source.

### Step 1: Create Virtual Environment

```bash
# Use your existing Python 3.10.12
cd ~
python3 -m venv tt-xla-venv
source tt-xla-venv/bin/activate
```

### Step 2: Install TT-XLA Wheel

```bash
# Install the PJRT plugin for Tenstorrent
pip install pjrt-plugin-tt --extra-index-url https://pypi.eng.aws.tenstorrent.com/
```

**Notes:**
- This installs the TT-XLA PJRT plugin (JAX integration)
- No compilation required
- Works with Python 3.10
- Automatically pulls compatible JAX version

**Optional: Try pre-release (nightly):**
```bash
pip install --pre pjrt-plugin-tt --extra-index-url https://pypi.eng.aws.tenstorrent.com/
```

### Step 3: Install JAX Dependencies

```bash
# Install JAX and supporting libraries
pip install flax transformers
```

### Step 4: Test Installation

**Create test script `~/test-tt-xla.py`:**

```python
#!/usr/bin/env python3
"""
Test TT-XLA installation with a simple JAX example.
"""
import jax
import jax.numpy as jnp

# Check available devices
print("Available JAX devices:")
print(jax.devices())

# Try a simple computation
x = jnp.array([1.0, 2.0, 3.0])
y = jnp.array([4.0, 5.0, 6.0])

result = jnp.dot(x, y)
print(f"\nDot product result: {result}")
print(f"Result device: {result.device()}")

print("\n✓ TT-XLA is working!")
```

**Run test:**
```bash
python3 test-tt-xla.py
```

**Expected output:**
```
Available JAX devices:
[TtDevice(id=0)]

Dot product result: 32.0
Result device: TtDevice(id=0)

✓ TT-XLA is working!
```

### Step 5: Run Official Demo

```bash
# Download demo from tt-forge repo
curl -O https://raw.githubusercontent.com/tenstorrent/tt-forge/main/demos/tt-xla/nlp/jax/gpt_demo.py

# Run demo
python3 gpt_demo.py
```

**What the demo does:**
- Loads GPT-2 model via Flax
- Runs inference on TT hardware via JAX
- Predicts next token for "The capital of France is"

## Why This Works (No tt-metal Version Conflict)

**TT-XLA architecture:**
```
Your Code (JAX)
    ↓
TT-XLA PJRT Plugin (pjrt-plugin-tt wheel)
    ↓
TT-MLIR Compiler (bundled in wheel)
    ↓
TT-Metal (your existing ~/tt-metal)
    ↓
Hardware
```

**Key insight:** The `pjrt-plugin-tt` wheel includes the TT-MLIR compiler and PJRT interface. It interfaces with your existing tt-metal installation without requiring you to rebuild or change versions.

## Example: PyTorch via PyTorch/XLA (Future)

TT-XLA also supports PyTorch via PyTorch/XLA (still in development):

```python
import torch
import torch_xla.core.xla_model as xm

# Get TT device
device = xm.xla_device()

# PyTorch model
model = torch.nn.Linear(10, 5).to(device)
x = torch.randn(1, 10).to(device)

# Inference on TT hardware
output = model(x)
```

**Note:** PyTorch/XLA support is still maturing. JAX is the primary supported framework.

## Troubleshooting

### "No TT devices found"

Check hardware is configured:
```bash
tt-smi
```

If tt-smi fails, your hardware isn't set up correctly.

### "Module not found: pjrt_plugin_tt"

The wheel didn't install correctly. Try:
```bash
pip uninstall pjrt-plugin-tt
pip install pjrt-plugin-tt --extra-index-url https://pypi.eng.aws.tenstorrent.com/ --force-reinstall
```

### "Version mismatch with tt-metal"

The wheel is designed to work across tt-metal versions. If you see errors:
1. Check your tt-metal SHA: `cd ~/tt-metal && git rev-parse HEAD`
2. Try the nightly wheel: `pip install --pre pjrt-plugin-tt ...`
3. Report issue: https://github.com/tenstorrent/tt-xla/issues

### "ImportError: undefined symbol"

This usually means JAX version incompatibility. Reinstall JAX:
```bash
pip uninstall jax jaxlib
pip install pjrt-plugin-tt --extra-index-url https://pypi.eng.aws.tenstorrent.com/
```

The wheel should pull the correct JAX version automatically.

## Comparison: TT-XLA vs TT-Forge

| Feature | TT-XLA | TT-Forge |
|---------|--------|----------|
| **Installation** | Wheel (easy) | Build from source (complex) |
| **Python version** | 3.10+ | 3.11 required |
| **Primary framework** | JAX, PyTorch/XLA | PyTorch (direct) |
| **Multi-chip support** | ✅ Yes (TP/DP) | ❌ Single-chip only |
| **Maturity** | Production | Experimental |
| **Your use case** | ✅ **Use this** | ❌ Can't change Python |

**Recommendation:** Use TT-XLA for your cloud image. It works with Python 3.10.12 and doesn't require changing tt-metal.

## Next Steps

### 1. Image Classification with JAX/Flax

```python
import jax
import jax.numpy as jnp
from flax.linen import Module, Dense
import torchvision

# Load ImageNet model via Flax
# (TT-XLA demo examples available in tt-forge repo)
```

### 2. Try Other Demos

Browse: https://github.com/tenstorrent/tt-forge/tree/main/demos/tt-xla

**Available demos:**
- GPT-2 text generation (JAX)
- BERT inference (JAX)
- Vision models (JAX/Flax)
- ResNet classification (JAX/Flax)

### 3. Multi-chip Examples

If you have N300/T3K, TT-XLA supports tensor parallelism:

```python
# Automatically distribute across chips
jax.config.update('jax_platform_name', 'tt')
jax.config.update('jax_tt_mesh', '1x2')  # 2 chips
```

## Resources

- **TT-XLA Docs:** https://docs.tenstorrent.com/tt-xla/
- **TT-XLA Repo:** https://github.com/tenstorrent/tt-xla
- **TT-Forge Demos:** https://github.com/tenstorrent/tt-forge/tree/main/demos/tt-xla
- **PJRT Overview:** https://opensource.googleblog.com/2023/05/pjrt-simplifying-ml-hardware-and-framework-integration.html

## Summary

**For your cloud image (Python 3.10.12, tt-metal 9b67e09):**

✅ **Install TT-XLA via wheel** - Simple, no build required, works with Python 3.10
❌ **Don't use TT-Forge** - Requires Python 3.11, complex build process

**Installation:**
```bash
python3 -m venv tt-xla-venv
source tt-xla-venv/bin/activate
pip install pjrt-plugin-tt --extra-index-url https://pypi.eng.aws.tenstorrent.com/
pip install flax transformers
python3 gpt_demo.py  # Test with official demo
```

This is the simplest, most production-ready path for your constraints.
