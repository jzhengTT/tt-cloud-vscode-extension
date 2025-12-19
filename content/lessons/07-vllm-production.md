# Production Inference with vLLM

**⚠️ Note:** vLLM requires the HuggingFace model format. If you downloaded the model in Lesson 3 before this update, you may need to re-download to get both Meta and HuggingFace formats. The latest Lesson 3 downloads the complete model with all formats.

Take your AI deployment to the next level with vLLM - a production-grade inference engine that provides OpenAI-compatible APIs, continuous batching, and enterprise features for Tenstorrent hardware.

## What is vLLM?

**vLLM** is an open-source LLM serving library designed for high-throughput, low-latency inference. Tenstorrent maintains a fork that brings vLLM's advanced features to Tenstorrent hardware.

**Why vLLM?**
- 🚀 **OpenAI-compatible API** - drop-in replacement for OpenAI's API
- ⚡ **Continuous batching** - efficiently serve multiple users simultaneously
- 📊 **Production-tested** - used by companies at scale
- 🔧 **Advanced features** - request queuing, priority scheduling, streaming
- 🎯 **Easy deployment** - standardized server interface

## Journey So Far

- **Lesson 3:** One-shot inference demo
- **Lesson 4:** Interactive chat (custom app, model in memory)
- **Lesson 5:** Flask HTTP API (basic server)
- **Lesson 6:** vLLM (production-grade serving) ← **You are here**

## vLLM vs. Your Flask Server

| Feature | Flask (Lesson 5) | vLLM (Lesson 6) |
|---------|------------------|-----------------|
| Model Loading | Manual | Automatic |
| API Compatibility | Custom | OpenAI-compatible |
| Multiple Users | Sequential | Continuous batching |
| Request Queuing | Manual | Built-in |
| Streaming | Manual | Built-in |
| Production-Ready | Basic | Enterprise-grade |
| Learning Curve | Easy | Moderate |

**When to use what:**
- **Flask (Lesson 5):** Learning, prototyping, simple use cases
- **vLLM (Lesson 6):** Production, multiple users, scalability

## Architecture

```
┌──────────────────────────────────┐
│       vLLM Server                │
│                                  │
│  ┌────────────────────────────┐  │
│  │  OpenAI-Compatible API     │  │  ← Drop-in replacement
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Continuous Batch Engine   │  │  ← Efficient multi-user
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  TT-Metal Backend          │  │  ← Your hardware
│  └────────────────────────────┘  │
└──────────────────────────────────┘
         ↕
   OpenAI Python SDK
   curl / HTTP clients
   Your applications
```

## Prerequisites

- tt-metal installed and working (latest main branch - see Step 0 below if you need to update)
- Model downloaded (Llama-3.1-8B-Instruct)
- Python 3.10+ recommended
- ~20GB disk space for vLLM installation

## Starting Fresh?

If you're jumping directly to this lesson, verify your setup first:

**Quick prerequisite checks:**
```bash
# Hardware detected?
tt-smi

# tt-metal working?
python3 -c "import ttnn; print('✓ tt-metal ready')"

# Model downloaded?
ls ~/models/Llama-3.1-8B-Instruct/config.json

# Python version?
python3 --version  # Need 3.10+
```

