# AI-Powered VSCode Chat with Tenstorrent

Bring your Tenstorrent hardware directly into VSCode's chat interface. Use `@tenstorrent` to get AI-powered assistance running on your local hardware - perfect for developing against Tenstorrent while getting AI help from Tenstorrent itself!

## What You'll Build

A VSCode chat participant that:
- ✨ Appears as `@tenstorrent` in VSCode chat
- 🏃 Runs entirely on your Tenstorrent hardware
- ⚡ Responds in 1-3 seconds (model stays loaded)
- 🔒 Keeps your code private (no cloud API calls)
- 🎨 Integrates seamlessly with VSCode's native UI

## Journey So Far

- **Lesson 1-2:** Hardware detection and tt-metal verification
- **Lesson 3:** Downloaded models (recommended: Qwen3-0.6B)
- **Lesson 4-5:** Direct API and Flask HTTP server
- **Lesson 6-7:** Production inference with vLLM
- **Lesson 8:** VSCode Chat Integration ← **You are here**

---

## Starting Fresh?

This lesson requires a running vLLM server. Let's check your setup:

### Step 1: Check Hardware

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

**Note your hardware type** (look for `board_type` field):
- `"n150"`, `"n300"`, `"t3k"` → Wormhole family
- `"p100"`, `"p150"` → Blackhole family

**Quick extract:**
```bash
tt-smi -s | grep -o '"board_type": "[^"]*"'
```

### Step 2: Verify vLLM Installation

```bash
# vLLM repo exists?
[ -d ~/tt-vllm ] && echo "✓ vLLM installed" || echo "✗ Need to install vLLM"

# vLLM venv exists?
[ -d ~/tt-vllm-venv ] && echo "✓ vLLM venv found" || echo "✗ Need to create venv"
```

