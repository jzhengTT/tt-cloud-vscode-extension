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
    Device: N150
    Version: 0.3.0
    tt-metal commit: 9b67e09
    vLLM commit: a91b644
    Max context: 65,536 tokens
    Min disk: 36 GB
    Min RAM: 32 GB
    Status: Setup required
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
- Your tt-metal commit vs required commit
- Your vLLM commit vs required commit
- Displays exactly what needs to change

**Possible statuses:**
✅ **Environment matches!** - You can use this model right now
⚠️ **Setup required** - Commits don't match, setup script will fix it

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

1. **Check out exact tt-metal commit:**
   ```bash
   cd ~/tt-metal
   git fetch origin
   git checkout 9b67e09
   git submodule update --init --recursive
   ./build_metal.sh
   ```

2. **Check out exact vLLM commit:**
   ```bash
   cd ~/tt-vllm
   git fetch origin
   git checkout a91b644
   ```

3. **Create/update Python venv:**
   ```bash
   python3 -m venv ~/tt-vllm-venv
   source ~/tt-vllm-venv/bin/activate
   ```

4. **Install dependencies:**
   ```bash
   pip install --upgrade pip
   export vllm_dir=~/tt-vllm
   source $vllm_dir/tt_metal/setup-metal.sh
   pip install --upgrade ttnn pytest
   pip install fairscale termcolor loguru blobfile fire pytz llama-models==0.0.48
   pip install -e . --extra-index-url https://download.pytorch.org/whl/cpu
   ```

5. **Display environment variables:**
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

## Real-World Workflow Example

**Scenario:** You want to run Mistral-7B for a chatbot project.

**Step-by-step:**

1. **Find compatible config:**
   ```bash
   python3 tt-jukebox.py --model mistral
   ```
   → Shows Mistral-7B-Instruct-v0.3 on N150

2. **Check environment:**
   → TT-Jukebox says: "Setup required"
   → tt-metal needs: `13f44c5`
   → vLLM needs: `c123abc`

3. **Generate setup:**
   ```bash
   python3 tt-jukebox.py --model mistral --setup
   ```
   → Script saved to `~/tt-scratchpad/setup-scripts/setup_mistral_7b.sh`

4. **Execute setup:**
   ```bash
   bash ~/tt-scratchpad/setup-scripts/setup_mistral_7b.sh
   ```
   → Wait 10-15 minutes (grab coffee ☕)

5. **Download model:**
   ```bash
   hf download mistralai/Mistral-7B-Instruct-v0.3 \
       --local-dir ~/models/Mistral-7B-Instruct-v0.3
   ```

6. **Start vLLM:**
   ```bash
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
   ```

7. **Test:**
   ```bash
   curl http://localhost:8000/v1/chat/completions \
       -H "Content-Type: application/json" \
       -d '{
         "model": "mistralai/Mistral-7B-Instruct-v0.3",
         "messages": [{"role": "user", "content": "Hello!"}]
       }'
   ```

8. **Deploy chatbot:**
   → Now you have a reproducible, tested environment
   → Share `setup_mistral_7b.sh` with team
   → Everyone gets identical versions

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
