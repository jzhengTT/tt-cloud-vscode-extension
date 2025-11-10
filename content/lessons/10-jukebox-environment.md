# Lesson 10: Environment Management with TT-Jukebox

## The Version Mismatch Problem

**You've hit this before:**
- Tried to run a model → "incompatible tt-metal version"
- Updated tt-metal → now vLLM doesn't work
- Different models need different commits
- Documentation says "use main" but which commit exactly?

**The root cause:** Each model in production has been tested with SPECIFIC commits of tt-metal and vLLM. Using the wrong versions leads to:
- Compilation failures
- Runtime errors
- Performance issues
- Mysterious crashes

**The solution:** TT-Jukebox - an intelligent environment manager that:
1. Detects your hardware automatically
2. Fetches official model specifications from GitHub
3. Matches your task/model to compatible configurations
4. Generates setup scripts with EXACT commit SHAs
5. Builds reproducible environments

---

## How TT-Jukebox Works

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                      TT-JUKEBOX                             │
│                                                             │
│  1. Hardware Detection (tt-smi)                            │
│     ↓                                                       │
│  2. Scan Current Installations (git status)                │
│     ↓                                                       │
│  3. Fetch Model Specs (GitHub API)                         │
│     ↓                                                       │
│  4. Intelligent Matching (fuzzy search, task mapping)      │
│     ↓                                                       │
│  5. Generate Setup Script (bash with exact commits)        │
│     ↓                                                       │
│  6. Execute (optional) → Reproducible Environment          │
└─────────────────────────────────────────────────────────────┘
```

**Data Source:**
TT-Jukebox fetches live data from:
```
https://github.com/tenstorrent/tt-inference-server/blob/main/model_specs_output.json
```

This JSON file contains 100+ model configurations tested by Tenstorrent, including:
- Model name and HuggingFace repo
- Device type (N150, N300, T3K, etc.)
- Exact tt-metal commit SHA
- Exact vLLM commit SHA
- Version tag (e.g., 0.3.0)
- Hardware requirements (disk, RAM)
- Context length limits
- Recommended vLLM flags

**Example spec for Llama-3.1-8B on N150:**
```json
{
  "model_name": "Llama-3.1-8B",
  "device_type": "N150",
  "tt_metal_commit": "9b67e09",
  "vllm_commit": "a91b644",
  "version": "0.3.0",
  "min_disk_gb": 36,
  "min_ram_gb": 32,
  "device_model_spec": {
    "max_context": 65536,
    "max_num_seqs": 32,
    "block_size": 64
  }
}
```

---

## Step 1: Get TT-Jukebox Script

The script is already included in the extension templates!

**Copy to your scratchpad:**
```bash
mkdir -p ~/tt-scratchpad
cp content/templates/tt-jukebox.py ~/tt-scratchpad/
chmod +x ~/tt-scratchpad/tt-jukebox.py
```

[📋 Copy TT-Jukebox to Scratchpad](command:tenstorrent.copyJukebox)

**Or download directly from the extension:**
The script is bundled in `content/templates/tt-jukebox.py`

---

## Step 2: Explore Available Models

**List all models for your hardware:**
```bash
python3 ~/tt-scratchpad/tt-jukebox.py --list
```

[📜 List Compatible Models](command:tenstorrent.listJukeboxModels)

**What you'll see:**
```
======================================================================
Models Compatible with N150
======================================================================

Gemma Family:
  • gemma-3-1b-it
    Context: 65536 tokens, Disk: 12 GB
  • gemma-3-4b-it
    Context: 65536 tokens, Disk: 22 GB
  • medgemma-4b-it
    Context: 65536 tokens, Disk: 22 GB

Llama Family:
  • Llama-3.2-1B
    Context: 65536 tokens, Disk: 12 GB
  • Llama-3.2-1B-Instruct
    Context: 65536 tokens, Disk: 12 GB
  • Llama-3.2-3B
    Context: 65536 tokens, Disk: 18 GB
  • Llama-3.2-3B-Instruct
    Context: 65536 tokens, Disk: 18 GB
  • Llama-3.1-8B
    Context: 65536 tokens, Disk: 36 GB
  • Llama-3.1-8B-Instruct
    Context: 65536 tokens, Disk: 36 GB