**All checks passed?** Skip to [Quick Start: Launch vLLM Server](#quick-start-launch-vllm-server) below.

**vLLM not installed?** You have two options:

#### Option 1: Full vLLM Tutorial (Recommended for Learning)

Complete [Lesson 6: Production Inference with vLLM](#) - includes:
- Full explanation of vLLM
- Hardware-specific configurations
- Testing and troubleshooting

Takes ~30-45 minutes but teaches you everything about vLLM.

#### Option 2: Quick Install (Faster)

If you just want to get the chat working:

```bash
# Clone vLLM
cd ~ && \
  git clone --branch dev https://github.com/tenstorrent/vllm.git tt-vllm && \
  cd tt-vllm

# Create venv and install
python3 -m venv ~/tt-vllm-venv && \
  source ~/tt-vllm-venv/bin/activate && \
  pip install --upgrade pip && \
  export vllm_dir=$(pwd) && \
  source $vllm_dir/tt_metal/setup-metal.sh && \
  pip install --upgrade ttnn pytest && \
  pip install fairscale termcolor loguru blobfile fire pytz llama-models==0.0.48 && \
  pip install -e . --extra-index-url https://download.pytorch.org/whl/cpu
```

This takes ~10-15 minutes.

### Step 3: Verify Model Downloaded

```bash
# Check for recommended model (Qwen3-0.6B)
ls ~/models/Qwen3-0.6B/config.json
```

**Model missing?** Download it (no token needed!):
```bash
huggingface-cli download Qwen/Qwen3-0.6B --local-dir ~/models/Qwen3-0.6B
```

**Why Qwen3-0.6B?**
- ✅ Ultra-lightweight (0.6B params - 13x smaller than 8B models)
- ✅ Dual thinking modes (fast chat + deep reasoning)
- ✅ Perfect for N150 (zero DRAM issues)
- ✅ No HuggingFace token required
- ✅ Fast inference (sub-second responses)

### Step 4: Check if Server is Already Running

```bash
curl http://localhost:8000/health 2>/dev/null && \
  echo "✓ Server is running!" || \
  echo "✗ Server not running - start it below"
```

**Server is running?** Skip to [Step 2: Enable VSCode Chat](#step-2-enable-vscode-chat).

**Server not running?** Continue to the quick start below.

---

## Quick Start: Launch vLLM Server

**✨ New in v0.0.99:** Ultra-simple commands with smart defaults!

### Recommended: N150 with Qwen3-0.6B (Single Command!)

**✨ New in v0.0.101:** Ultra-simple command with full hardware auto-detection!

```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  python ~/tt-scratchpad/start-vllm-server.py --model ~/models/Qwen3-0.6B
```

**That's it!** The script auto-detects and configures everything:
- ✅ **Hardware** (N150/N300/T3K/P100) via tt-smi
- ✅ **MESH_DEVICE**, **TT_METAL_ARCH_NAME**, **TT_METAL_HOME**
- ✅ `--served-model-name Qwen/Qwen3-0.6B`
- ✅ `--max-model-len 2048`, `--max-num-seqs 16`, `--block-size 64`

**Perfect for chat:** Fast, lightweight, reasoning-capable, works on any hardware!

---

### P100 (Blackhole)

**Hardware auto-detection works for P100 too!** No need to set TT_METAL_ARCH_NAME manually anymore.

```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  python ~/tt-scratchpad/start-vllm-server.py --model ~/models/Qwen3-0.6B
```

**Script auto-detects P100 and sets TT_METAL_ARCH_NAME=blackhole for you!**

---

### N300/T3K (Multi-Chip - Optional)

**For Qwen3-0.6B:** Same command as N150! Hardware auto-detects N300/T3K.

```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  python ~/tt-scratchpad/start-vllm-server.py --model ~/models/Qwen3-0.6B
```

**For larger models like Llama-3.1-8B with longer context:**

```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Llama-3.1-8B-Instruct \
    --max-model-len 8192 \
    --tensor-parallel-size 2
```

**Hardware auto-detects N300/T3K and sets MESH_DEVICE for you!**

**Wait for:** "Application startup complete" message in the terminal.

**Then continue** to enable the chat participant below.

---

## Prerequisites

- ✅ Qwen3-0.6B downloaded (from quick install above) - No HF token needed!
- ✅ vLLM installed (from Lesson 7 or quick install above)
- ✅ vLLM server running (from quick start above)

## Step 1: Verify Server is Running

Before enabling the chat, let's make sure the server is accessible:

```bash
curl http://localhost:8000/health
```

**Expected response:** `{"status":"ok"}` or similar

**No response?** The server isn't running. Go back to [Quick Start: Launch vLLM Server](#quick-start-launch-vllm-server).

**Got a response?** Continue to Step 2!

## Step 2: Enable VSCode Chat

Once the server is ready (check with Step 1 above), enable the `@tenstorrent` chat participant:

[💬 Enable @tenstorrent Chat](command:tenstorrent.enableChatParticipant)

**What this does:**
- Verifies vLLM server is running
- Activates the `@tenstorrent` chat participant
- Makes it available in VSCode chat interface

**You're ready!** The chat participant is now active.

## Step 3: Try It Out

Open the chat interface with a sample prompt:

[🧪 Test Chat Integration](command:tenstorrent.testChat)

**What this does:**
- Opens VSCode chat panel
- Pre-fills with a sample question
- Demonstrates the integration working end-to-end

## Usage Examples

### Code Explanation

Select code in your editor, then ask:
```
@tenstorrent explain what this code does
```

### Code Generation

```
@tenstorrent write a Python function that uses tt-metal to multiply matrices
```

### Debugging Help

```
@tenstorrent why might this tt-metal kernel cause a segfault?
```

### Architecture Questions

```
@tenstorrent explain the difference between DRAM and L1 cache on Tenstorrent
```

### Learning Tenstorrent

```
@tenstorrent how do I create a tensor operation in tt-metal?
```

### Code Review

Select code and ask:
```
@tenstorrent review this code for performance issues on Tenstorrent hardware
```

## How It Works

```
┌──────────────────────────────────────┐
│  You type in VSCode chat:            │
│  "@tenstorrent explain this code"    │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│  Extension forwards to vLLM          │
│  (localhost:8000)                    │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│  vLLM processes with Qwen3-0.6B      │
│  Running on YOUR Tenstorrent device  │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│  Response streams back to chat       │
│  Token by token (real-time)          │
└──────────────────────────────────────┘
```

**Key flow:**
1. **You type:** `@tenstorrent <your question>`
2. **Extension receives:** Your prompt via VSCode Chat API
3. **Extension forwards:** Prompt to vLLM server (localhost:8000)
4. **vLLM processes:** Uses Qwen3-0.6B on Tenstorrent hardware (dual thinking modes!)
5. **Extension streams:** Response back to chat interface token-by-token
6. **You see:** Real-time AI responses, fully local

## Benefits of Local AI in VSCode

**🔒 Privacy First**
- Your code never leaves your machine
- No cloud providers see your proprietary code
- Full control over data and model

**⚡ Fast & Responsive**
- 1-3 second response time
- Model stays loaded in memory
- No network latency

**💰 Zero Cost**
- No API fees or rate limits
- Run as many queries as you want
- No per-token charges

**🎯 Full Control**
- Customize the model behavior
- Adjust temperature, max_tokens, etc.
- Swap models anytime

**🚀 Production-Ready**
- Same vLLM infrastructure used in production
- OpenAI-compatible API
- Battle-tested at scale

**🛠️ Perfect for Development**
- Use AI to help develop against Tenstorrent
- Get instant help with tt-metal APIs
- Learn hardware capabilities interactively

## Comparison with Cloud AI Chat

| Feature | @tenstorrent (Local) | Cloud AI |
|---------|---------------------|----------|
| **Privacy** | ✅ 100% local | ❌ Sent to cloud |
| **Cost** | ✅ Free | 💰 Pay per token |
| **Speed** | ✅ 1-3 sec | ⚡ 0.5-2 sec |
| **Rate Limits** | ✅ None | ⚠️ Limited |
| **Customization** | ✅ Full control | ❌ Fixed models |
| **Offline Work** | ✅ Works offline | ❌ Requires internet |
| **Code Privacy** | ✅ Never leaves machine | ❌ Uploaded to vendor |
| **Data Retention** | ✅ You control | ⚠️ Vendor policies |

## Real-World Use Cases

### Use Case 1: Learning Tenstorrent

As you explore tt-metal documentation:

```
@tenstorrent what's the difference between circular buffers and regular buffers in tt-metal?
```

Get instant explanations without leaving VSCode.

### Use Case 2: Code Generation

Building a new kernel:

```
@tenstorrent write a tt-metal kernel that performs element-wise addition on two tensors
```

Get a starting point, then customize.

### Use Case 3: Debugging

Encountering an error:

```
@tenstorrent I'm getting "RuntimeError: L1 buffer overflow". What does this mean and how do I fix it?
```

Get context-aware debugging help.

### Use Case 4: Performance Optimization

Optimizing code:

```
@tenstorrent how can I optimize this matmul operation for better memory utilization on Tenstorrent?
```

Get hardware-specific optimization tips.

### Use Case 5: Code Review

Before committing:

```
@tenstorrent review this code for potential issues with Tenstorrent's memory hierarchy
```

Catch issues early.

## Advanced Tips

### Include Context

Select code before asking for better context:

1. Highlight code in editor
2. Open chat
3. Type `@tenstorrent explain this code`
4. VSCode automatically includes the selected code

### Follow-up Questions

Chat maintains conversation history:

```
You: @tenstorrent what is ttnn?
AI: [explains ttnn...]
You: @tenstorrent how do I use it for convolutions?
AI: [builds on previous answer...]
```

### Customize System Prompt

Want different behavior? Modify the system prompt in `extension.ts`:

```typescript
{role: 'system', content: 'You are an expert in Tenstorrent hardware...'}
```

### Adjust Parameters

In `extension.ts`, you can tune:
- `temperature`: 0.1 (focused) to 1.0 (creative)
- `max_tokens`: Response length limit
- `top_p`: Nucleus sampling parameter

## Troubleshooting

### "vLLM server not running"

**Solution:** Run Step 1 again to start the server. Wait for "Application startup complete" in the terminal.

### "Connection refused" error

**Check:**
```bash
curl http://localhost:8000/health
```

Should return `{"status": "ok"}`. If not, restart vLLM server.

### Slow responses (>10 seconds)

**Possible causes:**
- Server is handling another request
- Model needs to be reloaded
- Check terminal for errors

**Solution:** Check the "TT vLLM Server" terminal for error messages.

### Chat participant not appearing

**Solution:**
1. Reload VSCode window (Cmd+R or Ctrl+R)
2. Check that extension is activated
3. Try clicking "Enable @tenstorrent Chat" button again

### Responses are cut off

**Solution:** Increase `max_tokens` in `extension.ts`:

```typescript
max_tokens: 1024  // Increase from 512
```

## Architecture Deep Dive

### Extension Components

**1. Chat Participant Handler** (`handleChatRequest`)
- Receives user prompts from VSCode
- Manages streaming responses
- Handles errors gracefully

**2. Server Health Check** (`checkVllmServerRunning`)
- Verifies vLLM server is accessible
- Prevents errors from unreachable server

**3. Command Handlers**
- `startVllmForChat`: Launches vLLM server
- `enableChatParticipant`: Activates chat integration
- `testChat`: Opens chat with sample prompt

### API Integration

Uses OpenAI-compatible API:

```typescript
POST http://localhost:8000/v1/chat/completions
{
  "model": "Qwen/Qwen3-0.6B",
  "messages": [...],
  "stream": true,
  "max_tokens": 512
}
```

Response is Server-Sent Events (SSE) format:
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" world"}}]}
data: [DONE]
```

### Why This Architecture?

**Separation of Concerns:**
- Extension = lightweight UI integration
- vLLM = heavy ML inference
- Clean interface via HTTP

**Reusability:**
- Same vLLM server can serve multiple clients
- Extension code is simple and maintainable
- Easy to update model without changing extension

**Production-Ready:**
- vLLM handles batching, queueing, optimization
- Extension focuses on VSCode integration
- Both components can scale independently

## Performance Characteristics

**First Query After Startup:**
- Server startup: 2-5 minutes (one-time)
- Model load: Included in startup
- First response: 1-3 seconds

**Subsequent Queries:**
- Response time: 1-3 seconds consistently
- Streaming starts: <100ms
- No reload needed

**Memory Usage:**
- vLLM server: ~8-12 GB (model in memory)
- Extension: <50 MB (lightweight)
- Total: Acceptable for development machine

**Concurrent Requests:**
- vLLM handles multiple users efficiently
- Continuous batching optimizes throughput
- No blocking between requests

## What You've Accomplished

✅ **Complete AI infrastructure on Tenstorrent:**
- Hardware detection and setup
- Model download and deployment
- Production-grade serving with vLLM
- Seamless IDE integration

✅ **Full development environment:**
- Use `@tenstorrent` while coding
- Get AI help from your own hardware
- Privacy-preserving, cost-free AI assistance

✅ **Production-ready patterns:**
- OpenAI-compatible API
- Streaming responses
- Error handling and health checks
- Clean separation of concerns

✅ **Foundation for more:**
- Customize the model for your domain
- Fine-tune on your codebase
- Build custom tools and agents
- Scale to team or production use

## Congratulations! 🎉

You've successfully integrated AI-powered chat into VSCode, running entirely on your Tenstorrent hardware!

**You can now:**
- Use `@tenstorrent` to get coding help
- Develop against Tenstorrent with AI assistance
- Keep your code private and local
- Enjoy unlimited, cost-free AI queries
- Build on this foundation for custom tools

**The Meta Moment:** You're now using Tenstorrent hardware to help you develop *for* Tenstorrent hardware. That's the power of local AI! 🚀

## Next Steps

**Experiment with the Chat:**
- Try different types of questions
- Select code and ask for explanations
- Use it for debugging and learning

**Customize the Experience:**
- Adjust system prompt in `extension.ts`
- Tune temperature and max_tokens
- Add custom commands or shortcuts

**Explore Advanced Features:**
- Fine-tune the model on your codebase
- Add RAG (Retrieval-Augmented Generation)
- Create specialized tools or agents
- Share your setup with your team

**Scale to Production:**
- Use same vLLM setup for applications
- Deploy to serve APIs or web apps
- Leverage what you've learned here

## Learn More

- **VSCode Chat API:** [code.visualstudio.com/api/extension-guides/chat](https://code.visualstudio.com/api/extension-guides/chat)
- **vLLM Documentation:** [docs.vllm.ai](https://docs.vllm.ai/en/latest/)
- **OpenAI API Reference:** [platform.openai.com/docs](https://platform.openai.com/docs/api-reference)
- **TT-Metal Docs:** [docs.tenstorrent.com](https://docs.tenstorrent.com/)

## Share Your Experience

Built something cool with this setup? We'd love to hear about it!

- Share on Discord or community forums
- Contribute improvements to the extension
- Write about your use cases

**Thank you for completing this walkthrough!** You're now equipped to build, deploy, and integrate AI on Tenstorrent hardware. Happy coding! 🎉