**If any checks fail:**
- **No hardware?** → See [Lesson 1: Hardware Detection](#)
- **No tt-metal?** → See [Lesson 2: Verify Installation](#)
- **No model?** → See [Lesson 3: Download Model](#) or download now:
  ```bash
  huggingface-cli download meta-llama/Llama-3.1-8B-Instruct \
    --local-dir ~/models/Llama-3.1-8B-Instruct
  ```

---

## Model Choice

**Choose your model:** This lesson supports two models - pick whichever interests you!

| Model | Size | Strengths | Hardware Support |
|-------|------|-----------|------------------|
| **Llama-3.1-8B-Instruct** | 8B params | General-purpose chat, instruction-following | N150, N300, T3K, P100 |
| **Qwen3-8B** | 8B params | Multilingual (29 languages), coding, math | N150, N300, T3K |

**Model Download Commands:**

<details>
<summary><b>📥 Llama-3.1-8B-Instruct</b> (click to expand)</summary>

```bash
# Download Llama model (if not already downloaded in Lesson 3)
huggingface-cli download meta-llama/Llama-3.1-8B-Instruct \
  --local-dir ~/models/Llama-3.1-8B-Instruct
```

**Note:** Requires HuggingFace authentication for gated model access.

</details>

<details>
<summary><b>📥 Qwen3-8B</b> (click to expand)</summary>

```bash
# Download Qwen3-8B model
huggingface-cli download Qwen/Qwen3-8B \
  --local-dir ~/models/Qwen3-8B
```

**Advantages:**
- No gated access required (no HF token needed!)
- Multilingual: 29 languages including English, Chinese, Spanish, French, German, Japanese, Korean
- Strong coding and math capabilities
- Same 8B size as Llama

</details>

**💡 Tip:** Both models work with the same vLLM commands below - just change the `--model` path!

---

## Hardware Configuration

**Quick Check:** Not sure which hardware you have? Run this command to detect your device:

[🔍 Detect Hardware](command:tenstorrent.runHardwareDetection)

Look for the "Board Type" field in the output (e.g., n150, n300, t3k, p100).

---

**Choose your hardware configuration below:**

<details open style="border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; margin: 8px 0; background: var(--vscode-editor-background);">
<summary style="cursor: pointer; font-weight: bold; padding: 4px; margin: -12px -12px 12px -12px; background: var(--vscode-sideBar-background); border-radius: 4px 4px 0 0; border-bottom: 1px solid var(--vscode-panel-border);"><b>🔧 N150 (Wormhole - Single Chip)</b> - Most common for development</summary>

**Specifications:**
- Chips: 1
- Models: **Llama-3.1-8B-Instruct** OR **Qwen3-8B**
- Context Length: 8K tokens (reduced for memory constraints)
- Best for: Development, single-user deployments, learning

**Environment Variables:**
```bash
export MESH_DEVICE=N150
export TT_METAL_HOME=~/tt-metal
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
```

**vLLM Command - Llama:**
```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export TT_METAL_HOME=~/tt-metal && \
  export MESH_DEVICE=N150 && \
  export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Llama-3.1-8B-Instruct \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 8192 \
    --max-num-seqs 4 \
    --block-size 64
```

[🚀 Run vLLM with Llama (N150)](command:tenstorrent.startVllmServerN150)

**vLLM Command - Qwen3-8B:**
```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export TT_METAL_HOME=~/tt-metal && \
  export MESH_DEVICE=N150 && \
  export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Qwen3-8B \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 8192 \
    --max-num-seqs 4 \
    --block-size 64
```

[🚀 Run vLLM with Qwen3-8B (N150)](command:tenstorrent.startVllmServerN150Qwen)

**💡 Memory Note:** N150 has limited DRAM. These conservative settings prevent OOM errors. If you need longer context, try reducing `--max-num-seqs` to 1 and increasing `--max-model-len` to 16384.

</details>

<details style="border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; margin: 8px 0; background: var(--vscode-editor-background);">
<summary style="cursor: pointer; font-weight: bold; padding: 4px; margin: -12px -12px 12px -12px; background: var(--vscode-sideBar-background); border-radius: 4px 4px 0 0; border-bottom: 1px solid var(--vscode-panel-border);"><b>🔧 N300 (Wormhole - Dual Chip)</b></summary>

**Specifications:**
- Chips: 2
- Models: **Llama-3.1-8B-Instruct** OR **Qwen3-8B** OR Qwen-2.5-7B-Coder
- Context Length: 128K tokens
- Tensor Parallelism: TP=2 (uses both chips)
- Best for: Higher throughput, production deployments

**Environment Variables:**
```bash
export MESH_DEVICE=N300
export TT_METAL_HOME=~/tt-metal
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
```

**vLLM Command - Llama:**
```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export TT_METAL_HOME=~/tt-metal && \
  export MESH_DEVICE=N300 && \
  export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Llama-3.1-8B-Instruct \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 131072 \
    --max-num-seqs 32 \
    --block-size 64 \
    --tensor-parallel-size 2
```

[🚀 Run vLLM with Llama (N300)](command:tenstorrent.startVllmServerN300)

**vLLM Command - Qwen3-8B:**
```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export TT_METAL_HOME=~/tt-metal && \
  export MESH_DEVICE=N300 && \
  export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Qwen3-8B \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 131072 \
    --max-num-seqs 32 \
    --block-size 64 \
    --tensor-parallel-size 2
```

[🚀 Run vLLM with Qwen3-8B (N300)](command:tenstorrent.startVllmServerN300Qwen)

**💡 Why both models work:** Both Llama and Qwen3 are 8B parameter models that fit comfortably on N300 with TP=2, enabling 128K context windows.

</details>

<details style="border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; margin: 8px 0; background: var(--vscode-editor-background);">
<summary style="cursor: pointer; font-weight: bold; padding: 4px; margin: -12px -12px 12px -12px; background: var(--vscode-sideBar-background); border-radius: 4px 4px 0 0; border-bottom: 1px solid var(--vscode-panel-border);"><b>🔧 T3K (Wormhole - 8 Chips)</b></summary>

**Specifications:**
- Chips: 8
- Models: **Llama-3.1-8B** OR **Qwen3-8B** (8B models) OR Llama-3.1-70B (70B model)
- Context Length: 128K+ tokens
- Tensor Parallelism: TP=8 (uses all chips)
- Best for: Large models (70B+), multi-user production, or over-provisioned 8B models

**Environment Variables:**
```bash
export MESH_DEVICE=T3K
export TT_METAL_HOME=~/tt-metal
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
```

**vLLM Command - Llama 8B:**
```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export TT_METAL_HOME=~/tt-metal && \
  export MESH_DEVICE=T3K && \
  export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Llama-3.1-8B-Instruct \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 131072 \
    --max-num-seqs 64 \
    --block-size 64 \
    --tensor-parallel-size 8
```

[🚀 Run vLLM with Llama-8B (T3K)](command:tenstorrent.startVllmServerT3K)

**vLLM Command - Qwen3-8B:**
```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export TT_METAL_HOME=~/tt-metal && \
  export MESH_DEVICE=T3K && \
  export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Qwen3-8B \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 131072 \
    --max-num-seqs 64 \
    --block-size 64 \
    --tensor-parallel-size 8
```

[🚀 Run vLLM with Qwen3-8B (T3K)](command:tenstorrent.startVllmServerT3KQwen)

**💡 8B models on T3K:** While T3K can run 70B models, running 8B models with TP=8 gives you extremely high throughput and massive batch sizes for production serving.

**Note:** T3K also supports larger models like Llama-3.1-70B. Download the 70B model separately if you want to use it.

</details>

<details style="border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; margin: 8px 0; background: var(--vscode-editor-background);">
<summary style="cursor: pointer; font-weight: bold; padding: 4px; margin: -12px -12px 12px -12px; background: var(--vscode-sideBar-background); border-radius: 4px 4px 0 0; border-bottom: 1px solid var(--vscode-panel-border);"><b>🔧 P100 (Blackhole - Single Chip)</b></summary>

**Specifications:**
- Chips: 1 (newer Blackhole architecture)
- Models: **Llama-3.1-8B-Instruct** OR **Qwen3-8B**
- Context Length: 8K tokens (reduced for memory constraints)
- Best for: Development with latest hardware

**Environment Variables:**
```bash
export MESH_DEVICE=P100
export TT_METAL_ARCH_NAME=blackhole  # ⚠️ Required for Blackhole
export TT_METAL_HOME=~/tt-metal
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
```

**vLLM Command - Llama:**
```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export TT_METAL_HOME=~/tt-metal && \
  export MESH_DEVICE=P100 && \
  export TT_METAL_ARCH_NAME=blackhole && \
  export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Llama-3.1-8B-Instruct \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 8192 \
    --max-num-seqs 4 \
    --block-size 64
```

[🚀 Run vLLM with Llama (P100)](command:tenstorrent.startVllmServerP100)

**vLLM Command - Qwen3-8B:**
```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export TT_METAL_HOME=~/tt-metal && \
  export MESH_DEVICE=P100 && \
  export TT_METAL_ARCH_NAME=blackhole && \
  export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Qwen3-8B \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 8192 \
    --max-num-seqs 4 \
    --block-size 64
```

[🚀 Run vLLM with Qwen3-8B (P100)](command:tenstorrent.startVllmServerP100Qwen)

**⚠️ Critical:** Blackhole hardware (P100) requires `TT_METAL_ARCH_NAME=blackhole` environment variable. Without this, device detection will fail.

**💡 Memory Note:** Like N150, P100 is a single-chip device with limited DRAM. These conservative settings prevent OOM errors. For longer context (16K), use `--max-model-len 16384 --max-num-seqs 1`.

</details>

---

**💡 Tip:** If you're unsure, start with N150 configuration - it works on most hardware, just with potentially different performance characteristics.

## Step 0: Update and Build TT-Metal (If Needed)

**⚠️ Important:** vLLM dev branch requires the latest tt-metal. If you get an `InputRegistry` error or "sfpi not found" error, update and rebuild tt-metal:

```bash
cd ~/tt-metal && \
  git checkout main && \
  git pull origin main && \
  git submodule update --init --recursive && \
  sudo ./install_dependencies.sh && \
  ./build_metal.sh
```

[🔧 Update and Build TT-Metal](command:tenstorrent.updateTTMetal)

**What this does:**
- Updates tt-metal to latest main branch
- Updates all submodules (including SFPI libraries)
- **Installs/updates system dependencies** (libraries, drivers, build tools)
- Rebuilds tt-metal with latest changes
- Takes ~5-15 minutes depending on hardware and system state

**When to do this:**
- First time setting up vLLM
- After updating tt-metal with `git pull`
- If you see "sfpi not found" errors
- If you see "InputRegistry" or other API compatibility errors
- After system updates or fresh installations

**Why install_dependencies.sh?** tt-metal requires specific system libraries, kernel modules, and build tools. This script ensures all dependencies are installed before building. Skipping this step can cause build failures or runtime errors.

**Why rebuild?** tt-metal includes compiled components (like SFPI) that must be built after code updates. The `build_metal.sh` script handles all necessary compilation steps.

---

## Verify vLLM Components

Before proceeding, let's check what you already have installed:

```bash
# Check if vLLM is cloned
[ -d ~/tt-vllm ] && echo "✓ vLLM repo found" || echo "✗ vLLM repo missing"

# Check if venv exists
[ -d ~/tt-vllm-venv ] && echo "✓ vLLM venv found" || echo "✗ vLLM venv missing"

# Check if server script exists
[ -f ~/tt-scratchpad/start-vllm-server.py ] && echo "✓ Server script found" || echo "✗ Server script missing"
```

**All checks passed?** You can skip to [Step 4: Start the Server](#step-4-start-the-openai-compatible-server).

**Some checks failed?** Continue with the steps below - they'll create missing components.

---

## Step 1: Clone TT vLLM Fork

First, get Tenstorrent's vLLM fork:

```bash
cd ~ && \
  git clone --branch dev https://github.com/tenstorrent/vllm.git tt-vllm && \
  cd tt-vllm
```

[📦 Clone TT vLLM Repository](command:tenstorrent.cloneVllm)

**What this does:**
- Clones the `dev` branch (Tenstorrent's main branch)
- Creates `~/tt-vllm` directory
- Takes ~1-2 minutes depending on connection

## Step 2: Set Up vLLM Environment

Create a dedicated virtual environment and install vLLM with all required dependencies.

**This command will:**
- Create a Python virtual environment (~30 seconds)
- Install vLLM and dependencies (~5-10 minutes)
- Configure Tenstorrent hardware support

```bash
cd ~/tt-vllm && \
  python3 -m venv ~/tt-vllm-venv && \
  source ~/tt-vllm-venv/bin/activate && \
  pip install --upgrade pip && \
  export vllm_dir=$(pwd) && \
  source $vllm_dir/tt_metal/setup-metal.sh && \
  pip install --upgrade ttnn pytest && \
  pip install fairscale termcolor loguru blobfile fire pytz llama-models==0.0.48 && \
  pip install -e . --extra-index-url https://download.pytorch.org/whl/cpu
```

[⚙️ Install vLLM](command:tenstorrent.installVllm)

**What happens:**
- Creates `~/tt-vllm-venv` (isolated from your other Python packages)
- Upgrades pip
- Sources tt-metal setup for Tenstorrent support
- Installs ttnn and pytest (required for Tenstorrent hardware)
- Installs dependencies: fairscale, termcolor, loguru, blobfile, fire, pytz
- Installs llama-models==0.0.48 (Tenstorrent's Llama implementation)
- Installs vLLM in editable mode (you can modify it if needed)

**Why a separate venv?** Prevents dependency conflicts with other Python environments. Each stays clean and isolated.

**Time estimate:** ~5-10 minutes total

## Step 3: Start the OpenAI-Compatible Server

Now start vLLM as an HTTP server with OpenAI-compatible endpoints.

**⚠️ Important:** Use the configuration for your hardware from the [Hardware Configuration](#hardware-configuration) section above.

**Choose your hardware below to see the exact command:**

<details open style="border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; margin: 8px 0; background: var(--vscode-editor-background);">
<summary style="cursor: pointer; font-weight: bold; padding: 4px; margin: -12px -12px 12px -12px; background: var(--vscode-sideBar-background); border-radius: 4px 4px 0 0; border-bottom: 1px solid var(--vscode-panel-border);"><b>🔧 N150 (Wormhole - Single Chip)</b></summary>

```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export TT_METAL_HOME=~/tt-metal && \
  export MESH_DEVICE=N150 && \
  export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Llama-3.1-8B-Instruct \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 8192 \
    --max-num-seqs 4 \
    --block-size 64
```

[🚀 Start vLLM Server (N150)](command:tenstorrent.startVllmServerN150)

**💡 Memory Tip:** These settings use 8K context to avoid OOM errors. For longer context (16K), use `--max-model-len 16384 --max-num-seqs 1`.

</details>

<details style="border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; margin: 8px 0; background: var(--vscode-editor-background);">
<summary style="cursor: pointer; font-weight: bold; padding: 4px; margin: -12px -12px 12px -12px; background: var(--vscode-sideBar-background); border-radius: 4px 4px 0 0; border-bottom: 1px solid var(--vscode-panel-border);"><b>🔧 N300 (Wormhole - Dual Chip)</b></summary>

```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export TT_METAL_HOME=~/tt-metal && \
  export MESH_DEVICE=N300 && \
  export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Llama-3.1-8B-Instruct \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 131072 \
    --max-num-seqs 32 \
    --block-size 64 \
    --tensor-parallel-size 2
```

[🚀 Start vLLM Server (N300)](command:tenstorrent.startVllmServerN300)

</details>

<details style="border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; margin: 8px 0; background: var(--vscode-editor-background);">
<summary style="cursor: pointer; font-weight: bold; padding: 4px; margin: -12px -12px 12px -12px; background: var(--vscode-sideBar-background); border-radius: 4px 4px 0 0; border-bottom: 1px solid var(--vscode-panel-border);"><b>🔧 T3K (Wormhole - 8 Chips)</b></summary>

```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export TT_METAL_HOME=~/tt-metal && \
  export MESH_DEVICE=T3K && \
  export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Llama-3.1-70B-Instruct \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 131072 \
    --max-num-seqs 64 \
    --block-size 64 \
    --tensor-parallel-size 8
```

[🚀 Start vLLM Server (T3K)](command:tenstorrent.startVllmServerT3K)

**Note:** This uses the 70B model. Make sure you've downloaded it first.

</details>

<details style="border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; margin: 8px 0; background: var(--vscode-editor-background);">
<summary style="cursor: pointer; font-weight: bold; padding: 4px; margin: -12px -12px 12px -12px; background: var(--vscode-sideBar-background); border-radius: 4px 4px 0 0; border-bottom: 1px solid var(--vscode-panel-border);"><b>🔧 P100 (Blackhole - Single Chip)</b></summary>

```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export TT_METAL_HOME=~/tt-metal && \
  export MESH_DEVICE=P100 && \
  export TT_METAL_ARCH_NAME=blackhole && \
  export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Llama-3.1-8B-Instruct \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 8192 \
    --max-num-seqs 4 \
    --block-size 64
```

[🚀 Start vLLM Server (P100)](command:tenstorrent.startVllmServerP100)

**⚠️ Remember:** P100 requires `TT_METAL_ARCH_NAME=blackhole` environment variable.

**💡 Memory Tip:** These settings use 8K context to avoid OOM errors. For longer context (16K), use `--max-model-len 16384 --max-num-seqs 1`.

</details>

---

**First time setup?** Create the starter script before using any of the commands above:

[📝 Create vLLM Starter Script](command:tenstorrent.createVllmStarter)

This creates `~/tt-scratchpad/start-vllm-server.py` which registers TT models with vLLM. The hardware-specific buttons above will create this automatically if it doesn't exist, but you can also create it manually with this button.

---

### Why a Custom Starter Script?

**The Problem:** vLLM doesn't automatically know about Tenstorrent's custom model implementations (like `TTLlamaForCausalLM`). Without registration, vLLM will fail with:
```
ValidationError: Cannot find model module 'TTLlamaForCausalLM'
```

**The Solution:** A production-ready starter script that:
1. **Registers TT models** with vLLM's `ModelRegistry` API before the server starts
2. **Self-contained** - No dependency on fragile `examples/` directory
3. **Production-ready** - Can be version controlled, deployed, and maintained

**What the script does:**
```python
from vllm import ModelRegistry

# Register TT Llama implementation
ModelRegistry.register_model(
    "TTLlamaForCausalLM",
    "models.tt_transformers.tt.generator_vllm:LlamaForCausalLM"
)

# Then start vLLM server with all your flags
```

**Why not use `python -m vllm.entrypoints.openai.api_server` directly?**
- ❌ TT models not registered → ValidationError
- ❌ Falls back to slow HuggingFace Transformers (CPU)
- ❌ No way to register via CLI flags or environment variables

**Why not import from examples/?**
- ❌ `examples/` is not production code (may change/move/break)
- ❌ Creates fragile dependency on repository structure
- ❌ Not suitable for deployment or version control

**✅ Our approach:** Self-contained, production-ready script with inline registration

**The extension creates this script automatically** when you use any of the "Start vLLM Server" buttons above, or you can create it manually with the "Create vLLM Starter Script" button. You can also view/customize it at `~/tt-scratchpad/start-vllm-server.py`.

---

### Understanding the Configuration

**Environment variables (all hardware types need these):**
- `TT_METAL_HOME=~/tt-metal` - Points to tt-metal installation (required by setup-metal.sh)
- `MESH_DEVICE=<your-hardware>` - Targets your specific hardware (N150, N300, T3K, P100)
- `TT_METAL_ARCH_NAME=<architecture>` - **Required for Blackhole (P100)**: Set to `blackhole`. Wormhole chips (N150/N300/T3K) auto-detect but P100 needs explicit specification.
- `PYTHONPATH=$TT_METAL_HOME` - Required so Python can import TT model classes from tt-metal

**vLLM flags (vary by hardware):**
- `--model` - Local model path (downloaded in Lesson 3)
- `--max-model-len` - Context limit (64K for single-chip, 128K for multi-chip)
- `--max-num-seqs` - Maximum concurrent sequences (higher on multi-chip)
- `--block-size` - KV cache block size (typically 64)
- `--tensor-parallel-size` - Number of chips to use (only for multi-chip)

**What you'll see:**

```
INFO: Loading model meta-llama/Llama-3.1-8B-Instruct
INFO: Initializing TT-Metal backend...
INFO: Model loaded successfully
INFO: Started server process
INFO: Waiting for application startup.
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**Server is ready!** Leave this terminal open.

## Step 5: Test with OpenAI SDK

Open a **second terminal** and test with the OpenAI Python SDK:

```python
# Install OpenAI SDK if needed
# pip install openai

from openai import OpenAI

# Point to your vLLM server
client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="dummy-key"  # vLLM doesn't require auth by default
)

# Chat completion
response = client.chat.completions.create(
    model="meta-llama/Llama-3.1-8B-Instruct",
    messages=[
        {"role": "user", "content": "What is machine learning?"}
    ],
    max_tokens=128
)

print(response.choices[0].message.content)
```

[💬 Test with OpenAI SDK](command:tenstorrent.testVllmOpenai)

**Response:**
```
Machine learning is a subset of artificial intelligence that involves
training algorithms to learn from data and make predictions...
```

**Why this is powerful:** Your code is **identical** to code that calls OpenAI's API. Just change the `base_url`!

## Step 5: Test with curl

You can also use curl (same API as OpenAI):

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Llama-3.1-8B-Instruct",
    "messages": [
      {"role": "user", "content": "Explain neural networks"}
    ],
    "max_tokens": 128
  }'
```

[🔧 Test with curl](command:tenstorrent.testVllmCurl)

**Response:**
```json
{
  "id": "cmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "meta-llama/Llama-3.1-8B-Instruct",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Neural networks are computing systems inspired by..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 5,
    "completion_tokens": 45,
    "total_tokens": 50
  }
}
```

## OpenAI-Compatible Endpoints

vLLM implements the OpenAI API specification:

### POST /v1/chat/completions

Chat-style completions (like ChatGPT):

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Llama-3.1-8B-Instruct",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is AI?"}
    ],
    "temperature": 0.7,
    "max_tokens": 256
  }'
```

### POST /v1/completions

Text completions (continue a prompt):

```bash
curl http://localhost:8000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Llama-3.1-8B-Instruct",
    "prompt": "Once upon a time",
    "max_tokens": 100
  }'
```

### GET /v1/models

List available models:

```bash
curl http://localhost:8000/v1/models
```

Response:
```json
{
  "object": "list",
  "data": [
    {
      "id": "meta-llama/Llama-3.1-8B-Instruct",
      "object": "model",
      "owned_by": "tenstorrent"
    }
  ]
}
```

## Streaming Responses

vLLM supports streaming (tokens arrive as they're generated):

```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:8000/v1", api_key="dummy")

stream = client.chat.completions.create(
    model="meta-llama/Llama-3.1-8B-Instruct",
    messages=[{"role": "user", "content": "Write a story"}],
    stream=True,  # Enable streaming
    max_tokens=200
)

for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end='', flush=True)
```

Output appears word-by-word as it's generated!

## Continuous Batching Demo

vLLM's killer feature: serve multiple users efficiently:

```python
import asyncio
from openai import OpenAI

client = OpenAI(base_url="http://localhost:8000/v1", api_key="dummy")

async def query(prompt_id, prompt):
    """Send a query"""
    print(f"[{prompt_id}] Sending request...")
    response = client.chat.completions.create(
        model="meta-llama/Llama-3.1-8B-Instruct",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=50
    )
    print(f"[{prompt_id}] Got response: {response.choices[0].message.content[:50]}...")

async def main():
    """Send 5 requests simultaneously"""
    tasks = [
        query(1, "What is AI?"),
        query(2, "Explain Python"),
        query(3, "What is quantum computing?"),
        query(4, "Tell me about space"),
        query(5, "How do computers work?")
    ]
    await asyncio.gather(*tasks)

asyncio.run(main())
```

**vLLM handles all 5 requests efficiently** using continuous batching - much better than sequential processing!

## Advanced Configuration

### Custom Parameters

```bash
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-3.1-8B-Instruct \
  --host 0.0.0.0 \
  --port 8000 \
  --max-model-len 2048 \           # Max sequence length
  --max-num-seqs 16 \              # Max concurrent sequences
  --disable-log-requests \          # Reduce logging
  --trust-remote-code              # Allow custom models
```

### Environment Variables

```bash
# Control tensor parallelism
export MESH_DEVICE=T3K  # or N150, N300, etc.

# Set cache directory
export HF_HOME=~/hf_cache

# Enable debug logging
export VLLM_LOGGING_LEVEL=DEBUG
```

## Deployment Patterns

### Pattern 1: Single Server

Simple deployment for moderate load:

```bash
python -m vllm.entrypoints.openai.api_server \
  --model $HF_MODEL \
  --host 0.0.0.0 \
  --port 8000
```

**Good for:** Dev/test, small teams, moderate QPS

### Pattern 2: Docker Container

Containerized deployment:

```dockerfile
FROM tenstorrent/tt-metal:latest

RUN pip install vllm

CMD python -m vllm.entrypoints.openai.api_server \
    --model meta-llama/Llama-3.1-8B-Instruct \
    --host 0.0.0.0 \
    --port 8000
```

**Good for:** Consistent environments, easier scaling

### Pattern 3: Load Balanced

Multiple vLLM servers behind nginx:

```
nginx (load balancer)
  ├── vLLM server 1 (port 8001)
  ├── vLLM server 2 (port 8002)
  └── vLLM server 3 (port 8003)
```

**Good for:** High availability, horizontal scaling

## Performance Tuning

**Tips for best performance:**

1. **Set appropriate batch size:**
```bash
--max-num-seqs 32  # Higher = more throughput, more memory
```

2. **Optimize sequence length:**
```bash
--max-model-len 2048  # Match your use case
```

3. **Enable GPU memory optimization:**
```bash
--gpu-memory-utilization 0.9  # Use 90% of GPU memory
```

4. **Monitor metrics:**
- Watch request latency
- Track throughput (requests/sec)
- Monitor GPU/NPU utilization

## Monitoring and Observability

vLLM provides metrics endpoints:

```bash
# Prometheus metrics
curl http://localhost:8000/metrics

# Health check
curl http://localhost:8000/health

# Server stats
curl http://localhost:8000/v1/models
```

**Integration with monitoring tools:**
- Prometheus for metrics collection
- Grafana for visualization
- Custom alerting on latency/throughput

## Comparison: Your Journey

| Approach | Speed | Control | Prod-Ready | Use Case |
|----------|-------|---------|------------|----------|
| **Lesson 3: One-shot** | Slow | Low | ❌ | Testing |
| **Lesson 4: Direct API** | Fast | High | ⚠️ | Learning |
| **Lesson 5: Flask** | Fast | High | ⚠️ | Prototyping |
| **Lesson 6: vLLM** | Fast | Medium | ✅ | Production |

**Summary:**
- **Lessons 3-4:** Learn how inference works
- **Lesson 5:** Build custom APIs
- **Lesson 6:** Deploy at scale

Each approach serves a purpose - choose based on your needs.

## Troubleshooting

Don't worry if you hit issues - they're usually straightforward to fix. Here are common solutions:

### Server Won't Start

**Check your environment:**
```bash
# Activate venv
source ~/tt-vllm-venv/bin/activate

# Source tt-metal setup
source ~/tt-vllm/tt_metal/setup-metal.sh

# Verify model path
ls ~/models/Llama-3.1-8B-Instruct/config.json
```

**Import errors (e.g., "No module named 'llama_models'", "No module named 'fairscale'", "No module named 'pytz'", etc.):**
```bash
# Install all required dependencies in the venv
source ~/tt-vllm-venv/bin/activate
pip install --upgrade ttnn pytest
pip install fairscale termcolor loguru blobfile fire pytz llama-models==0.0.48
```

**AttributeError: 'InputRegistry' object has no attribute 'register_input_processor':**
**Error: sfpi not found at /home/user/tt-metal/runtime/sfpi:**
These errors indicate tt-metal needs to be updated and rebuilt. Solution:
```bash
# Update and rebuild tt-metal (Step 0)
cd ~/tt-metal
./build_metal.sh --clean       # Clean old build artifacts first
git checkout main
git pull origin main
git submodule update --init --recursive
sudo ./install_dependencies.sh      # Install/update system dependencies
./build_metal.sh               # Build tt-metal

# Then upgrade ttnn in vLLM venv
source ~/tt-vllm-venv/bin/activate
pip install --upgrade ttnn
```

**Why `--clean`?** Removes all cached build artifacts to prevent conflicts between old and new versions. This forces a complete rebuild from scratch.

**Why install_dependencies.sh?** Ensures all system libraries, kernel modules, and build tools are installed before building. Prevents build failures and runtime errors.

**Why rebuild?** tt-metal includes compiled components (SFPI libraries, kernels) that must be built after code updates. The vLLM dev branch expects the latest tt-metal APIs.

**RuntimeError: Failed to infer device type (Blackhole P100):**
If you see `RuntimeError: Failed to infer device type`, you need to explicitly set the architecture:
```bash
export TT_METAL_ARCH_NAME=blackhole
export MESH_DEVICE=P100
```

**Why this happens:** Blackhole hardware (P100) requires explicit architecture specification. Wormhole chips (N150/N300/T3K) auto-detect, but Blackhole needs `TT_METAL_ARCH_NAME=blackhole`.

**Full Blackhole startup command:**
```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export TT_METAL_HOME=~/tt-metal && \
  export MESH_DEVICE=P100 && \
  export TT_METAL_ARCH_NAME=blackhole && \
  export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Llama-3.1-8B-Instruct \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 8192 \
    --max-num-seqs 4 \
    --block-size 64
```

**ValidationError: Cannot find model module 'TTLlamaForCausalLM':**
This error means vLLM cannot find the TT model implementation. Solution:
```bash
# Use the starter script (Step 4) which registers TT models
python ~/tt-scratchpad/start-vllm-server.py --model ~/models/Llama-3.1-8B-Instruct
```

**Why this happens:** vLLM needs to explicitly register TT models using `ModelRegistry.register_model()` before starting. The starter script does this automatically. Do NOT call `python -m vllm.entrypoints.openai.api_server` directly - it will fail because TT models aren't registered.

**Verify your starter script exists:**
```bash
ls -la ~/tt-scratchpad/start-vllm-server.py
# If missing, use the extension button "Create vLLM Server Starter Script" in Lesson 6
```

**If you encounter other import errors (e.g., "No module named 'xyz'"):**
```bash
# Install the missing package
source ~/tt-vllm-venv/bin/activate
pip install <missing-package-name>
```

**Other import errors:**
```bash
# Reinstall vLLM in the venv
source ~/tt-vllm-venv/bin/activate
cd ~/tt-vllm
pip install -e . --extra-index-url https://download.pytorch.org/whl/cpu
```

**Virtual environment issues:**
```bash
# Recreate the venv if it's corrupted
rm -rf ~/tt-vllm-venv
cd ~/tt-vllm
python3 -m venv ~/tt-vllm-venv
source ~/tt-vllm-venv/bin/activate
pip install --upgrade pip
export vllm_dir=$(pwd)
source $vllm_dir/tt_metal/setup-metal.sh
pip install fairscale termcolor loguru blobfile fire llama-models==0.0.48
pip install -e . --extra-index-url https://download.pytorch.org/whl/cpu
```

**Slow inference:**
- Check `--max-num-seqs` setting
- Monitor GPU/NPU utilization
- Reduce `--max-model-len` if not needed

**Out of memory:**
- Reduce `--max-num-seqs`
- Reduce `--max-model-len`
- Close other programs

---

## What You Learned

- ✅ How to install and configure vLLM for Tenstorrent
- ✅ OpenAI-compatible API usage
- ✅ Continuous batching for efficient serving
- ✅ Streaming responses
- ✅ Production deployment patterns
- ✅ Performance monitoring and tuning

**Key takeaway:** vLLM bridges the gap between custom code and production deployment, giving you enterprise features while maintaining compatibility with standard APIs.

## Next Steps

**You've completed the walkthrough!** 🎉

**Where to go from here:**

1. **Build Applications:**
   - Integrate with your existing services
   - Build chat interfaces
   - Create AI-powered features

2. **Optimize Performance:**
   - Tune batch sizes for your workload
   - Implement caching strategies
   - Monitor and optimize

3. **Scale Up:**
   - Deploy multiple instances
   - Add load balancing
   - Implement autoscaling

4. **Explore More Models:**
   - Try different Llama variants
   - Test Mistral, Qwen, etc.
   - Fine-tune for your use case

## Learn More

- **TT vLLM Fork:** [github.com/tenstorrent/vllm](https://github.com/tenstorrent/vllm/tree/dev)
- **vLLM Docs:** [docs.vllm.ai](https://docs.vllm.ai/en/latest/)
- **OpenAI API Reference:** [platform.openai.com/docs](https://platform.openai.com/docs/api-reference)
- **TT-Metal Docs:** [docs.tenstorrent.com](https://docs.tenstorrent.com/)

## Community & Support

- **GitHub Issues:** Report bugs and request features
- **Discord:** Join the Tenstorrent community
- **Documentation:** Check the tt-metal README

**Thank you for completing this walkthrough!** You now have the knowledge to build, deploy, and scale AI applications on Tenstorrent hardware. 🚀