Mistral Family:
  • Mistral-7B-Instruct-v0.3
    Context: 65536 tokens, Disk: 28 GB

Qwen Family:
  • Qwen3-8B
    Context: 32768 tokens, Disk: 36 GB

Total: 13 compatible models
```

**Key insight:** N150 supports 13 models across 4 families!

---

## Step 3: Match Models by Task

**Find models for a specific task:**
```bash
# Chat models
python3 ~/tt-scratchpad/tt-jukebox.py chat

# Code assistance
python3 ~/tt-scratchpad/tt-jukebox.py code_assistant

# Image generation
python3 ~/tt-scratchpad/tt-jukebox.py generate_image
```

[💬 Find Chat Models](command:tenstorrent.jukeboxFindChat)

**Task-to-Model Mapping:**
| Task | Model Families | Example Models |
|------|----------------|----------------|
| `chat` | Llama, Mistral, Qwen, Gemma | Llama-3.1-8B-Instruct, Mistral-7B |
| `code` / `code_assistant` | Llama, Qwen | Llama-3.2-3B, Qwen3-8B |
| `generate_image` | Stable Diffusion | SD 3.5 Large (N150+) |
| `agent` | Qwen, Llama | Qwen3-8B, Llama-3.1-8B |
| `reasoning` | QwQ (future) | - |

**Example output:**
```
Searching for models suitable for 'chat'...

Matching Configurations

[1] Llama-3.1-8B-Instruct
    ID: id_tt-transformers_Llama-3.1-8B-Instruct_n150
    HuggingFace: meta-llama/Llama-3.1-8B-Instruct
    Device: N150
    Version: 0.3.0
    tt-metal commit: 9b67e09
    vLLM commit: a91b644
    Max context: 65,536 tokens
    Min disk: 36 GB
    Min RAM: 32 GB
    Model: Downloaded ✓
      Path: ~/models/Llama-3.1-8B-Instruct
    Environment: Setup required
      tt-metal: abc1234 -> 9b67e09
      vLLM: def5678 -> a91b644

[2] Mistral-7B-Instruct-v0.3
    ...

Select a configuration (1-11) or 'q' to quit:
```

---

## Step 4: Fuzzy Model Matching

**Search by model name:**
```bash
# Match any Llama variant
python3 ~/tt-scratchpad/tt-jukebox.py --model llama

# Match Mistral
python3 ~/tt-scratchpad/tt-jukebox.py --model mistral

# Match Gemma
python3 ~/tt-scratchpad/tt-jukebox.py --model gemma
```

[🔍 Search for Llama Models](command:tenstorrent.jukeboxSearchLlama)

**Fuzzy matching features:**
- **Exact match**: `llama-3.1-8b` → Llama-3.1-8B (highest score)
- **Substring match**: `llama` → all Llama models
- **Partial word match**: `llam` → matches Llama-*
- **Case insensitive**: `LLAMA` = `llama` = `Llama`

**Example:**
```bash
$ python3 tt-jukebox.py --model llama

Searching for models matching 'llama'...

Found 6 matches:
[1] Llama-3.1-8B-Instruct (match score: 80)
[2] Llama-3.1-8B (match score: 80)
[3] Llama-3.2-3B-Instruct (match score: 80)
[4] Llama-3.2-3B (match score: 80)
[5] Llama-3.2-1B-Instruct (match score: 80)
[6] Llama-3.2-1B (match score: 80)
```

---

## Step 5: Check Environment Compatibility

**TT-Jukebox automatically checks your current environment:**

When you select a model, it compares:
- Model download status (checks ~/models/ and HF cache)
- Your tt-metal commit vs required commit
- Your vLLM commit vs required commit
- Displays exactly what needs to change

**Possible statuses:**

**Model Download:**
- ✅ **Model: Downloaded ✓** - Model found in ~/models/ or HF cache
- ⚠️ **Model: Not downloaded** - Setup script will download it

**Environment:**
- ✅ **Environment matches!** - You can use this model right now
- ⚠️ **Setup required** - Commits don't match, setup script will fix it

**Example scenario:**

**Current environment:**
- tt-metal: `abc1234` (on main branch)
- vLLM: `def5678` (on dev branch)

**Llama-3.1-8B requires:**
- tt-metal: `9b67e09`
- vLLM: `a91b644`

**TT-Jukebox shows:**
```
Status: Setup required
  tt-metal: abc1234 -> 9b67e09
  vLLM: def5678 -> a91b644
