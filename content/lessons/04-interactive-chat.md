# Interactive Chat with Llama

Move from one-shot testing to real conversations with your model running on Tenstorrent hardware.

## What Changed?

- **Lesson 3:** Ran a test with fixed prompts using pytest (one-shot execution)
- **Lesson 4:** Chat interactively with your model using a simple terminal interface

## How It Works

The interactive chat script:
1. Loads the Llama model once (same as Lesson 3)
2. Enters a read-eval-print loop (REPL)
3. Accepts your prompts via stdin
4. Generates responses on tt-metal hardware
5. Streams output back to you in the terminal
6. Repeats until you type `exit`

This is the most minimal way to have a conversation with your model - no Docker, no HTTP servers, just pure stdin/stdout interaction.

## Step 1: Install Additional Dependencies

Before running interactive inference, we need to install a few additional Python packages that weren't included in the basic tt-metal setup.

These commands will install:
- `pi` - Required Python package for inference
- `llama-models` - Official Llama model utilities from Tenstorrent's fork

```bash
pip install pi
pip install git+https://github.com/tenstorrent/llama-models.git@tt_metal_tag
```

[📦 Install Inference Dependencies](command:tenstorrent.installInferenceDeps)

**What this does:**
- Installs the `pi` package
- Installs the Llama model utilities from Tenstorrent's GitHub
- Uses the `tt_metal_tag` branch for tt-metal compatibility
- Takes 1-2 minutes depending on your connection

**Note:** These dependencies are needed for both interactive chat (Lesson 4) and the API server (Lesson 5).

## Step 2: Create the Chat Script

First, we'll create a simple Python wrapper that runs the demo interactively.

This command will create `~/tt-chat.py`:

```bash
# Creates the chat wrapper script
cp template ~/tt-chat.py && chmod +x ~/tt-chat.py
```

[📝 Create Interactive Chat Script](command:tenstorrent.createChatScript)

**What this does:**
- Creates `~/tt-chat.py` in your home directory
- Sets up a REPL that runs the pytest demo
- Checks environment variables automatically
- Makes the script executable

**How it works:**
- Wraps the existing `simple_text_demo.py` from Lesson 3
- Creates temporary JSON files with your custom prompts
- Runs `pytest` command with the `--input_prompts` flag
- Reloads the model each time (first run takes longest)
- **Now accepts your actual prompts!**

## Step 3: Start Interactive Chat

Now launch the interactive session:

```bash
cd ~/tt-metal && \
  export LLAMA_DIR="~/models/Llama-3.1-8B-Instruct/original" && \
  export PYTHONPATH=$(pwd) && \
  python3 ~/tt-chat.py
```

[💬 Start Chat Session](command:tenstorrent.startChatSession)

**What you'll see:**
```
🤖 Llama Chat on Tenstorrent Hardware
==================================================

✅ Environment configured correctly

Note: Each query reloads the model (demo limitation).
      The first run will take several minutes to compile kernels.
      Subsequent runs are faster due to caching.

Commands:
  • Type your prompt and press ENTER
  • Type 'exit' or 'quit' to end
  • Press Ctrl+C to interrupt

>
```

**Usage:**
- Type **your custom prompt** and press ENTER
- Type **exit** to quit
- First run compiles kernels (takes 2-5 minutes)
- Subsequent runs are faster but still reload the model
- **Now you can ask your own questions!**

## Step 4: Try Your Own Prompts

Now you can type your own questions and see the model respond!

**Example interaction:**
```
> What is machine learning?

🤖 Generating response...

[You'll see the full pytest output, including:]
==USER 0 - OUTPUT
Machine learning is a subset of artificial intelligence that enables
computers to learn from data without being explicitly programmed...

--------------------------------------------------
Ready for next prompt (or 'exit' to quit)

> Tell me about Tenstorrent

🤖 Generating response...

[You'll see the response about Tenstorrent hardware...]

--------------------------------------------------
Ready for next prompt (or 'exit' to quit)

> exit

👋 Chat session ended
```

**What happens:**
- Your prompt is written to a temporary JSON file
- The demo runs with your custom prompt via `--input_prompts`
- Model generates a response on Tenstorrent hardware
- You'll see performance metrics (tokens/second)
- Ready for your next question!

## Performance Notes

- **First load:** Takes 2-5 minutes to compile kernels (one-time cost)
- **Subsequent queries:** Fast inference using compiled kernels
- **Token generation speed:** ~30-40 tokens/second (varies by device)
- **Model stays loaded:** No reload between prompts (much faster than pytest)

## Tips for Best Results

1. **Start simple:** Try short, clear prompts first
2. **Be patient:** First load always takes time
3. **Watch metrics:** Token/sec shows your hardware performance
4. **Keep it running:** Leaving the session open avoids reload time

## Troubleshooting

**Model takes too long to load:**
- This is normal on first run (kernel compilation)
- Subsequent runs will be much faster due to caching

**Script exits immediately:**
- Check that LLAMA_DIR points to the correct path
- Verify Python dependencies are installed (Lesson 3, Step 5)

**Import errors:**
- Ensure inference dependencies are installed (Step 1)
- Check that PYTHONPATH is set to your tt-metal directory
- Run from the tt-metal directory root

## How This Works

**Architecture:**
- Wraps the existing `models/tt_transformers/demo/simple_text_demo.py`
- Creates temporary JSON files with your custom prompts
- Passes the JSON to pytest via `--input_prompts` flag
- Uses `subprocess` to execute the demo
- Simple REPL loop for interactive use

**Key Innovation:**
- ✅ **Accepts your actual prompts!**
- ✅ Uses the demo's JSON input format dynamically
- ✅ No modification to tt-metal code needed
- ✅ Works with the existing proven demo

**Limitations:**
- Reloads the model each time (slower than keeping it loaded)
- First run takes longest (kernel compilation)
- Shows full pytest output (verbose but informative)

**Why this approach?**
- ✅ Works immediately with installed tt-metal
- ✅ Uses the known-working demo code
- ✅ Provides actual custom prompt interaction
- ✅ Good foundation for understanding inference

**For production:** You'd want to load the model once and keep it in memory between queries using the Generator API directly.

## What's Next?

Now you have an interactive way to run inference!

In the next lesson, we'll wrap the same demo in an HTTP API so you can query it with `curl` or from other applications.

## Learn More

- [TT-Metal Inference Examples](https://github.com/tenstorrent/tt-metal/tree/main/models/tt_transformers)
- [Llama Model Documentation](https://github.com/tenstorrent/tt-metal/blob/main/models/tt_transformers/README.md)
