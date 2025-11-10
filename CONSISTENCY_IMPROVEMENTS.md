# Walkthrough Lessons: Consistency Improvements Plan

## Executive Summary

This document outlines improvements needed across all 10 walkthrough lessons to:
1. Support multiple hardware configurations (don't assume N150)
2. Enable lesson skipping (each lesson should be standalone)
3. Add prerequisite checks and "rails to success"
4. Improve empathy for failures and troubleshooting
5. Follow Microsoft Style Guide principles

---

## Hardware Configurations to Support

### Wormhole Family
- **N150** (single chip) - Current primary focus
- **N300** (dual chip, TP=2) - Needs explicit guidance
- **T3K** (8 chips, TP=8) - Needs explicit guidance
- **N150X4** (4 chips) - Cloud scenario

### Blackhole Family
- **P100** (single chip) - NEW, needs support
- **P150** (dual chip) - Future
- **P150X4, P150X8** - Multi-chip configs

### Deployment Scenarios
- **Local development** - Developer's workstation
- **Cloud single-chip** - N150 in cloud
- **Cloud multi-chip** - N150X4, T3K
- **QuietBox** - Multiple Blackhole chips

---

## Universal Improvements for All Lessons

### 1. Add "Starting Fresh?" Section
Every lesson should include:

```markdown
## Starting Fresh? (Skip Here Check)

If you're jumping directly to this lesson, here's what you need:

**Required:**
- [ ] Tenstorrent hardware detected (`tt-smi`)
- [ ] tt-metal installed and working
- [ ] Python 3.10+ installed

**Check your setup:**
\```bash
# Verify hardware
tt-smi

# Verify tt-metal
python3 -c "import ttnn; print('✓ tt-metal ready')"

# Check Python version
python3 --version
\```

**If any checks fail**, see:
- Lesson 1: Hardware Detection
- Lesson 2: Verify Installation
- [tt-metal installation guide](https://github.com/tenstorrent/tt-metal/blob/main/INSTALLING.md)
```

### 2. Add Hardware Compatibility Matrix
Every lesson that depends on specific hardware should include:

```markdown
## Hardware Compatibility

| Hardware | Supported | Notes |
|----------|-----------|-------|
| **Wormhole N150** | ✅ Yes | Context limit: 64K tokens |
| **Wormhole N300** | ✅ Yes | Context limit: 128K tokens, use TP=2 |
| **Wormhole T3K** | ✅ Yes | 8 chips, use TP=8 |
| **Blackhole P100** | ✅ Yes | Similar to N150 |
| **Blackhole P150** | ⚠️ Experimental | Use Jukebox (Lesson 10) |

**How to determine your hardware:**
\```bash
tt-smi | grep "Board Type"
\```
```

### 3. Improve Troubleshooting Sections
Replace generic troubleshooting with:
- **Specific error messages** and solutions
- **Alternative approaches** when primary method fails
- **Encouragement to experiment**: "This is common - here's how to debug it"
- **Links to community resources**

### 4. Show Code Before Execution
Every button/command should:
1. **Show the full command** that will be executed
2. **Explain what it does** in plain language
3. **Note what will be installed** if installing something
4. **Estimate time** if it takes >30 seconds

Example format:
```markdown
**This command will:**
- Install vLLM and its dependencies (~5-10 minutes)
- Create a virtual environment at `~/tt-vllm-venv`
- Download ~2GB of Python packages

**Command to be executed:**
\```bash
cd ~/tt-vllm && \
  python3 -m venv ~/tt-vllm-venv && \
  source ~/tt-vllm-venv/bin/activate && \
  pip install -e . --extra-index-url https://download.pytorch.org/whl/cpu
\```

[⚙️ Install vLLM](command:tenstorrent.installVllm)
```

### 5. Microsoft Style Guide Compliance
- Use **second person** ("you" not "we")
- Use **active voice** ("Click the button" not "The button should be clicked")
- **Be concise** - shorter sentences, scannable headings
- **Avoid jargon** - explain technical terms on first use
- **Use contractions** where appropriate for friendliness

---

## Lesson-Specific Improvements

### Lesson 1: Hardware Detection

**Current Issues:**
- No guidance on what to do if hardware isn't detected
- No explanation of different hardware types

**Improvements Needed:**

1. **Add hardware identification section:**
```markdown
## Understanding Your Hardware

After running `tt-smi`, you'll see output like:

\```
Board Type: n150
Device ID: 0
...
\```

**What this means:**
- **n150** = Single-chip Wormhole (most common in cloud)
- **n300** = Dual-chip Wormhole
- **p100** = Single-chip Blackhole (newer hardware)
- **p150** = Dual-chip Blackhole

**Note your hardware type** - you'll need it for later lessons!
```

2. **Add "No Hardware Detected" section:**
```markdown
## Troubleshooting: No Hardware Detected

If `tt-smi` shows no devices:

**Check 1: Driver Installation**
\```bash
lspci | grep -i tenstorrent
\```
If this shows nothing, the driver isn't installed.

**Check 2: Permissions**
\```bash
sudo tt-smi
\```
If this works, it's a permissions issue.

**Check 3: Hardware Connection**
- Verify card is seated properly
- Check power connections
- Restart the system

**Still stuck?**
- Check [tt-smi troubleshooting](https://github.com/tenstorrent/tt-smi)
- Ask in Discord: [Tenstorrent Community](https://discord.gg/tenstorrent)
```

---

### Lesson 2: Verify Installation

**Current Issues:**
- No hardware-specific expectations
- No alternative if verification fails

**Improvements Needed:**

1. **Add expected output by hardware:**
```markdown
## Expected Output

**For Wormhole (N150, N300):**
\```
Device 0: Wormhole B0
Initialized successfully
Test operation completed in 0.123s
\```

**For Blackhole (P100, P150):**
\```
Device 0: Blackhole
Initialized successfully
Test operation completed in 0.156s
\```

Performance varies by hardware - any successful completion is good!
```

2. **Add "Verification Failed" section:**
```markdown
## Troubleshooting: Verification Failed

**Error: "No module named 'ttnn'"**
- tt-metal isn't installed correctly
- Solution: Reinstall tt-metal following [installation guide](...)

**Error: "Device initialization failed"**
- Hardware isn't ready
- Solution: Run `tt-smi -r` to reset device, then retry

**Error: Kernel compile errors**
- May need to rebuild tt-metal
- Solution: `cd ~/tt-metal && ./build_metal.sh`

**Try alternative test:**
\```bash
python3 -c "import ttnn; print(f'TTNN version: {ttnn.__version__}')"
\```
```

---

### Lesson 3: Download Model

**Current Issues:**
- Assumes sequential flow from lessons 1-2
- Doesn't check if HF_TOKEN is already set
- Model format explanation could be clearer

**Improvements Needed:**

1. **Add "Skip Here Check" at the top:**
```markdown
## Starting Fresh?

If you're starting here without doing Lessons 1-2, verify your setup:

**Quick checks:**
\```bash
# Hardware detected?
tt-smi

# tt-metal working?
python3 -m ttnn.examples.usage.run_op_on_device

# HuggingFace CLI installed?
which huggingface-cli || pip install huggingface-hub[cli]
\```

All checks passed? Continue below!
```

2. **Check for existing HF_TOKEN:**
```markdown
## Step 1: Authenticate with Hugging Face

**Check if you're already logged in:**
\```bash
huggingface-cli whoami
\```

If this shows your username, you're already authenticated! Skip to Step 3.

**Not logged in?** Follow these steps:

### Option 1: Use Environment Variable
\```bash
export HF_TOKEN="your-token-here"
huggingface-cli login --token "$HF_TOKEN"
\```

### Option 2: Interactive Login
\```bash
huggingface-cli login
# Paste your token when prompted
\```

**Need a token?** Get one from [HuggingFace Settings → Access Tokens](https://huggingface.co/settings/tokens)
```

3. **Clarify model formats:**
```markdown
## Understanding Model Formats

This download includes **two formats** of the same model:

**1. Meta Format** (in `original/` subdirectory)
- Files: `consolidated.00.pth`, `params.json`, `tokenizer.model`
- Used by: Direct API (Lessons 4-5), Coding Assistant (Lesson 9)
- Location: `~/models/Llama-3.1-8B-Instruct/original/`

**2. HuggingFace Format** (in root directory)
- Files: `config.json`, `model.safetensors`, `tokenizer.json`
- Used by: vLLM (Lessons 6-7), Jukebox (Lesson 10)
- Location: `~/models/Llama-3.1-8B-Instruct/`

**Why both?** Different tools need different formats. We download both so all lessons work!
```

---

### Lesson 4-5: Direct API (Chat + API Server)

**Current Issues:**
- Assumes Lesson 3 completed
- No check if model exists
- No hardware-specific guidance

**Improvements Needed:**

1. **Add prerequisite check:**
```markdown
## Prerequisites Check

Before starting, verify you have the required model:

\```bash
# Check for Meta format (required for Direct API)
ls ~/models/Llama-3.1-8B-Instruct/original/consolidated.00.pth
\```

**If the file doesn't exist:**
- You need to download the model from Lesson 3
- Or download just the Meta format:
  \```bash
  hf download meta-llama/Llama-3.1-8B-Instruct \
    --include "original/*" \
    --local-dir ~/models/Llama-3.1-8B-Instruct
  \```

**Alternative models** (if Llama isn't available):
- Mistral-7B-Instruct-v0.3 (similar performance)
- Qwen3-8B (requires N300 or TP=2)
- See Lesson 10 (Jukebox) for model compatibility
```

2. **Add hardware configuration section:**
```markdown
## Hardware Configuration

The Direct API auto-detects your hardware, but you can set it explicitly:

**For Wormhole N150:**
\```bash
export MESH_DEVICE=N150  # Optional - auto-detected
\```

**For Wormhole N300:**
\```bash
export MESH_DEVICE=N300
# N300 supports longer context (128K vs 64K)
\```

**For Blackhole P100:**
\```bash
export MESH_DEVICE=P100
# Similar performance to N150
\```

**Don't know your hardware?**
\```bash
tt-smi | grep "Board Type"
\```
```

---

### Lesson 6: vLLM Production

**Current Issues:**
- VERY N150-centric
- Little guidance for other hardware
- Assumes vLLM components exist

**Improvements Needed:**

1. **Replace "Hardware Configuration: N150 Golden Path" with comprehensive hardware section:**

```markdown
## Hardware Configuration

vLLM supports multiple Tenstorrent hardware configurations. Choose your hardware below:

### Wormhole N150 (Single Chip)

**Best for:** Development, prototyping, single-user deployments

**Model:** Llama-3.1-8B-Instruct
- Context limit: 64K tokens
- No tensor parallelism needed
- Simple configuration

**Environment:**
\```bash
export MESH_DEVICE=N150
export TT_METAL_HOME=~/tt-metal
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
\```

**vLLM Flags:**
\```bash
--max-model-len 65536    # 64K limit for N150
--max-num-seqs 16        # Concurrent sequences
--block-size 64          # KV cache block size
\```

---

### Wormhole N300 (Dual Chip)

**Best for:** Higher throughput, longer context

**Model:** Llama-3.1-8B-Instruct OR Qwen-2.5-7B-Coder
- Context limit: 128K tokens
- Tensor parallelism: TP=2
- Better batching performance

**Environment:**
\```bash
export MESH_DEVICE=N300
export TT_METAL_HOME=~/tt-metal
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
\```

**vLLM Flags:**
\```bash
--max-model-len 131072   # 128K context for N300
--max-num-seqs 32        # More concurrent sequences
--block-size 64
--tensor-parallel-size 2 # Use both chips
\```

---

### Wormhole T3K (8 Chips)

**Best for:** Large models (70B), multi-user production

**Model:** Llama-3.1-70B-Instruct
- Context limit: 128K tokens
- Tensor parallelism: TP=8
- Production-scale serving

**Environment:**
\```bash
export MESH_DEVICE=T3K
export TT_METAL_HOME=~/tt-metal
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
\```

**vLLM Flags:**
\```bash
--max-model-len 131072
--max-num-seqs 64
--block-size 64
--tensor-parallel-size 8
\```

---

### Blackhole P100 (Single Chip)

**Best for:** Newer hardware, similar to N150 performance

**Model:** Llama-3.1-8B-Instruct
- Context limit: 64K tokens
- Similar configuration to N150
- May have experimental optimizations

**Environment:**
\```bash
export MESH_DEVICE=P100
export TT_METAL_HOME=~/tt-metal
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
\```

**vLLM Flags:**
\```bash
--max-model-len 65536
--max-num-seqs 16
--block-size 64
\```

**Note:** P100 support may be experimental. Use Lesson 10 (Jukebox) to find validated configurations.

---

### Don't Know Your Hardware?

Run this command:
\```bash
tt-smi | grep "Board Type"
\```

**Output:**
- `n150` → Use N150 configuration above
- `n300` → Use N300 configuration above
- `t3k` → Use T3K configuration above
- `p100` → Use P100 configuration above
- `p150` → Use Jukebox (Lesson 10) for validated config

**Still unsure?** Start with the N150 configuration - it works on most hardware, just with potentially suboptimal settings.
```

2. **Add vLLM component checks:**
```markdown
## Step 1: Verify Prerequisites

Before installing vLLM, check what you already have:

\```bash
# Check if vLLM is cloned
[ -d ~/tt-vllm ] && echo "✓ vLLM repo found" || echo "✗ vLLM repo missing"

# Check if venv exists
[ -d ~/tt-vllm-venv ] && echo "✓ vLLM venv found" || echo "✗ vLLM venv missing"

# Check if model exists
[ -d ~/models/Llama-3.1-8B-Instruct ] && echo "✓ Model found" || echo "✗ Model missing"

# Check if server script exists
[ -f ~/tt-scratchpad/start-vllm-server.py ] && echo "✓ Server script found" || echo "✗ Server script missing"
\```

**All checks passed?** You can skip to Step 4 (Start the Server).

**Some checks failed?** Continue with the steps below - they'll create missing components.
```

3. **Add server script creation step:**
```markdown
## Step 3.5: Create Server Start Script

vLLM needs TT models registered before starting. We'll create a helper script:

**This creates `~/tt-scratchpad/start-vllm-server.py` with:**
- TT model registration (required for vLLM to find TTLlamaForCausalLM)
- Argument parsing for flexibility
- Proper error handling

\```bash
mkdir -p ~/tt-scratchpad
\```

[📝 Create vLLM Server Script](command:tenstorrent.createVllmServerScript)

**What's in the script:**
\```python
from vllm import ModelRegistry

# Register TT-specific models
ModelRegistry.register_model(
    "TTLlamaForCausalLM",
    "models.tt_transformers.tt.generator_vllm:LlamaForCausalLM"
)

# Start API server with arguments
# ...
\```

**Why needed?** vLLM doesn't automatically know about TT models. This registration tells vLLM how to load Llama models on Tenstorrent hardware.
```

4. **Add "Alternative: Use Jukebox" section:**
```markdown
## Alternative: Use TT-Jukebox (Recommended!)

**Struggling with version mismatches or hardware compatibility?**

TT-Jukebox (Lesson 10) automatically:
- ✅ Detects your hardware
- ✅ Finds compatible models
- ✅ Sets correct tt-metal and vLLM commits
- ✅ Generates setup scripts
- ✅ Provides tested vLLM flags

**Quick start with Jukebox:**
\```bash
python3 ~/tt-scratchpad/tt-jukebox.py chat
# Select a model → generates setup script → run it → done!
\```

See [Lesson 10: TT-Jukebox](lesson-10) for details.
```

---

### Lesson 7: VSCode Chat

**Current Issues:**
- Assumes vLLM from Lesson 6 is ready
- No check if server is running
- Hard to start fresh

**Improvements Needed:**

1. **Add comprehensive prerequisite check:**
```markdown
## Starting Fresh?

This lesson needs a running vLLM server. Let's check:

**Step 1: Verify vLLM is installed**
\```bash
[ -d ~/tt-vllm ] && echo "✓ vLLM repo exists" || echo "✗ Need to install vLLM (Lesson 6)"
\```

**Step 2: Check if server is running**
\```bash
curl http://localhost:8000/health 2>/dev/null && \
  echo "✓ Server is running!" || \
  echo "✗ Server not running - start it below"
\```

**Server not running?** Jump to "Quick Start: Launch vLLM Server" below.

**vLLM not installed?** You have two options:
1. **Do Lesson 6** - Full vLLM tutorial (recommended for learning)
2. **Quick install** - Use commands below (faster)

### Quick Install vLLM (If Skipping Lesson 6)

\```bash
# Clone vLLM
cd ~ && git clone --branch dev https://github.com/tenstorrent/vllm.git tt-vllm && cd tt-vllm

# Create venv
python3 -m venv ~/tt-vllm-venv
source ~/tt-vllm-venv/bin/activate

# Install dependencies
pip install --upgrade pip
export vllm_dir=$(pwd)
source $vllm_dir/tt_metal/setup-metal.sh
pip install --upgrade ttnn pytest
pip install fairscale termcolor loguru blobfile fire pytz llama-models==0.0.48
pip install -e . --extra-index-url https://download.pytorch.org/whl/cpu
\```

This takes ~10-15 minutes.
```

2. **Add "Quick Start: Launch vLLM Server" section:**
```markdown
## Quick Start: Launch vLLM Server

**Choose your hardware:**

### For Wormhole N150 or Blackhole P100:
\```bash
cd ~/tt-vllm
source ~/tt-vllm-venv/bin/activate
export TT_METAL_HOME=~/tt-metal
export MESH_DEVICE=N150  # or P100
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
source ~/tt-vllm/tt_metal/setup-metal.sh

python ~/tt-scratchpad/start-vllm-server.py \
  --model ~/models/Llama-3.1-8B-Instruct \
  --host 0.0.0.0 \
  --port 8000 \
  --max-model-len 65536 \
  --max-num-seqs 16 \
  --block-size 64
\```

### For Wormhole N300:
\```bash
cd ~/tt-vllm
source ~/tt-vllm-venv/bin/activate
export TT_METAL_HOME=~/tt-metal
export MESH_DEVICE=N300
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
source ~/tt-vllm/tt_metal/setup-metal.sh

python ~/tt-scratchpad/start-vllm-server.py \
  --model ~/models/Llama-3.1-8B-Instruct \
  --host 0.0.0.0 \
  --port 8000 \
  --max-model-len 131072 \
  --max-num-seqs 32 \
  --block-size 64 \
  --tensor-parallel-size 2
\```

**Wait for:** "Application startup complete" message in terminal.

**Then continue** to enable the chat participant below.
```

---

### Lesson 8: Image Generation

**Current Issues:**
- Hardware notes could be more prominent
- No guidance if model download fails
- Performance expectations not hardware-specific

**Improvements Needed:**

1. **Add hardware compatibility front and center:**
```markdown
## Hardware Compatibility

Stable Diffusion 3.5 Large runs on Tenstorrent hardware with native acceleration:

| Hardware | Status | Performance | Notes |
|----------|--------|-------------|-------|
| **N150** (Wormhole) | ✅ Supported | ~12-15 sec/image | Optimized config |
| **N300** (Wormhole) | ✅ Supported | ~8-10 sec/image | Faster with 2 chips |
| **P100** (Blackhole) | ⚠️ Experimental | ~12-15 sec/image | Similar to N150 |
| **T3K** (Wormhole) | ✅ Supported | ~5-8 sec/image | Production scale |

**All hardware benefits from native TT-NN acceleration** - no CPU fallback!

**Check your hardware:**
\```bash
tt-smi | grep "Board Type"
\```
```

2. **Add model download troubleshooting:**
```markdown
## Troubleshooting: Model Download

**Error: "You need to agree to the model's terms"**

Solution:
1. Visit [stabilityai/stable-diffusion-3.5-large](https://huggingface.co/stabilityai/stable-diffusion-3.5-large)
2. Click "Agree and access repository"
3. Log in with your Hugging Face account
4. Retry the demo - model downloads automatically

**Error: "401 Unauthorized"**

You're not logged in to HuggingFace:
\```bash
huggingface-cli login
# Paste your token when prompted
\```

Get a token from [HuggingFace Settings](https://huggingface.co/settings/tokens).

**Error: Model download is very slow**

The model is ~10GB. Options:
- Wait it out (5-15 minutes depending on connection)
- Use `--resume` with `hf download` if interrupted:
  \```bash
  hf download stabilityai/stable-diffusion-3.5-large \
    --local-dir ~/.cache/huggingface/hub/models--stabilityai--stable-diffusion-3.5-large \
    --resume-download
  \```

**Error: "Out of disk space"**

Stable Diffusion needs ~15GB free:
- Check: `df -h ~/`
- Clean old models if needed
- Use smaller model (SD 1.4 - Lesson 8 alternative)
```

---

### Lesson 9: Coding Assistant

**Current Issues:**
- Hardware requirements not prominent
- Could better explain why we're using prompting

**Improvements Needed:**

1. **Add hardware section:**
```markdown
## Hardware Requirements

The Direct API coding assistant works on all Tenstorrent hardware:

| Hardware | Model | Context | Performance | Recommended |
|----------|-------|---------|-------------|-------------|
| **N150** | Llama 3.1 8B | 64K | 1-3 sec/query | ✅ Ideal |
| **N300** | Llama 3.1 8B | 128K | 1-3 sec/query | ✅ Better for long code |
| **P100** | Llama 3.1 8B | 64K | 1-3 sec/query | ✅ Ideal |
| **T3K** | Llama 3.1 70B | 128K | 2-4 sec/query | ⚡ Best quality |

**Don't know your hardware?**
\```bash
tt-smi | grep "Board Type"
\```

**Have T3K?** You can use the larger Llama 3.1 70B for even better coding assistance. See Lesson 10 (Jukebox) for setup.
```

2. **Strengthen the "why prompting" message:**
```markdown
## Why Prompt Engineering Instead of Specialized Models?

**You might be wondering:** "Why not use CodeLlama or Qwen Coder?"

**The practical answer:** As of this writing:
- CodeLlama requires architecture adaptation for tt-metal
- Qwen Coder 7B requires N300 (not supported on N150 single-chip)
- Community fine-tunes like AlgoCode need weight conversion

**The strategic answer:** Prompt engineering is a **production skill**, not a workaround.

**Real-world examples:**
- GitHub Copilot: GPT-4 + coding prompts
- Amazon CodeWhisperer: General LLM + specialized prompts
- Anthropic Claude for coding: Claude 3 + coding system prompts

**The power of prompts:**
- ✅ Delivers 80-90% of specialized model quality
- ✅ Works on any compatible LLM
- ✅ Easy to customize for your domain
- ✅ No compatibility issues
- ✅ Transferable to all future models

**Bottom line:** Learning prompt engineering makes you valuable across ALL AI systems, not just one specialized model.

**Future:** When specialized models become compatible with tt-metal, you can swap them in using the same architecture you learn here!
```

---

### Lesson 10: Jukebox

**Current Issues:**
- Could better integrate with earlier lessons
- Need more hardware-specific examples

**Improvements Needed:**

1. **Add "Why Jukebox?" section at the top:**
```markdown
## Why Jukebox Matters

**Have you hit any of these issues?**
- ❌ "ImportError: No module named 'llama_models'"
- ❌ "AttributeError: 'InputRegistry' object has no attribute..."
- ❌ Model works on N150 but crashes on N300
- ❌ Followed a tutorial but vLLM won't start
- ❌ "How do I know which tt-metal commit to use?"

**Jukebox solves all of these.**

Instead of guessing versions, Jukebox:
- ✅ Detects your hardware automatically
- ✅ Fetches tested configurations from Tenstorrent
- ✅ Generates setup scripts with EXACT commit SHAs
- ✅ Provides validated vLLM flags
- ✅ Downloads models automatically (NEW!)

**The result:** Reproducible environments that work the first time.

**When to use Jukebox:**
- Starting a new project
- Switching models
- After updating tt-metal or vLLM
- Working on a team (share setup scripts)
- Moving between hardware types
```

2. **Add hardware-specific workflow examples:**
```markdown
## Hardware-Specific Workflows

### Workflow: N150 Single-Chip Development

**Scenario:** You have an N150 in the cloud, want to run Llama 3.1 8B for chat.

\```bash
# 1. Find chat models for N150
python3 ~/tt-scratchpad/tt-jukebox.py chat

# 2. Select Llama-3.1-8B-Instruct from the list

# 3. Generate and run setup
python3 ~/tt-scratchpad/tt-jukebox.py --model llama-3.1-8b --setup

# 4. Execute setup script
bash ~/tt-scratchpad/setup-scripts/setup_llama_3_1_8b_instruct.sh

# 5. Start vLLM with correct flags
cd ~/tt-vllm
source ~/tt-vllm-venv/bin/activate
export TT_METAL_HOME=~/tt-metal
export MESH_DEVICE=N150
source ~/tt-vllm/tt_metal/setup-metal.sh

python ~/tt-scratchpad/start-vllm-server.py \
  --model ~/models/Llama-3.1-8B-Instruct \
  --max-model-len 65536 \
  --max-num-seqs 16
\```

**Done!** Validated configuration in ~15 minutes.

---

### Workflow: N300 Dual-Chip Code Assistance

**Scenario:** You have N300, want Qwen 2.5 Coder for programming tasks.

\```bash
# 1. Find code models for N300
python3 ~/tt-scratchpad/tt-jukebox.py code_assistant

# 2. Select Qwen-2.5-7B-Coder from the list

# 3. Generate setup
python3 ~/tt-scratchpad/tt-jukebox.py --model qwen-2.5-7b --setup

# 4. Run setup
bash ~/tt-scratchpad/setup-scripts/setup_qwen_2_5_7b_coder.sh

# 5. Start vLLM with tensor parallelism
python ~/tt-scratchpad/start-vllm-server.py \
  --model ~/models/Qwen-2.5-7B-Coder \
  --tensor-parallel-size 2 \
  --max-model-len 32768 \
  --max-num-seqs 32
\```

**Result:** Code assistant optimized for N300's dual chips.

---

### Workflow: P100 Blackhole Experimental

**Scenario:** You have new P100 hardware, want to try latest models.

\```bash
# 1. List all P100 models (including experimental)
python3 ~/tt-scratchpad/tt-jukebox.py --list --show-experimental

# 2. Try Llama 3.1 8B (P100-validated)
python3 ~/tt-scratchpad/tt-jukebox.py --model llama-3.1-8b --setup

# 3. Or explore experimental N300 models that might work
python3 ~/tt-scratchpad/tt-jukebox.py --model qwen --show-experimental
# Jukebox shows: "May work on P100 (same architecture family)"

# 4. Generate setup with conservative parameters
# Jukebox automatically reduces max-context by 33% for safety

# 5. Test carefully and report results!
\```

**Experimental models = adventure!** Report what works to help the community.

---

### Workflow: T3K Production Deployment

**Scenario:** You have T3K (8 chips), need Llama 3.1 70B for production serving.

\```bash
# 1. Find large models for T3K
python3 ~/tt-scratchpad/tt-jukebox.py --model llama-70b

# 2. Select Llama-3.1-70B-Instruct

# 3. Generate setup (includes TP=8 config)
python3 ~/tt-scratchpad/tt-jukebox.py --model llama-3.1-70b --setup

# 4. Run setup (may take longer - large model)
bash ~/tt-scratchpad/setup-scripts/setup_llama_3_1_70b_instruct.sh

# 5. Start vLLM with production settings
python ~/tt-scratchpad/start-vllm-server.py \
  --model ~/models/Llama-3.1-70B-Instruct \
  --tensor-parallel-size 8 \
  --max-model-len 131072 \
  --max-num-seqs 64 \
  --block-size 64
\```

**Result:** Production-grade 70B serving with validated config.
```

---

## Implementation Priority

### Phase 1: Critical (Do First)
1. **Lesson 6 (vLLM)** - Add comprehensive hardware section
2. **Lesson 6 (vLLM)** - Add prerequisite checks and alternative paths
3. **Lesson 7 (VSCode Chat)** - Add "Starting Fresh?" section
4. **Lesson 10 (Jukebox)** - Add hardware-specific workflows

### Phase 2: Important (Do Second)
5. **Lesson 1** - Add hardware identification
6. **Lesson 3** - Add "Starting Fresh?" and HF_TOKEN checks
7. **Lesson 4-5** - Add prerequisite checks
8. **Lesson 8** - Add hardware compatibility matrix

### Phase 3: Polish (Do Third)
9. **All lessons** - Microsoft Style Guide pass
10. **All lessons** - Consistent formatting
11. **All lessons** - Cross-reference links
12. **All lessons** - Troubleshooting improvements

---

## Testing Strategy

After implementing improvements, test these scenarios:

### Scenario 1: Skip Directly to Lesson 6
- User has N150, wants vLLM
- Hasn't done Lessons 1-5
- Should be able to check prerequisites and install missing pieces

### Scenario 2: Different Hardware
- User has P100 (Blackhole) instead of N150
- Should see clear guidance on what's different
- Should be able to use Jukebox for validated config

### Scenario 3: Partial Installation
- User has tt-metal but not vLLM
- User has vLLM but model isn't downloaded
- Each lesson should gracefully handle missing prerequisites

### Scenario 4: Version Mismatch
- User's tt-metal is wrong commit
- Should see clear error and path to fix (Jukebox)

---

## Style Guide Checklist

For each lesson, verify:

- [ ] Uses "you" (second person) throughout
- [ ] Uses active voice ("Click the button" not "The button should be clicked")
- [ ] Sentences are concise (<25 words where possible)
- [ ] Headings are scannable (user can skim to find section)
- [ ] Technical terms explained on first use
- [ ] Contractions used where appropriate ("you'll" vs "you will")
- [ ] Code blocks have clear explanations
- [ ] Commands shown before execution
- [ ] Time estimates provided for long operations
- [ ] Troubleshooting is encouraging, not discouraging

---

## Success Metrics

After improvements, users should be able to:

1. **Jump to any lesson** without completing previous ones
2. **Identify their hardware** and find relevant instructions
3. **Recover from failures** using troubleshooting guidance
4. **Switch hardware types** (N150 → N300) with clear instructions
5. **Feel confident experimenting** when things don't work perfectly

---

## Next Steps

1. Review this plan with the team
2. Prioritize which lessons to update first
3. Create feature branch for updates
4. Implement changes lesson-by-lesson
5. Test each updated lesson on multiple hardware types
6. Get community feedback
7. Iterate based on real user experiences

---

*Generated: 2025-11-10*
*Author: Claude Code*
*Purpose: Consistency improvements for VS Code extension walkthroughs*