```

---

## Step 6: Generate Setup Script

**Automatically create a setup script:**
```bash
python3 ~/tt-scratchpad/tt-jukebox.py --model llama-3.1-8b --setup
```

[🛠️ Generate Setup Script for Llama](command:tenstorrent.jukeboxSetupLlama)

**What the generated script does:**

1. **Download model from HuggingFace (if not already present):**
   - Checks if model is already downloaded in `~/models/` or HF cache
   - If missing, downloads using `huggingface-cli download`
   - Requires HF_TOKEN or huggingface-cli login for gated models
   - Example output:
     ```
     Checking for model: Llama-3.1-8B-Instruct...
     Model: Not downloaded
       Will download to: ~/models/Llama-3.1-8B-Instruct
     Downloading meta-llama/Llama-3.1-8B-Instruct to ~/models/Llama-3.1-8B-Instruct...
     ✓ Model downloaded to ~/models/Llama-3.1-8B-Instruct
     ```

2. **Check out exact tt-metal commit:**
   ```bash
   cd ~/tt-metal
   git fetch origin
   git checkout 9b67e09
   git submodule update --init --recursive
   ./build_metal.sh
   ```

3. **Check out exact vLLM commit:**
   ```bash
   cd ~/tt-vllm
   git fetch origin
   git checkout a91b644
   ```

4. **Create/update Python venv:**
   ```bash
   python3 -m venv ~/tt-vllm-venv
   source ~/tt-vllm-venv/bin/activate
   ```

5. **Install dependencies:**
   ```bash
   pip install --upgrade pip
   export vllm_dir=~/tt-vllm
   source $vllm_dir/tt_metal/setup-metal.sh
   pip install --upgrade ttnn pytest
   pip install fairscale termcolor loguru blobfile fire pytz llama-models==0.0.48
   pip install -e . --extra-index-url https://download.pytorch.org/whl/cpu
   ```

6. **Display environment variables:**
   ```bash
   echo 'To use this configuration:'
   echo '  export TT_METAL_HOME=~/tt-metal'
   echo '  export MESH_DEVICE=N150'
   echo '  source ~/tt-vllm-venv/bin/activate'
   ```

**Script saved to:**
```
~/tt-scratchpad/setup-scripts/setup_llama_3_1_8b_instruct.sh
```

**HuggingFace Authentication Options:**

If the model is gated (like Llama models), you need authentication:

**Option 1: Environment variable (recommended)**
```bash
export HF_TOKEN=hf_...
python3 ~/tt-scratchpad/tt-jukebox.py --model llama-3.1-8b --setup
```

**Option 2: Command line argument**
```bash
python3 ~/tt-scratchpad/tt-jukebox.py --model llama-3.1-8b --setup --hf-token hf_...
```

**Option 3: Use existing huggingface-cli login**
```bash
huggingface-cli login
# Enter token when prompted
python3 ~/tt-scratchpad/tt-jukebox.py --model llama-3.1-8b --setup
```

**What happens during model download:**
- TT-Jukebox checks if model already exists in `~/models/` or HF cache
- If model exists: Shows "✓ Model already exists at {path}"
- If model missing: Downloads using `huggingface-cli download {hf_repo} --local-dir {path}`
- If authentication fails: Shows clear error with instructions

---

## Step 7: Execute Setup Script

**Option 1: Run interactively (recommended first time)**
```bash
bash ~/tt-scratchpad/setup-scripts/setup_llama_3_1_8b_instruct.sh
```

[▶️ Run Setup Script](command:tenstorrent.runJukeboxSetup)

**Option 2: Use TT-Jukebox with auto-execute**
```bash
python3 ~/tt-scratchpad/tt-jukebox.py --model llama-3.1-8b --setup

