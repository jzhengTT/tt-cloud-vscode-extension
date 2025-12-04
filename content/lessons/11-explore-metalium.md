# Exploring the TT-Metalium Playground

Welcome to the heart of Tenstorrent development! In this lesson, you'll discover what's possible with **TT-Metalium** and **TTNN**, the programming environments that power everything you've used so far.

## What You'll Learn

- 🎮 Run interactive TTNN tutorials in Jupyter notebooks
- 🏗️ Explore the architecture of Tenstorrent hardware
- 📚 Browse the extensive model zoo and programming examples
- 🧠 Understand the tile-based computing model
- 🔧 Learn the difference between TTNN (high-level) and TT-Metalium (low-level)

---

## Part 1: Interactive Exploration

### Launch TTNN Tutorials

TTNN comes with interactive Jupyter notebooks that teach core concepts hands-on.

[📓 Open TTNN Tutorials](command:tenstorrent.launchTtnnTutorials)

**Recommended Tutorial Sequence:**

1. **Tutorial 001**: Tensor basics and addition
   - Creating tensors on device
   - `ROW_MAJOR_LAYOUT` vs `TILE_LAYOUT`
   - Data types (bfloat16, float32, bfp8)
   - Basic operations

2. **Tutorial 004**: Tracing and visualization
   - Operation graphs
   - Debugging workflows
   - Performance analysis

3. **ttnn_mlp_inference_mnist**: Complete inference pipeline
   - Load pre-trained model
   - Preprocess data
   - Run inference on TT hardware
   - Evaluate accuracy

4. **ttnn_multihead_attention**: Transformer building blocks
   - Attention mechanism
   - Key/Query/Value projections
   - Scaled dot-product attention

**Try This:** Open Tutorial 001 and modify the tensor shapes. What happens when you use sizes not divisible by 32? Why?

---

### Explore the Model Zoo

Tenstorrent has implementations of dozens of popular models, from production LLMs to experimental vision models.

[🔍 Browse Model Zoo](command:tenstorrent.browseModelZoo)

**Categories:**

**Production Models** (`models/demos/`)
- **Llama 3.1 8B** - Text generation, chat
- **Whisper** - Audio transcription
- **ResNet50** - Image classification
- **BERT** - Natural language understanding
- **Stable Diffusion 3.5** - Image generation

**Experimental Models** (`models/experimental/`)
- **BlazePose** - Real-time pose estimation
- **nanoGPT** - Train your own GPT from scratch
- **YOLOv4-v12** - Object detection (multiple versions!)
- **VGG, MobileNet, EfficientNet** - Vision architectures

**Tip:** Each model has:
- `demo/` - Runnable examples
- `tt/` - TT hardware implementation
- `tests/` - Unit tests and benchmarks
- `README.md` - Setup instructions

---

### Discover Programming Examples

Low-level examples show how to write custom kernels in TT-Metalium.

[⚡ Explore Programming Examples](command:tenstorrent.exploreProgrammingExamples)

**Beginner Examples:**

| Example | What It Teaches | Location |
|---------|-----------------|----------|
| **DRAM Loopback** | Data movement, buffer creation | `tt_metal/programming_examples/loopback/` |
| **Hello World Compute** | First compute kernel | `tt_metal/programming_examples/hello_world_compute_kernel/` |
| **Hello World Data Movement** | Data movement kernel | `tt_metal/programming_examples/hello_world_datamovement_kernel/` |
| **Add 2 Integers** | Basic arithmetic | `tt_metal/programming_examples/add_2_integers_in_compute/` |

**Intermediate Examples:**

| Example | What It Teaches | Location |
|---------|-----------------|----------|
| **Eltwise Binary** | Element-wise operations, circular buffers | `tt_metal/programming_examples/eltwise_binary/` |
| **Eltwise SFPU** | Vector operations (SFPU = Special Function Processing Unit) | `tt_metal/programming_examples/eltwise_sfpu/` |
| **Matrix Multiply (Single Core)** | Using the matrix engine | `tt_metal/programming_examples/matmul/matmul_single_core/` |

