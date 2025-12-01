# Lesson 12: JAX Inference with TT-XLA

## Welcome to Production-Ready Multi-Chip Inference! 🚀

You've explored TT-Metal (low-level), vLLM (LLM serving), and TT-Forge (experimental PyTorch). Now meet **TT-XLA**: Tenstorrent's **production-ready XLA-based compiler** that brings JAX and PyTorch models to TT hardware with multi-chip support.

**The Goal:**
```python
import jax
import jax.numpy as jnp

# JAX automatically uses TT hardware via PJRT plugin
x = jnp.array([1.0, 2.0, 3.0])
y = jnp.array([4.0, 5.0, 6.0])

result = jnp.dot(x, y)
print(f"Result: {result}")
print(f"Device: {result.device()}")  # TtDevice(id=0)
```

**Why TT-XLA?**
- ✅ **Production-ready:** Most mature compiler for TT hardware
- ✅ **Multi-chip support:** Tensor parallelism across N150/N300/T3K/Galaxy
- ✅ **Framework flexibility:** Supports both JAX and PyTorch/XLA
- ✅ **Simple installation:** Install via wheel (no building from source)
- ✅ **Python 3.10+ compatible:** Works with standard Python versions

---

## What is TT-XLA?

**TT-XLA** is Tenstorrent's XLA-based compiler that provides production-grade inference for JAX and PyTorch models:

```
┌─────────────────────────────────────────┐
│       Your Code (JAX or PyTorch/XLA)    │  ← High-level APIs
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         PJRT Plugin (pjrt-plugin-tt)    │  ← Hardware interface
│          (Installable via pip)           │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│           TT-MLIR Compiler               │  ← Graph optimization
│     (Bundled with PJRT plugin)          │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│            TT-Metal Runtime              │  ← Your existing tt-metal
│          (~/tt-metal - no rebuild)       │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│    N150 / N300 / T3K / Galaxy Hardware  │  ← Multi-chip support
└─────────────────────────────────────────┘
```

**Key Advantages:**
- ✅ **Production-tested:** Most mature compiler in the stack
- ✅ **Multi-chip ready:** Tensor parallelism (TP) and data parallelism (DP)
- ✅ **No tt-metal rebuild:** Works with your existing installation
- ✅ **Wheel-based install:** Simple `pip install`, no compilation

---

## TT-XLA vs TT-Forge vs TT-Metal

| Feature | TT-XLA | TT-Forge | TT-Metal |
|---------|--------|----------|----------|
| **Maturity** | Production | Beta/Experimental | Stable |
| **Installation** | Wheel (easy) | Build from source | Already installed |
| **Python version** | 3.10+ | 3.11+ | Any |
| **Multi-chip** | ✅ Yes (TP/DP) | ❌ Single-chip | ✅ Yes |
| **Frameworks** | JAX, PyTorch/XLA | PyTorch, ONNX | Direct API |
| **Use case** | Production inference | Experimental models | Low-level kernels |
| **This lesson** | **✅ Focus** | Lesson 11 | Lessons 1-10 |

**Recommendation:** Use TT-XLA for production workloads on multi-chip systems (N300, T3K, Galaxy).

---

## Step 1: Install TT-XLA

**Prerequisites:**
- tt-metal already installed at `~/tt-metal` (from Lessons 1-10)
- Python 3.10 or later
- No need to rebuild tt-metal or change versions!

### Installation (Simple Wheel Method)

The PJRT plugin can be installed via pip:

```bash
# Create virtual environment
cd ~
python3 -m venv tt-xla-venv
source tt-xla-venv/bin/activate

# Install TT-XLA PJRT plugin
pip install pjrt-plugin-tt --extra-index-url https://pypi.eng.aws.tenstorrent.com/

# Install JAX and supporting libraries
pip install jax flax transformers
```

**Notes:**
- This installs the TT-XLA PJRT plugin (JAX integration)
- No compilation required
- Works with Python 3.10+
- Automatically pulls compatible JAX version
- Interfaces with your existing `~/tt-metal` installation

**Optional: Try pre-release (nightly):**
```bash
pip install --pre pjrt-plugin-tt --extra-index-url https://pypi.eng.aws.tenstorrent.com/
```

[🚀 Install TT-XLA PJRT Plugin](command:tenstorrent.installTtXla)

---

## Step 2: Test Installation

**Quick sanity check:**

Create a test script to verify TT-XLA is working:

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
cd ~
source tt-xla-venv/bin/activate
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

[🧪 Create and Run TT-XLA Test](command:tenstorrent.testTtXlaInstall)

---

## Step 3: Run Official GPT-2 Demo

TT-XLA includes validated demos in the tt-forge repository:

```bash
# Activate environment
source ~/tt-xla-venv/bin/activate

# Download GPT-2 demo from tt-forge repo
curl -O https://raw.githubusercontent.com/tenstorrent/tt-forge/main/demos/tt-xla/nlp/jax/gpt_demo.py

# Run demo
python3 gpt_demo.py
```