# TT-Jukebox asks:
# "Run setup now? (y/N):"
# Type 'y' to execute immediately
```

**Setup takes ~10-15 minutes:**
- Git operations: ~1-2 min
- tt-metal build: ~5-8 min
- Python venv + deps: ~3-5 min

**Progress monitoring:**
```bash
# Watch in real-time
tail -f ~/tt-scratchpad/setup-scripts/setup_llama_3_1_8b_instruct.log
```

---

## Step 8: Verify Setup

**After setup completes, verify:**

1. **Check tt-metal commit:**
   ```bash
   cd ~/tt-metal && git rev-parse --short HEAD
   # Should show: 9b67e09
   ```

2. **Check vLLM commit:**
   ```bash
   cd ~/tt-vllm && git rev-parse --short HEAD
   # Should show: a91b644
   ```

3. **Activate environment:**
   ```bash
   source ~/tt-vllm-venv/bin/activate
   export TT_METAL_HOME=~/tt-metal
   export MESH_DEVICE=N150
   source ~/tt-vllm/tt_metal/setup-metal.sh
   ```

4. **Test imports:**
   ```bash
   python -c "import ttnn; import vllm; print('✓ Environment ready!')"
   ```

[✅ Verify Environment](command:tenstorrent.verifyJukeboxEnv)

---

## Step 9: Start vLLM Server with Correct Configuration

**Now that your environment matches the spec, start vLLM:**

```bash
cd ~/tt-vllm
source ~/tt-vllm-venv/bin/activate
export TT_METAL_HOME=~/tt-metal
export MESH_DEVICE=N150
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
source ~/tt-vllm/tt_metal/setup-metal.sh

python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Llama-3.1-8B-Instruct \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 65536 \
    --max-num-seqs 32 \
    --block-size 64
```

[🚀 Start vLLM Server](command:tenstorrent.startJukeboxVllm)

**Why these flags matter:**
- `--max-model-len 65536`: From spec's `max_context` (64K limit for N150)
- `--max-num-seqs 32`: From spec's `max_concurrency`
- `--block-size 64`: From spec's `block_size`

**These are NOT arbitrary!** They come directly from the model spec tested by Tenstorrent engineers.

---

## Step 10: Test with OpenAI SDK

**Install OpenAI SDK:**
```bash
pip install openai
```

**Basic test:**
```python
from openai import OpenAI

client = OpenAI(
    base_url='http://localhost:8000/v1',
    api_key='dummy'  # vLLM doesn't require real API key
)

response = client.chat.completions.create(
    model='meta-llama/Llama-3.1-8B-Instruct',
    messages=[
        {'role': 'user', 'content': 'What is machine learning?'}
    ],
    max_tokens=128,
    temperature=0.7
)

print(response.choices[0].message.content)
```

[🧪 Test with OpenAI SDK](command:tenstorrent.testJukeboxOpenai)

**Expected output:**
```
Machine learning is a subset of artificial intelligence (AI) that involves
training algorithms to learn from data and make predictions or decisions
without being explicitly programmed. It enables computers to improve their
performance on a task over time through experience...
```

---

## Step 11: Test with curl (Simple HTTP)

**Basic query:**
```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Llama-3.1-8B-Instruct",
    "messages": [
      {"role": "user", "content": "Explain neural networks in one sentence"}
    ],
    "max_tokens": 64
  }'
```

[📡 Test with curl](command:tenstorrent.testJukeboxCurl)

**Expected JSON response:**
```json
{
  "id": "cmpl-...",
  "object": "chat.completion",
  "created": 1699000000,
  "model": "meta-llama/Llama-3.1-8B-Instruct",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Neural networks are computing systems inspired by biological neural networks that learn patterns from data through interconnected layers of nodes."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 24,
    "total_tokens": 36
  }
}
```

---

## Step 12: Monitor Performance with `pv` (Pipe Viewer)

**Install pv:**
```bash
# macOS
brew install pv

