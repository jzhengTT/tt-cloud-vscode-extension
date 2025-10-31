# HTTP API Server with curl

Transform your interactive chat into an HTTP API that can be queried from anywhere - perfect for building applications on top of your Tenstorrent-powered model.

## What Changed?

- **Lesson 4:** Interactive terminal chat (stdin/stdout)
- **Lesson 5:** HTTP API server (REST endpoints + curl)

This lesson bridges the gap between command-line interaction and production-ready API integration.

## Why an HTTP API?

An HTTP server allows you to:
- Query the model from any programming language
- Build web applications that use your model
- Create microservices architectures
- Test API patterns with curl (no code required)
- Prepare for production deployment patterns

**Note:** This is still minimal - we're using Flask with a simple endpoint, no Docker required!

## How It Works

The API server:
1. Loads the Llama model once on startup
2. Listens on a local port (default: 8080)
3. Accepts POST requests with JSON payloads
4. Runs inference on tt-metal hardware
5. Returns JSON responses with generated text

## Prerequisites

**Important:** This lesson requires the inference dependencies from Lesson 4. If you haven't installed them yet:

```bash
pip install pi
pip install git+https://github.com/tenstorrent/llama-models.git@tt_metal_tag
```

[📦 Install Inference Dependencies](command:tenstorrent.installInferenceDeps)

## Step 1: Create the API Server Script

First, we'll create a Flask-based HTTP API that wraps the demo from Lesson 3.

This command will create `~/tt-api-server.py`:

```bash
# Creates the API server wrapper script
cp template ~/tt-api-server.py && chmod +x ~/tt-api-server.py
```

[🌐 Create API Server Script](command:tenstorrent.createApiServer)

**What this does:**
- Creates `~/tt-api-server.py` in your home directory
- Sets up Flask with `/health` and `/chat` endpoints
- Wraps the pytest demo in HTTP endpoints
- Makes the script executable

**How it works:**
- Wraps the same `simple_text_demo.py` as Lessons 3 and 4
- Creates temporary JSON files with your custom prompts from POST requests
- Runs `pytest` command with `--input_prompts` for each API request
- Returns demo output as JSON with timing and error handling
- **Now actually uses your prompts from the API!**

## Step 2: Install Flask (if needed)

Flask is a lightweight Python web framework. Install it if you don't have it:

```bash
pip install flask
```

[📦 Install Flask](command:tenstorrent.installFlask)

**What this does:**
- Installs Flask and its dependencies via pip
- Takes just a few seconds
- Only needed once per environment

## Step 3: Start the API Server

Now start the Flask server:

```bash
cd ~/tt-metal && \
  export LLAMA_DIR="~/models/Llama-3.1-8B-Instruct/original" && \
  export PYTHONPATH=$(pwd) && \
  python3 ~/tt-api-server.py --port 8080
```

[🚀 Start API Server](command:tenstorrent.startApiServer)

**What this does:**
- Starts Flask server on port 8080
- Validates environment setup
- Listens for incoming POST requests
- Runs the pytest demo for each request
- Logs all activity to the terminal

**Expected output:**
```
🌐 Llama API Server on Tenstorrent Hardware
==================================================
✓ LLAMA_DIR: ~/models/Llama-3.1-8B-Instruct/original
✓ PYTHONPATH: ~/tt-metal
✓ Demo script: models/tt_transformers/demo/simple_text_demo.py

🚀 Starting server on http://127.0.0.1:8080

Available endpoints:
  • GET  http://127.0.0.1:8080/health
  • POST http://127.0.0.1:8080/chat

Note: Send custom prompts via POST /chat endpoint.
      Each request reloads the model (demo limitation).
      First request will take several minutes for kernel compilation.

Press CTRL+C to stop the server

 * Running on http://127.0.0.1:8080
```

## Step 4: Test with curl

Now open a **second terminal** and test the API!

### Health Check

First, verify the server is running:

```bash
curl http://localhost:8080/health
```

You should see:
```json
{
  "status": "healthy",
  "note": "Server is running. Send POST /chat with custom prompts.",
  "llama_dir": "~/models/Llama-3.1-8B-Instruct/original"
}
```

### Basic Inference Query

Now test inference (this will take a few minutes on first run):

```bash
curl -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is machine learning?"}'
```

[💬 Test: Run Inference via API](command:tenstorrent.testApiBasic)

**Response:**
```json
{
  "success": true,
  "prompt": "What is machine learning?",
  "output": "[Full pytest output including your custom prompt and generated response]",
  "time_seconds": 45.2
}
```

**Note:** Your prompt is actually used! The server creates a temporary JSON file and passes it to the demo via `--input_prompts`.

