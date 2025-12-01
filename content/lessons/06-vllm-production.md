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

## Hardware Configuration

vLLM supports multiple Tenstorrent hardware types. **Choose your hardware below:**

### Wormhole N150 (Single Chip)

**Best for:** Development, prototyping, single-user deployments

**Model:** Llama-3.1-8B-Instruct
- Context limit: 64K tokens
- No tensor parallelism needed
- Simple configuration

**Environment:**
```bash
export MESH_DEVICE=N150
export TT_METAL_HOME=~/tt-metal
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
```

**vLLM Flags (use in Step 4):**
```bash
--max-model-len 65536    # 64K limit for N150
--max-num-seqs 16        # Concurrent sequences
--block-size 64          # KV cache block size
```

---

### Wormhole N300 (Dual Chip)

**Best for:** Higher throughput, longer context

**Models:** Llama-3.1-8B-Instruct OR Qwen-2.5-7B-Coder
- Context limit: 128K tokens
- Tensor parallelism: TP=2 (uses both chips)
- Better batching performance

**Environment:**
```bash
export MESH_DEVICE=N300
export TT_METAL_HOME=~/tt-metal
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
```

**vLLM Flags (use in Step 4):**
```bash
--max-model-len 131072   # 128K context for N300
--max-num-seqs 32        # More concurrent sequences
--block-size 64
--tensor-parallel-size 2 # Use both chips
```

---

### Wormhole T3K (8 Chips)

**Best for:** Large models (70B), multi-user production

**Model:** Llama-3.1-70B-Instruct
- Context limit: 128K tokens
- Tensor parallelism: TP=8 (uses all 8 chips)
- Production-scale serving

**Environment:**
```bash
export MESH_DEVICE=T3K
export TT_METAL_HOME=~/tt-metal
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
```

**vLLM Flags (use in Step 4):**
```bash
--model ~/models/Llama-3.1-70B-Instruct  # Note: 70B model!
--max-model-len 131072
--max-num-seqs 64
--block-size 64
--tensor-parallel-size 8
```

---

### Blackhole P100 (Single Chip)

**Best for:** Newer hardware, similar to N150

**Model:** Llama-3.1-8B-Instruct
- Context limit: 64K tokens
- Similar configuration to N150
- May have experimental optimizations

**Environment:**
```bash
export MESH_DEVICE=P100
export TT_METAL_ARCH_NAME=blackhole  # Required for device type inference
export TT_METAL_HOME=~/tt-metal
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
```

**vLLM Flags (use in Step 4):**
```bash
--max-model-len 65536
--max-num-seqs 16
--block-size 64
```

**Note:** P100 support may be experimental. See "Alternative: Use TT-Jukebox" below for validated configurations.

---

### Don't Know Your Hardware?

Run this command to identify your hardware:
```bash
tt-smi -s
```

**Example output (JSON format):**
```json
{
  "board_info": {
    "board_type": "n150",
    "coords": "0,0"
  }
}
```

**Look for the `board_type` field:**
- `"n150"` → Use **Wormhole N150** configuration above
- `"n300"` → Use **Wormhole N300** configuration above
- `"t3k"` → Use **Wormhole T3K** configuration above
- `"p100"` → Use **Blackhole P100** configuration above
- `"p150"` → Use **TT-Jukebox** (see below) for validated config

**Quick extract:**
```bash
tt-smi -s | grep -o '"board_type": "[^"]*"'
# Output: "board_type": "n150"
```

**Still unsure?** Start with the N150 configuration - it works on most hardware, just with potentially suboptimal settings.

## Step 0: Update and Build TT-Metal (If Needed)

**⚠️ Important:** vLLM dev branch requires the latest tt-metal. If you get an `InputRegistry` error or "sfpi not found" error, update and rebuild tt-metal:

```bash
cd ~/tt-metal && \
  git checkout main && \
  git pull origin main && \
  git submodule update --init --recursive && \
  ./build_metal.sh
```

[🔧 Update and Build TT-Metal](command:tenstorrent.updateTTMetal)

**What this does:**
- Updates tt-metal to latest main branch
- Updates all submodules (including SFPI libraries)
- Rebuilds tt-metal with latest changes
- Takes ~5-10 minutes depending on hardware