# Linux (Ubuntu/Debian)
sudo apt-get install pv

# Linux (RHEL/CentOS)
sudo yum install pv
```

**Monitor API response streaming:**
```bash
curl -N http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Llama-3.1-8B-Instruct",
    "messages": [
      {"role": "user", "content": "Write a story about AI"}
    ],
    "max_tokens": 512,
    "stream": true
  }' | pv -l -i 0.1
```

[📊 Monitor with pv](command:tenstorrent.monitorJukeboxPv)

**What `pv` shows:**
```
[Server-Sent Events streaming...]
  128 lines  0:00:05 [25.6 lines/s]
```

**Flags explained:**
- `-l`: Count lines (SSE events)
- `-i 0.1`: Update interval (0.1 seconds)
- `-N`: curl's no-buffer mode for streaming

**Advanced monitoring with rate limiting:**
```bash
curl -N http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{...}' | pv -l -L 50 > response.log
```

**Flags:**
- `-L 50`: Limit to 50 lines/second (rate limiting)
- `> response.log`: Save to file

---

## Hardware-Specific Workflows

Different hardware types have different capabilities and requirements. Here are complete workflows for common scenarios:

### Workflow 1: N150 Single-Chip Development

**Scenario:** You have an N150 in the cloud, want to run Llama 3.1 8B for chat.

**Why this works:**
- N150 = single chip, perfect for 8B models
- 64K context limit
- Simple configuration (no tensor parallelism)

**Complete workflow:**

```bash
# 1. Identify your hardware
tt-smi -s
# Example output:
# {
#   "board_info": {
#     "board_type": "n150",
#     "coords": "0,0"
#   }
# }
# Look for: "board_type": "n150"

# 2. Find chat models for N150
python3 ~/tt-scratchpad/tt-jukebox.py chat

# 3. Select Llama-3.1-8B-Instruct from the list
# Jukebox shows:
#   - Model: Llama-3.1-8B-Instruct
#   - Device: N150
#   - Context: 65,536 tokens
#   - Status: Validated configuration

# 4. Generate and review setup script
python3 ~/tt-scratchpad/tt-jukebox.py --model llama-3.1-8b --setup
# Script saved to: ~/tt-scratchpad/setup-scripts/setup_llama_3_1_8b_instruct.sh

# 5. Execute setup (10-15 minutes)
bash ~/tt-scratchpad/setup-scripts/setup_llama_3_1_8b_instruct.sh

# 6. Activate environment
cd ~/tt-vllm
source ~/tt-vllm-venv/bin/activate
export TT_METAL_HOME=~/tt-metal
export MESH_DEVICE=N150
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
source ~/tt-vllm/tt_metal/setup-metal.sh

# 7. Start vLLM with validated flags
python ~/tt-scratchpad/start-vllm-server.py \
  --model ~/models/Llama-3.1-8B-Instruct \
  --host 0.0.0.0 \
  --port 8000 \
  --max-model-len 65536 \
  --max-num-seqs 16 \
  --block-size 64

# 8. Test
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "meta-llama/Llama-3.1-8B-Instruct", "messages": [{"role": "user", "content": "Hello!"}]}'
```

**Result:** Validated N150 configuration in ~15 minutes.

---

### Workflow 2: N300 Dual-Chip Code Assistance

**Scenario:** You have N300, want Qwen 2.5 Coder for programming tasks.

**Why this works:**
- N300 = dual chip, enables tensor parallelism
- 128K context limit
- Qwen 2.5 Coder requires TP=2 (uses both chips)

**Complete workflow:**

```bash
# 1. Identify hardware
tt-smi -s
# Example output: {"board_info": {"board_type": "n300", "coords": "0,0"}}
# Look for: "board_type": "n300"

# 2. Find code models for N300
python3 ~/tt-scratchpad/tt-jukebox.py code_assistant

# 3. Select Qwen-2.5-7B-Coder
# Jukebox shows:
#   - Model: Qwen-2.5-7B-Coder
#   - Device: N300
#   - Context: 32,768 tokens
#   - Tensor Parallelism: TP=2