### Multiple Queries

Try different prompts to see the model in action:

```bash
# Ask about Tenstorrent
curl -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Tell me about Tenstorrent hardware"}'

# Creative writing
curl -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a haiku about AI"}'

# Technical explanation
curl -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain how transformers work"}'
```

[🔄 Test: Multiple Queries](command:tenstorrent.testApiMultiple)

### Custom Parameters

Control generation with optional parameters:

```bash
curl -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a short story",
    "max_tokens": 256,
    "temperature": 0.8
  }'
```

## API Reference

### POST /chat

Generates text based on the provided prompt.

**Request Body (JSON):**
```json
{
  "prompt": "Your prompt here",
  "max_tokens": 128,        // Optional, default: 128
  "temperature": 0.7,       // Optional, default: 0.7
  "top_p": 0.9             // Optional, default: 0.9
}
```

**Response (JSON):**
```json
{
  "prompt": "Your prompt here",
  "response": "Generated text response...",
  "tokens_generated": 45,
  "time_seconds": 1.2,
  "tokens_per_second": 37.5
}
```

**Error Response:**
```json
{
  "error": "Error message here"
}
```

### GET /health

Health check endpoint.

**Response (JSON):**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

## Example: Using from Python

You can also query the API from Python scripts:

```python
import requests

response = requests.post(
    "http://localhost:8080/chat",
    json={"prompt": "What is machine learning?"}
)

data = response.json()
print(data["response"])
```

## Example: Using from JavaScript

Or from a web application:

```javascript
fetch('http://localhost:8080/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'What is machine learning?' })
})
.then(res => res.json())
.then(data => console.log(data.response));
```

## Performance Notes

- **First request:** May be slower as kernels compile (one-time cost)
- **Subsequent requests:** Fast inference with compiled kernels
- **Concurrent requests:** Server handles one request at a time (single-threaded)
- **Token speed:** ~30-40 tokens/second (varies by device)

## Tips for Development

1. **Keep server running:** Restart only when needed (model stays loaded)
2. **Watch logs:** Server terminal shows request details and errors
3. **Test incrementally:** Start with simple prompts, add complexity
4. **Use jq for formatting:** Pipe curl output through `jq` for pretty JSON

**Example with jq:**
```bash
curl -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}' | jq
```

## Stopping the Server

To stop the server:
1. Switch to the server terminal
2. Press `Ctrl+C`

The model will unload and the server will shut down gracefully.

## Troubleshooting

**Port already in use:**
- Change the port: `python3 ~/tt-api-server.py --port 8081`
- Kill existing process: `lsof -ti:8080 | xargs kill`

**Connection refused:**
- Check that server is running (look for "Running on..." message)
- Verify correct port in curl command
- Try `http://127.0.0.1:8080` instead of `localhost`

**Slow responses:**
- First request always takes longer (kernel compilation)
- Check server logs for performance metrics
- Reduce `max_tokens` for faster responses

**Import errors:**
- Ensure Flask is installed: `pip install flask`
- Check PYTHONPATH is set to tt-metal directory
- Verify model path in LLAMA_DIR

## How This Works

**Architecture:**
- Flask HTTP server wrapping the pytest demo
- `/health` endpoint for status checks
- `/chat` endpoint accepts custom prompts via POST
- Creates temporary JSON files with user prompts
- Runs `pytest` with `--input_prompts` flag
- Captures demo output and returns as JSON
- Single-threaded to avoid concurrent model loading

**Key Innovation:**
- ✅ **Accepts your actual prompts via HTTP!**
- ✅ Uses the demo's JSON input format dynamically
- ✅ No modification to tt-metal code needed
- ✅ REST API with real custom input

**Limitations:**
- Runs full demo for each request (reloads model)
- First request takes longest (kernel compilation)
- Slower than keeping model loaded in memory
- Shows full pytest output (verbose but complete)

**Why this approach?**
- ✅ Works immediately with installed tt-metal
- ✅ Uses the proven demo code
- ✅ Provides actual HTTP API with custom prompts
- ✅ Good for learning HTTP/REST patterns
- ✅ Foundation for building applications

**For production:** You'd want to load the model once and keep it in memory using the Generator API directly, then handle multiple requests without reloading.

## What You Can Build

Now you have a REST API foundation for:
- Building web UIs (React, Vue, etc.)
- Creating mobile app backends
- Integrating with existing applications
- Deploying to production (with proper scaling)

## Learn More

- [Flask Documentation](https://flask.palletsprojects.com/)
- [REST API Best Practices](https://restfulapi.net/)
- [TT-Metal Deployment Guide](https://docs.tenstorrent.com/)