**Advanced Examples:**

| Example | What It Teaches | Location |
|---------|-----------------|----------|
| **Matrix Multiply (Multi Core)** | Parallel execution across cores | `tt_metal/programming_examples/matmul/matmul_multi_core/` |
| **Custom SFPU Ops** | Writing custom math functions | Tech reports and examples |

### Building Programming Examples

By default, tt-metal doesn't build the programming examples. To build them:

```bash
cd ~/tt-metal
./build_metal.sh --build-programming-examples
```

**What this does:**
- Compiles all programming examples into executables
- Makes them directly runnable (no need for pytest wrappers)
- Enables IDE integration and debugging
- Takes an additional 5-10 minutes during build

**When to build examples:**
- Learning low-level TT-Metalium programming
- Studying kernel implementations
- Modifying examples for your own projects
- Debugging device-level issues

**Running built examples:**
```bash
# Example: Run the hello world compute kernel
cd ~/tt-metal/tt_metal/programming_examples/hello_world_compute_kernel
./hello_world_compute_kernel
```

---

## Part 2: Understanding the Architecture

### The Tensix Core

Each Tenstorrent chip contains a grid of **Tensix cores**. Understanding their architecture helps you write efficient code.

[🏛️ Show Architecture Diagram](command:tenstorrent.showArchitectureDiagram)

**Inside a Tensix Core:**

```
┌─────────────────────────────────────────────────┐
│                  Tensix Core                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐    ┌────────────────┐           │
│  │  5 RISC-V│───▶│  1.5 MB SRAM   │           │
│  │  "Baby"  │    │   (L1 Memory)  │           │
│  │  CPUs    │    └────────────────┘           │
│  └──────────┘            │                     │
│                           │                     │
│       ┌───────────────────┴──────────┐         │
│       │                               │         │
│  ┌────▼─────┐                  ┌─────▼────┐   │
│  │  Matrix  │                  │  Vector  │   │
│  │  Engine  │                  │  Unit    │   │
│  │  (FPU)   │                  │  (SFPU)  │   │
│  │          │                  │          │   │
│  │ 32×32    │                  │ Element- │   │
│  │ Tiles    │                  │  wise    │   │
│  └──────────┘                  └──────────┘   │
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │  Network-on-Chip (NoC) - 2 Paths        │ │
│  │  NoC 0: Reads    NoC 1: Writes          │ │
│  └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
        │                           │
        ▼                           ▼
    DRAM Banks              Other Tensix Cores
```

**Key Components:**

1. **5 RISC-V "Baby" CPUs**
   - Control and orchestration
   - Run your kernel code
   - Manage data movement

2. **1.5 MB L1 SRAM**
   - Fast local memory
   - Explicitly managed (no cache)
   - Shared between reader/compute/writer

3. **Matrix Engine (FPU)**
   - Hardware accelerator for matrix operations
   - Native 32×32 tile operations
   - Powers matmul, conv2d, attention

4. **Vector Unit (SFPU)**
   - Element-wise operations
   - Activations (ReLU, GELU, Softmax)
   - Custom math functions

5. **Network-on-Chip (NoC)**
   - Two independent paths (NoC 0 for reads, NoC 1 for writes)
   - Connects to DRAM and other Tensix cores
   - Enables multi-chip scaling

---

### The Three-Kernel Programming Model

Most operations use three kernels working together in a pipeline:

```
         Reader Kernel              Compute Kernel             Writer Kernel
         (Data Movement)            (Math Operations)         (Data Movement)
                │                          │                         │
                │                          │                         │
    ┌───────────▼──────────┐   ┌──────────▼─────────┐   ┌──────────▼─────────┐
    │                      │   │                     │   │                     │
    │  Fetch from DRAM     │──▶│  Process in SRAM   │──▶│  Store to DRAM     │
    │  via NoC 0           │   │  (Matrix/Vector)   │   │  via NoC 1         │
    │                      │   │                     │   │                     │
    └──────────────────────┘   └────────────────────┘   └────────────────────┘

    Circular Buffers in L1 SRAM enable pipelining:
    - Reader fills buffer while Compute processes previous batch
    - Compute fills output buffer while Writer stores previous batch
```