# 4. Generate setup with TP=2 configuration
python3 ~/tt-scratchpad/tt-jukebox.py --model qwen-2.5-7b --setup

# 5. Execute setup
bash ~/tt-scratchpad/setup-scripts/setup_qwen_2_5_7b_coder.sh

# 6. Activate environment
cd ~/tt-vllm
source ~/tt-vllm-venv/bin/activate
export TT_METAL_HOME=~/tt-metal
export MESH_DEVICE=N300
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
source ~/tt-vllm/tt_metal/setup-metal.sh

# 7. Start vLLM with tensor parallelism
python ~/tt-scratchpad/start-vllm-server.py \
  --model ~/models/Qwen-2.5-7B-Coder \
  --host 0.0.0.0 \
  --port 8000 \
  --max-model-len 32768 \
  --max-num-seqs 32 \
  --block-size 64 \
  --tensor-parallel-size 2

# 8. Test coding assistance
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "Qwen-2.5-7B-Coder", "messages": [{"role": "user", "content": "Write a Python function to reverse a linked list"}]}'
```

**Result:** Code assistant optimized for N300's dual chips.

---

### Workflow 3: P100 Blackhole Experimental

**Scenario:** You have new P100 hardware, want to try latest models.

**Why this might work:**
- P100 = Blackhole architecture (newer)
- Similar to N150 (single chip)
- Some models validated, others experimental

**Complete workflow:**

```bash
# 1. Identify hardware
tt-smi -s
# Example output: {"board_info": {"board_type": "p100", "coords": "0,0"}}
# Look for: "board_type": "p100"

# 2. List all P100 models (including experimental)
python3 ~/tt-scratchpad/tt-jukebox.py --list --show-experimental

# Jukebox shows:
# ✓ VALIDATED MODELS
#   - Llama-3.1-8B-Instruct [COMPLETE]
#
# ⚠ EXPERIMENTAL MODELS (not validated)
#   - Qwen-2.5-7B-Coder (validated for N300)
#     Reason: same architecture family (blackhole/wormhole)

# 3. Option A: Use validated model (safe)
python3 ~/tt-scratchpad/tt-jukebox.py --model llama-3.1-8b --setup

# 3. Option B: Try experimental model (adventurous)
python3 ~/tt-scratchpad/tt-jukebox.py --model qwen-2.5-7b --setup --show-experimental
# Jukebox automatically applies conservative parameters:
#   - Reduces max-context by 33% for safety
#   - Warns about unvalidated status

# 4. Execute setup
bash ~/tt-scratchpad/setup-scripts/setup_<model>.sh

# 5. Activate environment
cd ~/tt-vllm
source ~/tt-vllm-venv/bin/activate
export TT_METAL_HOME=~/tt-metal
export MESH_DEVICE=P100
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
source ~/tt-vllm/tt_metal/setup-metal.sh

# 6. Start vLLM (flags from Jukebox)
python ~/tt-scratchpad/start-vllm-server.py \
  --model ~/models/<model-name> \
  --host 0.0.0.0 \
  --port 8000 \
  <jukebox-generated-flags>

# 7. Test carefully
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "<model-name>", "messages": [{"role": "user", "content": "Test query"}]}'

# 8. Report results!
# If it works, share findings with community
# If it fails, try validated model instead
```

**Experimental models = adventure!** Report what works to help the community.

---

### Workflow 4: T3K Production Deployment

**Scenario:** You have T3K (8 chips), need Llama 3.1 70B for production serving.

**Why this works:**
- T3K = 8 chips, designed for large models
- 128K context limit
- Llama 3.1 70B requires TP=8 (uses all chips)
- Production-grade performance

**Complete workflow:**

```bash
# 1. Identify hardware
tt-smi -s
# Example output: {"board_info": {"board_type": "t3k", "coords": "0,0"}}
# Look for: "board_type": "t3k"

# 2. Find large models for T3K
python3 ~/tt-scratchpad/tt-jukebox.py --model llama-70b

