# Tenstorrent Developer Extension - FAQ

**Frequently Asked Questions** - Your quick reference for common questions, troubleshooting, and tips from all 14 lessons.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Hardware & Detection](#hardware--detection)
- [Installation & Setup](#installation--setup)
- [Models & Downloads](#models--downloads)
- [Inference & Serving](#inference--serving)
- [Compilers & Tools](#compilers--tools)
- [Troubleshooting](#troubleshooting)
- [Performance & Optimization](#performance--optimization)
- [Community & Support](#community--support)

---

## Getting Started

### Q: Which lesson should I start with?

**A:** Start with **Lesson 1** if you're brand new. The lessons are designed to progress logically:

1. **Hardware Detection** - Verify your hardware
2. **Verify Installation** - Check tt-metal works
3. **Download Model** - Get a model from HuggingFace
4-9. **Build Applications** - Chat, APIs, image generation
10-13. **Advanced Topics** - Compilers, bounty program, cookbook

**Can I skip lessons?** Yes, but check prerequisites at the start of each lesson.

### Q: Do I need to complete lessons in order?

**A:** Not strictly, but:
- **Lessons 1-3** are foundational - most later lessons assume you've done these
- **Lessons 4-9** build on each other but can be done selectively
- **Lessons 10-13** are more independent (compilers, projects)

**Quick start for experienced users:**
1. Run Lesson 1 (2 minutes - verify hardware)
2. Skip to Lesson 6 (vLLM production serving)
3. Explore Lessons 10-13 (compilers and projects)

### Q: What's the difference between the different tools?

**A:** Tenstorrent has several tools serving different purposes:

| Tool | Purpose | When to Use | Maturity |
|------|---------|-------------|----------|
| **tt-metal** | Low-level framework | Custom kernels, maximum control | Stable |
| **vLLM** | LLM serving | Production LLM deployment | Production |
| **TT-Forge** | MLIR compiler | PyTorch models (experimental) | Beta |
| **TT-XLA** | XLA compiler | JAX/PyTorch (production) | Production |

**Simple guide:**
- Need to run LLMs? → **vLLM** (Lesson 6)
- Want to experiment with PyTorch? → **TT-Forge** (Lesson 10)
- Need JAX support? → **TT-XLA** (Lesson 12)
- Building custom kernels? → **tt-metal** (Lessons 1-3, 13)

---

## Hardware & Detection

### Q: Which hardware do I have?

**A:** Run this command:

```bash
tt-smi -s | grep -o '"board_type": "[^"]*"'
```

**Output tells you:**
- **n150** - Single Wormhole chip (development, 64K context)
- **n300** - Dual Wormhole chips (128K context, TP=2)
- **t3k** - Eight Wormhole chips (large models, TP=8)
- **p100** - Single Blackhole chip (newer architecture)
- **p150** - Dual Blackhole chips (TP=2)

### Q: tt-smi says "No devices found" - what do I do?

**A:** Try these steps in order:

1. **Check PCIe detection:**
   ```bash
   lspci | grep -i tenstorrent
   ```
   Should show: `Processing accelerators: Tenstorrent Inc.`

2. **Try with sudo:**
   ```bash
   sudo tt-smi
   ```
   If this works, you have a permissions issue.

3. **Reset the device:**
   ```bash
   tt-smi -r
   ```

4. **Full cleanup (if still failing):**
   ```bash
   sudo pkill -9 -f tt-metal
   sudo pkill -9 -f vllm
   sudo rm -rf /dev/shm/tenstorrent* /dev/shm/tt_*
   tt-smi -r
   ```

**Still not working?** Check [Lesson 1 troubleshooting section](#) for detailed steps.

### Q: What's the difference between Wormhole and Blackhole?

**A:**
- **Wormhole (N150, N300, T3K)** - 2nd generation, well-validated, most models tested
- **Blackhole (P100, P150)** - Latest generation, newer architecture, some experimental models

**For production:** Stick with Wormhole (N150/N300/T3K) - more models validated.

**For experimentation:** Blackhole offers newer features but check model compatibility.

### Q: How do I know what my hardware can run?

**A:** Quick reference:

| Hardware | Max Model Size | Max Context | Multi-chip | Best For |
|----------|---------------|-------------|------------|----------|
| N150, P100 | 8B | 64K | No (TP=1) | Development, prototyping |
| N300, P150 | 13B | 128K | Yes (TP=2) | Medium models, multi-user |
| T3K | 70B+ | 128K | Yes (TP=8) | Large models, production |

---

## Installation & Setup

### Q: How do I verify tt-metal is working?

**A:** Run this quick test:

```bash
python3 -c "import ttnn; print('✓ tt-metal ready')"
```

**If it fails:**
- Check `PYTHONPATH` includes tt-metal directory
- Verify tt-metal is built: `ls ~/tt-metal/build/lib`
- Rebuild if needed: `cd ~/tt-metal && ./build_metal.sh`

### Q: Which Python version do I need?

**A:**
- **Minimum:** Python 3.9
- **Recommended:** Python 3.10+
- **For TT-Forge:** Python 3.11+ (requirement)

Check your version:
```bash
python3 --version
```

### Q: Where should models be installed?

**A:** Standard locations:

- **Recommended:** `~/models/[model-name]/`
  - Example: `~/models/Llama-3.1-8B-Instruct/`
  - Used by most lessons

- **HuggingFace cache:** `~/.cache/huggingface/hub/`
  - Automatic when using `huggingface-cli`
  - Takes more disk space (keeps multiple versions)

**Both formats needed for some lessons:**
- Meta format: `~/models/[model]/original/` (for Lessons 3-5)
- HuggingFace format: `~/models/[model]/` (for Lessons 6-9)

### Q: How much disk space do I need?

**A:** Plan for:
- **tt-metal:** ~5GB (source + build artifacts)
- **vLLM:** ~20GB (including dependencies)
- **Per model:**
  - Small models (1-3B): 10-15GB
  - Medium models (7-8B): 30-40GB
  - Large models (70B): 140GB+

**Minimum for this extension:** 100GB free space

---

## Models & Downloads

### Q: Which model should I download first?

**A:** **Llama-3.1-8B-Instruct** - covered in Lesson 3.

**Why this model:**
- ✅ Works on N150 (most common hardware)
- ✅ Good performance for 8B size
- ✅ Supports all lessons (4-9)
- ✅ Well-tested and documented

**Download command:**
```bash
huggingface-cli download meta-llama/Llama-3.1-8B-Instruct \
  --local-dir ~/models/Llama-3.1-8B-Instruct
```

### Q: How do I handle HuggingFace authentication?

**A:** Three options:

**Option 1: Environment variable (recommended for scripts)**
```bash
export HF_TOKEN=hf_...
huggingface-cli download meta-llama/Llama-3.1-8B-Instruct --local-dir ~/models/Llama-3.1-8B-Instruct
```

**Option 2: Interactive login (recommended for manual use)**
```bash
huggingface-cli login
# Paste your token when prompted
```

**Option 3: In code**
```python
from huggingface_hub import login
login(token="hf_...")
```

**Get a token:** https://huggingface.co/settings/tokens

### Q: Download failed with "repository not found" - why?

**A:** Gated models require access request:

1. Go to model page on HuggingFace
2. Click "Request access" button
3. Wait for approval (usually instant for Llama)
4. Ensure you're authenticated (see question above)

**For Llama models:** Must accept Meta's license agreement.

### Q: Can I use models from other sources?

**A:** Yes, but:
- **HuggingFace format** required for vLLM (Lessons 6-9)
- **Meta checkpoint format** required for Direct API (Lessons 4-5)
- **ONNX/PyTorch format** for TT-Forge (Lesson 10)

**Recommendation:** Stick with HuggingFace - most compatible.

---

## Inference & Serving

### Q: Which inference method should I use?

**A:** Depends on your goal:

| Method | Lesson | Best For | Speed (after load) |
|--------|--------|----------|-------------------|
| **One-shot demo** | 3 | Testing, verification | 2-5 min per query |
| **Interactive chat** | 4 | Learning, prototyping | 1-3 sec per query |
| **Flask API** | 5 | Simple custom APIs | 1-3 sec per query |
| **vLLM** | 6 | Production serving | 1-3 sec per query |

**Quick guide:**
- Just testing? → **Lesson 3** (one-shot demo)
- Learning/experimenting? → **Lesson 4** (interactive)
- Building custom app? → **Lesson 5** (Flask API)
- Production deployment? → **Lesson 6** (vLLM)

### Q: Why does first load take 2-5 minutes?

**A:** Model initialization involves:
1. Loading weights from disk (~16GB for Llama-8B)
2. Converting to TT-Metal format
3. Distributing to hardware cores
4. JIT compilation of kernels

**This is normal and only happens once.**

**Subsequent queries are fast (1-3 seconds)** because model stays in memory.

### Q: Can I run multiple models simultaneously?

**A:** On same hardware: **No** (one model at a time per device)

**Workarounds:**
- Use model switching (stop one, start another)
- Use multiple hardware devices
- Use different hardware for different models (N150 for model A, N300 for model B)

### Q: What does "context length" mean and why does it matter?

**A:**
- **Context length** = Maximum tokens (words/subwords) model can process at once
- Includes both input (prompt) + output (response)

**Hardware limits:**
- N150/P100: 64K tokens (~48K words)
- N300/T3K: 128K tokens (~96K words)

**Exceeding context?**
```
RuntimeError: Input sequence length exceeds maximum
```

**Solutions:**
- Shorten your prompts
- Use summarization for long documents
- Switch to hardware with larger context support

---

## Compilers & Tools

### Q: What's the difference between TT-Forge and TT-XLA?

**A:**

| Feature | TT-Forge (Lesson 10) | TT-XLA (Lesson 12) |
|---------|---------------------|-------------------|
| **Status** | Experimental | Production-ready |
| **Multi-chip** | Single only | Yes (TP/DP) |
| **Frameworks** | PyTorch, ONNX | JAX, PyTorch/XLA |
| **Model support** | Limited (169 validated) | Broader |
| **Installation** | Complex (build from source) | Simple (pip) |

**When to use TT-Forge:**
- Experimenting with PyTorch models
- Learning MLIR compilation
- Working with validated models list

**When to use TT-XLA:**
- Production multi-chip workloads
- JAX workflows
- Need stability and support

### Q: Why did my model fail to compile in TT-Forge?

**A:** TT-Forge is experimental. Common reasons:

1. **Unsupported operators**
   - Not all PyTorch ops implemented
   - Check tt-forge-models for validated examples

2. **Model architecture**
   - Very new architectures may not work
   - Dynamic shapes not supported
   - Control flow limited

3. **Environment variable pollution** (most common!)
   ```bash
   unset TT_METAL_HOME
   unset TT_METAL_VERSION
   # Then try again
   ```

**Recommendation:** Start with MobileNetV2 (Lesson 10 default) - known to work.

### Q: How do I know if my model is supported?

**A:**

**For TT-Forge:**
- Check [tt-forge-models repository](https://github.com/tenstorrent/tt-forge-models)
- 169 validated models listed
- Start with these before trying others

**For vLLM:**
- Llama family well-supported (2, 3, 3.1, 3.2)
- Mistral supported
- Qwen supported (needs N300+ for larger models)
- Check documentation for your specific model

**For TT-XLA:**
- Most JAX/Flax models work
- PyTorch/XLA support growing
- GPT-2 demo included (Lesson 12)

---

## Troubleshooting

### Q: Command failed with "ImportError: undefined symbol"

**A:** This is almost always environment variable pollution.

**Fix:**
```bash
unset TT_METAL_HOME
unset TT_METAL_VERSION
# Retry your command
```

**Make permanent:**
Add to `~/.bashrc`:
```bash
# Prevent TT-Metal environment pollution
unset TT_METAL_HOME
unset TT_METAL_VERSION
```

**Why this happens:** Different versions of libraries loaded due to environment variables overriding build paths.

### Q: vLLM server won't start - what do I check?

**A:** Systematic debugging:

**1. Check environment variables:**
```bash
echo $TT_METAL_HOME    # Should be ~/tt-metal
echo $MESH_DEVICE      # Should match your hardware (N150, etc.)
echo $PYTHONPATH       # Should include $TT_METAL_HOME
```

**2. Verify model path:**
```bash
ls ~/models/Llama-3.1-8B-Instruct/config.json
```

**3. Check for other processes:**
```bash
ps aux | grep -E "tt-metal|vllm"
# Kill if needed:
# pkill -9 -f vllm
```

**4. Verify vLLM installation:**
```bash
source ~/tt-vllm-venv/bin/activate
python3 -c "import vllm; print(vllm.__version__)"
```

**5. Check device availability:**
```bash
tt-smi
# Should show your device
```

### Q: "Out of memory" errors - what can I do?

**A:** Several strategies:

**1. Reduce context length:**
```bash
# Instead of:
--max-model-len 65536

# Try:
--max-model-len 32768
```

**2. Reduce batch size:**
```bash
# Instead of:
--max-num-seqs 32

# Try:
--max-num-seqs 16
```

**3. Use smaller model:**
- 8B → 3B (Llama-3.2-3B)
- 8B → 1B (Llama-3.2-1B)

**4. Clear device state:**
```bash
sudo pkill -9 -f tt-metal
sudo rm -rf /dev/shm/tenstorrent* /dev/shm/tt_*
tt-smi -r
```

### Q: Build failed - where do I look?

**A:**

**tt-metal build issues:**
```bash
cd ~/tt-metal
./build_metal.sh 2>&1 | tee build.log
# Check build.log for errors
```

**Common build failures:**
- **Missing dependencies:** `sudo apt-get install build-essential cmake`
- **Python version:** Need 3.9+ (check with `python3 --version`)
- **Disk space:** Need 10GB+ free
- **Memory:** Need 16GB+ RAM for building

**TT-Forge build issues:**
- **Python 3.11 required:** Can't use older Python
- **clang-17 required:** `sudo apt-get install clang-17`
- **Environment variables:** Must unset TT_METAL_HOME first

### Q: Downloads are slow or failing

**A:**

**Slow downloads:**
- HuggingFace throttles anonymous requests
- Solution: Login with `huggingface-cli login`
- Consider downloading overnight for large models

**Failing downloads:**
1. **Check internet connection**
2. **Verify HF authentication** (see authentication question above)
3. **Check disk space:** `df -h ~`
4. **Try resuming:**
   ```bash
   huggingface-cli download meta-llama/Llama-3.1-8B-Instruct \
     --local-dir ~/models/Llama-3.1-8B-Instruct \
     --resume-download
   ```

---

## Performance & Optimization

### Q: How can I speed up inference?

**A:**

**After first load (model in memory):**
- **Already fast:** 1-3 seconds per query typical
- **Can't improve much:** Hardware-optimized already

**For batch processing:**
- Use vLLM's batching: `--max-num-seqs 32`
- Process multiple requests together
- 3-5x throughput improvement

**For lower latency:**
- Reduce `max_tokens` parameter (shorter responses = faster)
- Use smaller model (8B → 3B)
- Consider hardware upgrade (N150 → N300)

### Q: What are good vLLM server parameters?

**A:** Recommended by hardware:

**N150 (single chip):**
```bash
--max-model-len 65536   # Full 64K context
--max-num-seqs 16       # Moderate batching
--block-size 64         # Standard
```

**N300 (dual chip):**
```bash
--max-model-len 131072  # Full 128K context
--max-num-seqs 32       # Higher batching
--block-size 64
--tensor-parallel-size 2  # Use both chips
```

**T3K (8 chips):**
```bash
--max-model-len 131072
--max-num-seqs 64       # High batching
--block-size 64
--tensor-parallel-size 8  # Use all chips
```

**Conservative (if OOM errors):**
- Reduce `max-model-len` by 50%
- Reduce `max-num-seqs` by 50%
- Test incrementally

### Q: How do I monitor performance?

**A:**

**Token generation speed:**
```bash
# In vLLM output, look for:
"Generated 150 tokens in 2.5 seconds (60 tokens/sec)"
```

**Server metrics:**
```bash
# vLLM exposes Prometheus metrics:
curl http://localhost:8000/metrics
```

**System monitoring:**
```bash
# GPU-like monitoring for TT:
watch -n 1 tt-smi
```

**Load testing:**
```bash
# Install hey:
go install github.com/rakyll/hey@latest

# Test throughput:
hey -n 100 -c 10 -m POST \
  -H "Content-Type: application/json" \
  -d '{"model": "...", "messages": [...]}' \
  http://localhost:8000/v1/chat/completions
```

---

## Community & Support

### Q: Where can I get help?

**A:**

**Official channels:**
- **Discord:** https://discord.gg/tenstorrent (most active)
- **GitHub Issues:**
  - tt-metal: https://github.com/tenstorrent/tt-metal/issues
  - vLLM: https://github.com/tenstorrent/vllm/issues
  - TT-Forge: https://github.com/tenstorrent/tt-forge/issues
- **Documentation:** https://docs.tenstorrent.com

**When asking for help, include:**
1. Hardware type (N150/N300/T3K/P100)
2. Error message (full text)
3. Command you ran
4. Output of `tt-smi`
5. Which lesson you're on

### Q: How do I report a bug?

**A:**

**Before reporting:**
1. Search existing issues on GitHub
2. Verify hardware works (`tt-smi`)
3. Try reset (`tt-smi -r`)
4. Check you're on latest tt-metal/vLLM

**When reporting, include:**
```
Hardware: N150
OS: Ubuntu 22.04
tt-metal version: [git rev-parse HEAD output]
vLLM version: [pip show vllm]
Error: [paste full error]
Steps to reproduce: [numbered list]
```

**Good issue = faster fix!**

### Q: Can I contribute?

**A:** Yes! Several ways:

**1. Bounty Program (Lesson 11)**
- Bring up new models
- Earn rewards
- Official contribution path

**2. Documentation**
- Fix typos/errors
- Add examples
- Improve tutorials

**3. Code contributions**
- Bug fixes
- Performance improvements
- New features

**Start here:**
- Join Discord #contributing channel
- Read CONTRIBUTING.md in respective repos
- Check "good first issue" labels

### Q: Is this production-ready?

**A:** Depends on component:

**Production-ready (✅):**
- **tt-metal** - Stable, tested
- **vLLM** - Production-grade serving
- **TT-XLA** - Production compiler

**Experimental (⚠️):**
- **TT-Forge** - Beta, limited model support
- **Some models** - Check validation status

**Recommendation:**
- **For production:** Stick with vLLM + validated models
- **For experimentation:** Try TT-Forge, new models
- **Always test** thoroughly before production deployment

---

## Quick Reference

### Essential Commands

```bash
# Hardware
tt-smi                                    # Check hardware
tt-smi -s                                # Structured output
tt-smi -r                                # Reset device

# Model info
ls ~/models/                            # List installed models
du -sh ~/models/*                       # Check model sizes

# Environment
python3 -c "import ttnn; print('✓')"   # Test tt-metal
which huggingface-cli                   # Check HF CLI

# vLLM
source ~/tt-vllm-venv/bin/activate      # Activate venv
curl http://localhost:8000/health       # Check server
curl http://localhost:8000/metrics      # Get metrics

# Cleanup
sudo pkill -9 -f "tt-metal|vllm"       # Kill processes
sudo rm -rf /dev/shm/tt_*              # Clear shared memory
tt-smi -r                               # Reset hardware
```

### Quick Diagnostic

Run this to check your setup:

```bash
#!/bin/bash
echo "=== Tenstorrent Diagnostic ==="
echo ""
echo "Hardware:"
tt-smi -s 2>&1 | grep -o '"board_type": "[^"]*"' || echo "❌ No hardware detected"
echo ""
echo "tt-metal:"
python3 -c "import ttnn; print('✓ Working')" 2>&1 || echo "❌ Not working"
echo ""
echo "Models:"
ls ~/models/ 2>/dev/null | head -3 || echo "❌ No models found"
echo ""
echo "Disk space:"
df -h ~ | grep -v Filesystem
echo ""
echo "Python:"
python3 --version
```

---

## Still Have Questions?

**Check:**
1. Specific lesson troubleshooting sections
2. CLAUDE.md for detailed technical info
3. Discord #help channel

**Remember:** Most issues are:
- Environment variables (unset TT_METAL_HOME)
- Permissions (try sudo or add to tenstorrent group)
- Device state (reset with tt-smi -r)

**When in doubt:**
```bash
tt-smi -r
sudo rm -rf /dev/shm/tt_*
# Then retry
```

---

**Last updated:** December 2025
**Extension version:** 0.0.78

**Found an error in this FAQ?** Please report it on GitHub or Discord!