**Example: Matrix Multiplication**

```cpp
// Reader Kernel (C++)
void reader_kernel() {
    // Read tiles from DRAM
    for (uint32_t i = 0; i < num_tiles; i++) {
        read_tile(src_addr, cb_id, tile_index);
        // cb_id = circular buffer ID
    }
}

// Compute Kernel (C++)
void compute_kernel() {
    // Matrix multiply using FPU
    for (uint32_t i = 0; i < M; i++) {
        for (uint32_t j = 0; j < N; j++) {
            // Accumulate dot products
            matmul_tiles(cb_in0, cb_in1, cb_out);
        }
    }
}

// Writer Kernel (C++)
void writer_kernel() {
    // Write results back to DRAM
    for (uint32_t i = 0; i < num_output_tiles; i++) {
        write_tile(dst_addr, cb_id, tile_index);
    }
}
```

---

### Tile-Based Computing

**Why Tiles?**

Traditional GPUs use linear memory layouts. Tenstorrent uses **32×32 tiles** as the native format.

**Benefits:**
- ✅ Matches matrix engine hardware (32×32 multiply-accumulate)
- ✅ Reduces memory traffic (entire tile loaded at once)
- ✅ Efficient for deep learning (convolutional kernels fit in tiles)

**Layout Comparison:**

```python
import ttnn
import torch

# Create a 3×4 tensor
torch_tensor = torch.rand((3, 4))

# Convert to TTNN with ROW_MAJOR_LAYOUT (like NumPy/PyTorch)
row_major = ttnn.from_torch(torch_tensor, layout=ttnn.ROW_MAJOR_LAYOUT)
print(f"Row major shape: {row_major.shape}")
print(f"Row major padded shape: {row_major.padded_shape}")
# Output: Shape([3, 4]), Padded: Shape([3, 4])

# Convert to TILE_LAYOUT (32×32 tiles)
tile_layout = ttnn.to_layout(row_major, ttnn.TILE_LAYOUT)
print(f"Tile layout shape: {tile_layout.shape}")
print(f"Tile layout padded shape: {tile_layout.padded_shape}")
# Output: Shape([3, 4]), Padded: Shape([32, 32])
# Padding added automatically to fill 32×32 tile!
```

**Padding Behavior:**
- Small tensors padded to 32×32 minimum
- Larger tensors padded to nearest multiple of 32
- Padding automatically removed when converting back to `ROW_MAJOR_LAYOUT`

**Performance Tip:** Operations on tile-aligned shapes (multiples of 32) are fastest!

---

### Two Levels of Abstraction

**TTNN (Python) - High Level**

```python
import ttnn

device = ttnn.open_device(device_id=0)

# Create tensors (like PyTorch)
a = ttnn.rand((32, 32), device=device, layout=ttnn.TILE_LAYOUT)
b = ttnn.rand((32, 32), device=device, layout=ttnn.TILE_LAYOUT)

# Operations (familiar API)
c = ttnn.matmul(a, b)  # Matrix multiply
d = ttnn.add(c, 1.0)   # Add scalar
e = ttnn.gelu(d)       # Activation function

result = ttnn.to_torch(e)  # Back to PyTorch
ttnn.close_device(device)
```

**When to use TTNN:**
- ✅ Rapid prototyping
- ✅ Model inference
- ✅ Standard operations (matmul, conv, attention)
- ✅ Python-first development

---

**TT-Metalium (C++) - Low Level**

```cpp
#include "tt_metal/host_api.hpp"

using namespace tt::tt_metal;

int main() {
    // Create device and program
    Device* device = CreateDevice(0);
    Program program = CreateProgram();

    // Create kernels
    auto reader_kernel = CreateKernel(
        program,
        "kernels/reader.cpp",
        core,
        DataMovementConfig{...}
    );

    auto compute_kernel = CreateKernel(
        program,
        "kernels/compute.cpp",
        core,
        ComputeConfig{...}
    );

    // Execute
    EnqueueProgram(command_queue, program, false);
    Finish(command_queue);

    CloseDevice(device);
}
```