# Jukebox shows:
#   - Model: Llama-3.1-70B-Instruct
#   - Device: T3K
#   - Context: 131,072 tokens (128K)
#   - Tensor Parallelism: TP=8

# 3. Generate setup (includes TP=8 config)
python3 ~/tt-scratchpad/tt-jukebox.py --model llama-3.1-70b --setup

# 4. Execute setup (may take longer - large model)
bash ~/tt-scratchpad/setup-scripts/setup_llama_3_1_70b_instruct.sh
# Downloads ~140GB model

# 5. Activate environment
cd ~/tt-vllm
source ~/tt-vllm-venv/bin/activate
export TT_METAL_HOME=~/tt-metal
export MESH_DEVICE=T3K
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
source ~/tt-vllm/tt_metal/setup-metal.sh

# 6. Start vLLM with production settings
python ~/tt-scratchpad/start-vllm-server.py \
  --model ~/models/Llama-3.1-70B-Instruct \
  --host 0.0.0.0 \
  --port 8000 \
  --max-model-len 131072 \
  --max-num-seqs 64 \
  --block-size 64 \
  --tensor-parallel-size 8

# 7. Test production workload
# Use load testing tool like Apache Bench or hey
hey -n 100 -c 10 -m POST \
  -H "Content-Type: application/json" \
  -d '{"model": "meta-llama/Llama-3.1-70B-Instruct", "messages": [{"role": "user", "content": "Explain quantum computing"}]}' \
  http://localhost:8000/v1/chat/completions

# 8. Monitor performance
curl http://localhost:8000/metrics  # Prometheus metrics
```

**Result:** Production-grade 70B serving with validated T3K config.

---

### Workflow 5: Switching Between Models

**Scenario:** You need to switch from Llama to Mistral for A/B testing.

**Why Jukebox helps:**
- Different models often need different commits
- Manual switching = error-prone
- Jukebox generates exact setup for each

**Complete workflow:**

```bash
# Current: Running Llama 3.1 8B
# Goal: Switch to Mistral 7B for comparison

# 1. Generate Mistral setup
python3 ~/tt-scratchpad/tt-jukebox.py --model mistral --setup

# Jukebox shows:
#   Current tt-metal: abc1234 (Llama config)
#   Required tt-metal: def5678 (Mistral config)
#   Will checkout and rebuild

# 2. Stop current vLLM server
# (Ctrl+C in server terminal)

# 3. Execute Mistral setup
bash ~/tt-scratchpad/setup-scripts/setup_mistral_7b_instruct.sh

# 4. Start Mistral
cd ~/tt-vllm
source ~/tt-vllm-venv/bin/activate
export TT_METAL_HOME=~/tt-metal
export MESH_DEVICE=N150
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH
source ~/tt-vllm/tt_metal/setup-metal.sh

python ~/tt-scratchpad/start-vllm-server.py \
  --model ~/models/Mistral-7B-Instruct-v0.3 \
  --port 8000 \
  --max-model-len 32768 \
  --max-num-seqs 16

# 5. Run A/B comparison
# Same prompts, different models, compare results

