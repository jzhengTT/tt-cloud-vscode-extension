# Interactive Chat with Direct API

Move from one-shot testing to building your own chat application using tt-metal's Generator API directly.

## What Changed?

- **Lesson 3:** Ran inference via pytest test (model reloads each time)
- **Lesson 4:** Use the Generator API directly (model stays in memory - **much faster!**)

## Why Use the Direct API?

**The pytest wrapper approach (old Lessons 4 & 5):**
- ❌ Reloads model for each query (2-5 minutes each time)
- ❌ Black box - hard to customize
- ❌ Not how real applications work

**The direct Generator API (this lesson):**
- ✅ **Load model once** - subsequent queries are fast (1-3 seconds)
- ✅ **Full control** - customize sampling, temperature, max tokens
- ✅ **Production-ready pattern** - this is how you'd build real apps
- ✅ **Educational** - understand how inference actually works

## How It Works

The Generator API pattern:

```python
# 1. Load model once (slow - 2-5 minutes)
from models.tt_transformers.tt.generator import Generator
from models.tt_transformers.tt.common import create_tt_model

model_args, model, tt_kv_cache, _ = create_tt_model(mesh_device, ...)
generator = Generator([model], [model_args], mesh_device, ...)

# 2. Chat loop - reuse the loaded model! (fast - 1-3 seconds per response)
while True:
    prompt = input("> ")

    # Preprocess
    tokens, encoded, pos, lens = preprocess_inputs_prefill([prompt], ...)

    # Prefill (process the prompt)
    logits = generator.prefill_forward_text(tokens, ...)

    # Decode (generate response token by token)
    for _ in range(max_tokens):
        logits = generator.decode_forward_text(...)
        next_token = sample(logits)
        if is_end_token(next_token):
            break

    response = tokenizer.decode(all_tokens)
    print(response)
```

**Key insight:** The model stays in memory between queries!

## Prerequisites

This lesson requires the same setup as Lesson 3. Make sure you have:
- tt-metal installed and working
- Model downloaded (Llama-3.1-8B-Instruct)
- `HF_MODEL` environment variable set

## Step 1: Create the Direct API Chat Script

This command creates `~/tt-chat-direct.py` - a standalone chat client using the Generator API:

```bash
# Creates the direct API chat script
cp template ~/tt-chat-direct.py && chmod +x ~/tt-chat-direct.py
```

[📝 Create Direct API Chat Script](command:tenstorrent.createChatScriptDirect)

**What this does:**
- Creates `~/tt-chat-direct.py` with full Generator API implementation
- **Opens the file in your editor** so you can see how it works!
- Makes it executable

**What's inside:**
- `prepare_generator()` - Loads model once at startup
- `generate_response()` - Fast inference using loaded model
- `chat_loop()` - Interactive REPL for chatting
- Full control over sampling, temperature, max tokens

## Step 2: Start Interactive Chat

Now launch the chat session:

```bash
cd ~/tt-metal && \
  export HF_MODEL="meta-llama/Llama-3.1-8B-Instruct" && \
  export PYTHONPATH=$(pwd) && \
  python3 ~/tt-chat-direct.py
```

[💬 Start Direct API Chat](command:tenstorrent.startChatSessionDirect)

**What you'll see:**

```
🔄 Importing tt-metal libraries (this may take a moment)...
📥 Loading model (this will take 2-5 minutes on first run)...
✅ Model loaded and ready!

🤖 Direct API Chat with Llama on Tenstorrent
============================================================
This version loads the model once and keeps it in memory.
After initial load, responses will be much faster!

Commands:
  • Type your prompt and press ENTER
  • Type 'exit' or 'quit' to end
  • Press Ctrl+C to interrupt

>
```

**First run:** 2-5 minutes to load (kernel compilation + model loading)
**Subsequent queries:** 1-3 seconds per response!

## Step 3: Chat with Your Model

Try asking questions:

```
> What is machine learning?

🤖 Generating response...

Machine learning is a subset of artificial intelligence (AI) that
involves training algorithms to learn from data and make predictions
or decisions without being explicitly programmed...

------------------------------------------------------------

> Explain transformers in simple terms

🤖 Generating response...

Transformers are a type of neural network architecture that's really
good at understanding relationships in sequential data like text...

------------------------------------------------------------

> exit

👋 Chat session ended
```