**What the demo does:**
- Loads GPT-2 model via Flax (JAX's neural network library)
- Runs inference on TT hardware via JAX
- Predicts next token for "The capital of France is"

**Expected output:**
```
Loading GPT-2 model...
Model loaded successfully

Input: "The capital of France is"
Prediction: "Paris"

✓ GPT-2 inference on TT hardware complete!
```

[🎯 Run TT-XLA GPT-2 Demo](command:tenstorrent.runTtXlaDemo)

---

## Step 4: Multi-Chip Configuration (N300/T3K/Galaxy)

**If you have multi-chip hardware:**

TT-XLA supports tensor parallelism and data parallelism across multiple chips:

```python
import jax

# Configure for N300 (2 chips)
jax.config.update('jax_platform_name', 'tt')
jax.config.update('jax_tt_mesh', '1x2')  # 2 chips

# Configure for T3K (8 chips)
jax.config.update('jax_tt_mesh', '1x8')  # 8 chips

# Configure for Galaxy (32 chips)
jax.config.update('jax_tt_mesh', '8x4')  # 8x4 mesh
```

**Benefits:**
- Automatically distributes computation across chips
- Tensor parallelism for large models (split layers)
- Data parallelism for batch processing (split batches)

---

## Understanding the Architecture

### Why TT-XLA Works Without Rebuilding tt-metal

**The key insight:** The `pjrt-plugin-tt` wheel includes:
1. **TT-MLIR compiler** (bundled)
2. **PJRT interface** (connects JAX to hardware)
3. **Runtime compatibility layer** (interfaces with tt-metal)

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

The wheel is designed to work across tt-metal versions, avoiding version mismatch issues.

### PJRT: The Magic Layer

**PJRT (Portable JAX Runtime)** is Google's standard interface for connecting JAX to hardware backends:

- Introduced by Google in 2023 to simplify hardware integration
- Used by TPUs, GPUs, and now Tenstorrent accelerators
- Provides consistent API regardless of underlying hardware
- Enables automatic device selection and compilation

---

## Step 5: Try Image Classification with JAX/Flax

**Build on what you learned:**

```python
import jax
import jax.numpy as jnp
from flax import linen as nn
import torchvision  # For loading ImageNet models

# Define a simple CNN in Flax
class CNN(nn.Module):
    @nn.compact
    def __call__(self, x):
        x = nn.Conv(features=32, kernel_size=(3, 3))(x)
        x = nn.relu(x)
        x = nn.avg_pool(x, window_shape=(2, 2), strides=(2, 2))
        x = x.reshape((x.shape[0], -1))  # Flatten
        x = nn.Dense(features=10)(x)
        return x

# Initialize and run
model = CNN()
params = model.init(jax.random.PRNGKey(0), jnp.ones([1, 28, 28, 1]))
output = model.apply(params, input_image)
```

**For production models:**
Browse validated examples in the tt-forge repository:
https://github.com/tenstorrent/tt-forge/tree/main/demos/tt-xla

---

## What You Just Accomplished 🎉

**You learned:**
- ✅ TT-XLA is the production-ready compiler for TT hardware
- ✅ Simple installation via PJRT plugin wheel
- ✅ JAX automatically uses TT hardware via PJRT interface
- ✅ Multi-chip support for N300/T3K/Galaxy systems
- ✅ No need to rebuild tt-metal or manage version conflicts

**Key advantages over other approaches:**
- **vs TT-Forge:** Production-ready, multi-chip support
- **vs TT-Metal:** Higher-level API, automatic optimization
- **vs vLLM:** General-purpose (not just LLMs), research-friendly

---

## Next Steps

### 1. Explore More JAX Examples

Browse the tt-forge demos directory:
```bash
git clone https://github.com/tenstorrent/tt-forge.git
cd tt-forge/demos/tt-xla
```

**Available demos:**
- GPT-2 text generation (JAX)
- BERT inference (JAX)
- Vision models (JAX/Flax)
- ResNet classification (JAX/Flax)

### 2. Try PyTorch via PyTorch/XLA (Future)

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

### 3. Multi-Chip Experiments

If you have N300/T3K/Galaxy hardware, experiment with:
- Tensor parallelism configurations
- Data parallelism strategies
- Large model sharding
- Distributed training (future support)

---

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

---

## Resources

**Official Documentation:**
- **TT-XLA Docs:** https://docs.tenstorrent.com/tt-xla/
- **TT-XLA Repo:** https://github.com/tenstorrent/tt-xla
- **TT-Forge Demos:** https://github.com/tenstorrent/tt-forge/tree/main/demos/tt-xla
- **PJRT Overview:** https://opensource.googleblog.com/2023/05/pjrt-simplifying-ml-hardware-and-framework-integration.html

**JAX Resources:**
- **JAX Documentation:** https://jax.readthedocs.io/
- **Flax (Neural Networks):** https://flax.readthedocs.io/
- **JAX Tutorials:** https://jax.readthedocs.io/en/latest/notebooks/quickstart.html

**Community:**
- Discord: https://discord.gg/tenstorrent
- GitHub Issues: Report bugs, check known issues

---

## Summary

**For production workloads (especially multi-chip):**

✅ **Use TT-XLA** - Simple installation, production-ready, multi-chip support

**Installation:**
```bash
python3 -m venv tt-xla-venv
source tt-xla-venv/bin/activate
pip install pjrt-plugin-tt --extra-index-url https://pypi.eng.aws.tenstorrent.com/
pip install jax flax transformers
python3 gpt_demo.py  # Test with official demo
```

**Why TT-XLA for your cloud image:**
- ✅ Works with Python 3.10.12 (no version change needed)
- ✅ Works with your existing tt-metal SHA (no rebuild needed)
- ✅ Simple wheel installation (no complex build process)
- ✅ Production-ready and most mature compiler

This is the simplest, most production-ready path for your constraints. 🚀