# 6. Switch back to Llama
python3 ~/tt-scratchpad/tt-jukebox.py --model llama-3.1-8b --setup
bash ~/tt-scratchpad/setup-scripts/setup_llama_3_1_8b_instruct.sh
# (restart server with Llama)
```

**Result:** Safe model switching with environment isolation.

---

## Workflow Quick Reference

| Scenario | Hardware | Model | Key Flags |
|----------|----------|-------|-----------|
| **Development** | N150, P100 | Llama 3.1 8B | `--max-model-len 65536` |
| **Code Assistance** | N300 | Qwen 2.5 7B | `--tensor-parallel-size 2` |
| **Experimental** | P100, P150 | Various | `--show-experimental` |
| **Production** | T3K | Llama 3.1 70B | `--tensor-parallel-size 8` |
| **Model Switching** | Any | Multiple | Generate setup per model |

---

## Troubleshooting

**"No models found for N300"**
- Problem: TT-Jukebox filters by hardware type
- Solution: Check `tt-smi` output matches your hardware
- Workaround: Manually specify `--model` to skip hardware filtering

**"Cannot proceed without hardware detection"**
- Problem: `tt-smi` not found or hardware not connected
- Solution: Install tt-smi or check hardware connection
- Workaround: Edit script to skip hardware check (for testing)

**"Failed to fetch model specs"**
- Problem: Network issue or GitHub rate limiting
- Solution: Check internet connection, retry in a few minutes
- Workaround: Download JSON manually and point script to local file

**"Setup script fails during git checkout"**
- Problem: Uncommitted changes in tt-metal or tt-vllm
- Solution: Stash changes: `git stash` before running setup
- Or: Commit your changes: `git commit -am "WIP"`

**"tt-metal build fails"**
- Problem: Missing dependencies or compiler issues
- Solution: Check tt-metal installation prerequisites
- See: https://github.com/tenstorrent/tt-metal#prerequisites

**"vLLM server crashes on startup"**
- Problem: Wrong commits, missing dependencies, or wrong flags
- Solution: Re-run setup script to ensure exact versions
- Check: All environment variables set correctly
- Verify: `--max-model-len` matches your hardware (64K for N150)

---

## Advanced: Multi-Model Environments

**Problem:** Different models need different commits - how to switch?

**Solution 1: Multiple tt-metal clones (disk-heavy)**
```bash
# Clone separate copies
git clone https://github.com/tenstorrent/tt-metal.git ~/tt-metal-llama
git clone https://github.com/tenstorrent/tt-metal.git ~/tt-metal-mistral

# Checkout different commits
cd ~/tt-metal-llama && git checkout 9b67e09 && ./build_metal.sh
cd ~/tt-metal-mistral && git checkout 13f44c5 && ./build_metal.sh

# Switch by changing TT_METAL_HOME
export TT_METAL_HOME=~/tt-metal-llama  # Use Llama config
export TT_METAL_HOME=~/tt-metal-mistral  # Use Mistral config
```

**Solution 2: Git worktrees (disk-efficient)**
```bash
# Create worktrees from single clone
cd ~/tt-metal
git worktree add ~/tt-metal-worktrees/llama 9b67e09
git worktree add ~/tt-metal-worktrees/mistral 13f44c5

# Build each worktree
cd ~/tt-metal-worktrees/llama && ./build_metal.sh
cd ~/tt-metal-worktrees/mistral && ./build_metal.sh

# Switch environments
export TT_METAL_HOME=~/tt-metal-worktrees/llama
export TT_METAL_HOME=~/tt-metal-worktrees/mistral
```

**Solution 3: Docker containers (isolation)**
```dockerfile
# Dockerfile.llama
FROM ubuntu:22.04
RUN git clone https://github.com/tenstorrent/tt-metal.git && \
    cd tt-metal && git checkout 9b67e09 && ./build_metal.sh
# ... vLLM setup ...

# Dockerfile.mistral
FROM ubuntu:22.04
RUN git clone https://github.com/tenstorrent/tt-metal.git && \
    cd tt-metal && git checkout 13f44c5 && ./build_metal.sh
# ... vLLM setup ...
```

---

## Key Takeaways

✅ **TT-Jukebox eliminates version mismatch** - Uses official tested commits

✅ **Reproducible environments** - Share setup scripts with team

✅ **Intelligent matching** - Find models by task or name

✅ **Hardware-aware** - Only shows compatible models for your device

✅ **Automated setup** - Generate bash scripts that do everything

✅ **Production-ready configs** - vLLM flags from tested specifications

**You now have:**
- Tool to explore 100+ model configurations
- Automated environment setup scripts
- Correct vLLM server flags for each model
- Testing tools (curl, OpenAI SDK, pv)
- Workflow for switching between models

**Next steps:**
- Try different models (Gemma, Qwen, Mistral)
- Compare performance across model families
- Build production deployments with confidence
- Share environments with your team via setup scripts

**The power of TT-Jukebox:**
No more guessing. No more version errors. Just reproducible, tested environments that work the first time.