**Notice:**
- First query after load: ~1-3 seconds
- Second query: ~1-3 seconds (model already loaded!)
- No 2-5 minute reload between queries

## Understanding the Code

**Open `~/tt-chat-direct.py` in your editor** (it was opened automatically when you created it). Key sections:

### Model Loading (Lines ~80-120)

```python
def prepare_generator(mesh_device, max_batch_size=1, ...):
    # Create the model with optimizations
    model_args, model, tt_kv_cache, _ = create_tt_model(
        mesh_device,
        instruct=True,
        max_batch_size=max_batch_size,
        optimizations=DecodersPrecision.performance,
        paged_attention_config=PagedAttentionConfig(...),
    )

    # Create the generator
    generator = Generator([model], [model_args], mesh_device, ...)

    return generator, model_args, model, ...
```

**This happens once at startup!**

### Inference (Lines ~125-180)

```python
def generate_response(generator, prompt, max_tokens=128):
    # 1. Tokenize and preprocess
    tokens, encoded, pos, lens = preprocess_inputs_prefill([prompt], ...)

    # 2. Prefill - process the prompt
    logits = generator.prefill_forward_text(tokens, ...)

    # 3. Decode - generate tokens one by one
    for iteration in range(max_tokens):
        logits = generator.decode_forward_text(out_tok, current_pos, ...)
        next_token = sample(logits)
        if next_token is end_token:
            break

    # 4. Decode tokens to text
    response = tokenizer.decode(all_tokens)
    return response
```

**This runs for each query - fast because model is already loaded!**

## Customization Ideas

Now that you have the code, try modifying it:

**1. Change temperature (creativity)**
```python
# In generate_response():
response = generate_response(..., temperature=0.7)  # More creative
# vs
response = generate_response(..., temperature=0.0)  # Deterministic
```

**2. Increase max tokens**
```python
response = generate_response(..., max_generated_tokens=256)
```

**3. Add streaming output**
```python
# Print tokens as they're generated
for iteration in range(max_tokens):
    logits = generator.decode_forward_text(...)
    next_token = sample(logits)
    print(tokenizer.decode([next_token]), end='', flush=True)
```

**4. Multi-turn conversations**
```python
# Keep conversation history
conversation_history = []
while True:
    prompt = input("> ")
    conversation_history.append(f"User: {prompt}")
    full_prompt = "\n".join(conversation_history)
    response = generate_response(generator, full_prompt, ...)
    conversation_history.append(f"Assistant: {response}")
```

## Performance Notes

- **First load:** 2-5 minutes (kernel compilation + model load)
- **Subsequent queries:** 1-3 seconds each
- **Token generation speed:** ~20-40 tokens/second
- **Memory:** Model stays in memory (~8GB for Llama-3.1-8B)

**Why is it so much faster?**
- No pytest overhead
- No model reloading
- Direct GPU/NPU access
- Optimized kernel reuse

## Troubleshooting

**Import errors:**
```bash
export PYTHONPATH=~/tt-metal
```

**MESH_DEVICE errors:**
```bash
# Let tt-metal auto-detect (default behavior)
# Or explicitly set:
export MESH_DEVICE=N150  # or N300, T3K, etc.
```

**Out of memory:**
- Close other programs
- Reduce `max_batch_size` to 1
- Reduce `max_seq_len` to 1024

**Slow first query:**
- This is normal - kernels compile on first run
- Subsequent runs use cached kernels

## What You Learned

✅ How to use the Generator API directly
✅ Model loading vs. inference phases
✅ Prefill (process prompt) vs. decode (generate tokens)
✅ Token sampling and stopping conditions
✅ How to build custom chat applications

**Key takeaway:** Real AI applications load the model once and reuse it. This is the foundation for everything from chat apps to API servers.

## What's Next?

Now that you can chat interactively, let's wrap this in an HTTP API so you can:
- Query from any programming language
- Build web applications
- Test with curl
- Deploy as a microservice

Continue to Lesson 5: HTTP API Server!

## Learn More

- [TT-Metal Generator API](https://github.com/tenstorrent/tt-metal/blob/main/models/tt_transformers/tt/generator.py)
- [Model Configuration](https://github.com/tenstorrent/tt-metal/blob/main/models/tt_transformers/tt/model_config.py)
- [Common Utilities](https://github.com/tenstorrent/tt-metal/blob/main/models/tt_transformers/tt/common.py)