**When to use TT-Metalium:**
- ⚡ Maximum performance (hand-tuned kernels)
- 🔧 Custom operations not in TTNN
- 🎯 Novel algorithms
- 🔬 Research and experimentation

---

## Hands-On Exercise: Modify a Tutorial

Let's experiment with tensor layouts and observe the effect of padding.

**Steps:**

1. [📓 Open Tutorial 001](command:tenstorrent.launchTtnnTutorials)

2. Create a new cell and add this code:

```python
import ttnn

device_id = 0
device = ttnn.open_device(device_id=device_id)

# Experiment 1: Tiny tensor
tiny = ttnn.rand((5, 5), device=device, layout=ttnn.TILE_LAYOUT)
print(f"5×5 tensor shape: {tiny.shape}")
print(f"5×5 tensor padded: {tiny.padded_shape}")

# Experiment 2: Larger tensor (not tile-aligned)
medium = ttnn.rand((100, 50), device=device, layout=ttnn.TILE_LAYOUT)
print(f"100×50 tensor shape: {medium.shape}")
print(f"100×50 tensor padded: {medium.padded_shape}")

# Experiment 3: Tile-aligned tensor (optimal)
optimal = ttnn.rand((128, 128), device=device, layout=ttnn.TILE_LAYOUT)
print(f"128×128 tensor shape: {optimal.shape}")
print(f"128×128 tensor padded: {optimal.padded_shape}")

ttnn.close_device(device)
```

3. **Observe:**
   - How much padding is added for each case?
   - What's the pattern?
   - Why is 128×128 optimal?

---

## Key Takeaways

After completing this lesson, you should understand:

- ✅ **TTNN provides a PyTorch-like API** for tensor operations on TT hardware
- ✅ **Tensix cores** have specialized compute units (Matrix Engine, Vector Unit)
- ✅ **Tile-based computing** (32×32 tiles) is the native format
- ✅ **Three-kernel model** (Reader, Compute, Writer) enables pipelined execution
- ✅ **Two abstraction levels**: TTNN (high-level) and TT-Metalium (low-level)
- ✅ **Explicit memory management** (L1 SRAM) instead of automatic caching

---

## What's Next?

In **Lesson 12: TT-Metalium Cookbook**, you'll apply these concepts by building four creative projects:

1. **Conway's Game of Life** - Cellular automata with parallel tile computing
2. **Audio Processor** - Real-time mel-spectrogram and effects
3. **Mandelbrot Explorer** - GPU-style fractal rendering
4. **Custom Image Filters** - Creative visual effects

Each project includes full source code, extensions, and VS Code integration!

[🚀 Continue to Lesson 12](command:tenstorrent.openLesson12)

---

## Resources

- **Official Documentation**: [docs.tenstorrent.com](https://docs.tenstorrent.com)
- **METALIUM_GUIDE.md**: `~/tt-metal/METALIUM_GUIDE.md`
- **Programming Examples**: `~/tt-metal/tt_metal/programming_examples/`
- **Model Demos**: `~/tt-metal/models/demos/`
- **Discord Community**: [discord.gg/tvhGzHQwaj](https://discord.gg/tvhGzHQwaj)

---

## Troubleshooting

**Q: Jupyter notebooks won't open**

A: Ensure VS Code's Jupyter extension is installed:
```bash
code --install-extension ms-toolsai.jupyter
```

**Q: `ttnn.open_device()` fails**

A: Check device status:
```bash
tt-smi
```

If device shows errors, reset:
```bash
tt-smi -r
```

**Q: Out of memory errors**

A: TT hardware has limited SRAM. Try:
- Smaller batch sizes
- Tile-aligned dimensions (multiples of 32)
- Release tensors with `ttnn.deallocate(tensor)`

**Q: Slow performance**

A: Check for common issues:
- Non-tile-aligned shapes (add padding)
- Excessive `to_torch()`/`from_torch()` calls
- Missing `layout=ttnn.TILE_LAYOUT` parameter