**When to do this:**
- First time setting up vLLM
- After updating tt-metal with `git pull`
- If you see "sfpi not found" errors
- If you see "InputRegistry" or other API compatibility errors

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

## Step 3: Run Offline Inference (Optional - Skip for N150)

Test vLLM with a simple offline inference example:

```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export TT_METAL_HOME=~/tt-metal && \
  export HF_MODEL=~/models/Llama-3.1-8B-Instruct && \
  export MESH_DEVICE=N150 && \
  export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python examples/offline_inference_tt.py
```

[🧪 Run Offline Inference](command:tenstorrent.runVllmOffline)

**⚠️ N150 Note:** The offline inference script may show warnings about context length (128K default). This is expected - the script is primarily for testing larger hardware. **You can skip this step and go straight to Step 4 (API server)** where you can properly configure the 64K limit.

**Important:** `TT_METAL_HOME` and `PYTHONPATH` are required so vLLM can find the TTLlamaForCausalLM model implementation.

**What you might see:**
```
WARNING: The model has a long context length (131072). This may cause OOM...
```

This warning is safe to ignore - it's just telling you the model *supports* 128K, but we'll configure 64K in the API server.

**What you'll see:**

```
Loading model...
Model loaded successfully!

Prompt: 'Hello, my name is'
Generated text: ' John. I am a software engineer...'

Prompt: 'The capital of France is'
Generated text: ' Paris. It is known for the Eiffel Tower...'

...
```

**This demonstrates:**
- vLLM can load your model
- Basic inference works
- ~20-40 tokens/second generation speed

## Step 4: Start the OpenAI-Compatible Server

Now start vLLM as an HTTP server with OpenAI-compatible endpoints.

**⚠️ Important:** Use the configuration for your hardware from the [Hardware Configuration](#hardware-configuration) section above.

### Example: Wormhole N150

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
    --max-model-len 65536 \
    --max-num-seqs 16 \
    --block-size 64
```

[🚀 Start vLLM Server (N150)](command:tenstorrent.startVllmServer)

### Example: Wormhole N300

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

**For other hardware types (T3K, P100):** See the [Hardware Configuration](#hardware-configuration) section for your specific flags.

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

**The extension creates this script automatically** when you click the button above. You can also view/customize it at `~/tt-scratchpad/start-vllm-server.py`.

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

## Step 6: Test with curl

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
git checkout main
git pull origin main
git submodule update --init --recursive
./build_metal.sh

# Then upgrade ttnn in vLLM venv
source ~/tt-vllm-venv/bin/activate
pip install --upgrade ttnn
```

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
    --max-model-len 65536 \
    --max-num-seqs 16 \
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

## Alternative: Use TT-Jukebox (Recommended!)

**Struggling with version mismatches or hardware compatibility?**

TT-Jukebox is a standalone tool that automates everything in this lesson:
- ✅ Detects your hardware automatically
- ✅ Finds compatible models for your device
- ✅ Sets correct tt-metal and vLLM commits
- ✅ Generates setup scripts with exact versions
- ✅ Provides tested vLLM flags
- ✅ Downloads models automatically

**Quick start with Jukebox:**
```bash
# Clone TT-Jukebox (standalone repository)
git clone https://github.com/tenstorrent/tt-jukebox.git ~/tt-jukebox
cd ~/tt-jukebox

# Find chat models for your hardware
python3 tt-jukebox.py chat

# Select a model → generates setup script → run it → done!
```

**Why use Jukebox?**
- Eliminates version mismatch errors
- Uses official Tenstorrent-tested configurations
- Reproducible environments (share scripts with team)
- Supports experimental models and hardware
- Updates automatically from official specs

**When to use Jukebox:**
- First time setting up vLLM
- After updating tt-metal or vLLM
- Switching between different models
- Working on a team (share setup scripts)
- Trying experimental hardware (P100, P150)

See the [TT-Jukebox repository](https://github.com/tenstorrent/tt-jukebox) for the complete guide.

---

## What You Learned

✅ How to install and configure vLLM for Tenstorrent
✅ OpenAI-compatible API usage
✅ Continuous batching for efficient serving
✅ Streaming responses
✅ Production deployment patterns
✅ Performance monitoring and tuning

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
