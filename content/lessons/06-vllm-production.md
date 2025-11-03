# Production Inference with vLLM

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

- tt-metal installed and working
- Model downloaded (Llama-3.1-8B-Instruct)
- Python 3.10+ recommended
- ~20GB disk space for vLLM installation

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

## Step 2: Setup vLLM Environment

Create a dedicated virtual environment and install vLLM:

```bash
cd ~/tt-vllm && \
  python3 -m venv ~/tt-vllm-venv && \
  source ~/tt-vllm-venv/bin/activate && \
  pip install --upgrade pip && \
  export vllm_dir=$(pwd) && \
  source $vllm_dir/tt_metal/setup-metal.sh && \
  pip install -e . --extra-index-url https://download.pytorch.org/whl/cpu
```

[⚙️ Install vLLM](command:tenstorrent.installVllm)

**What this does:**
- Creates a dedicated Python virtual environment at `~/tt-vllm-venv`
- Activates the venv (isolated from other Python packages)
- Upgrades pip to the latest version
- Sources tt-metal setup script for Tenstorrent support
- Installs vLLM and all dependencies in the venv
- Takes ~5-10 minutes

**Why a separate venv?** This prevents dependency conflicts between vLLM and other Python environments (like tt-metal's). Each environment stays clean and isolated.

**Note:** This installs vLLM in editable mode (`-e`), so you can modify it if needed.

## Step 3: Run Offline Inference

Test vLLM with a simple offline inference example:

```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export HF_MODEL="meta-llama/Llama-3.1-8B-Instruct" && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python examples/offline_inference_tt.py
```

[🧪 Run Offline Inference](command:tenstorrent.runVllmOffline)

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

Now start vLLM as an HTTP server with OpenAI-compatible endpoints:

```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export HF_MODEL="meta-llama/Llama-3.1-8B-Instruct" && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python -m vllm.entrypoints.openai.api_server \
    --model $HF_MODEL \
    --host 0.0.0.0 \
    --port 8000
```

[🚀 Start vLLM Server](command:tenstorrent.startVllmServer)

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

**vLLM server won't start:**
```bash
# Check environment
source ~/tt-vllm-venv/bin/activate
source ~/tt-vllm/tt_metal/setup-metal.sh

# Verify model path
echo $HF_MODEL
```

**Import errors:**
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
