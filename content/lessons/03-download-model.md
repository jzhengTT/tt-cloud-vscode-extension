# Download Model from Hugging Face

Download the Llama-3.1-8B-Instruct model from Hugging Face to run AI workloads on your Tenstorrent hardware.

## Prerequisites

You'll need a **Hugging Face access token** to download models. If you don't have one:

1. Go to [huggingface.co](https://huggingface.co)
2. Sign up or log in
3. Navigate to Settings → Access Tokens
4. Create a new token with read permissions

## Step 1: Set Your Token

First, you'll need to set your Hugging Face token as an environment variable. This command will be executed with your token:

```bash
export HF_TOKEN="your-token-here"
```

When you click the button below, you'll be prompted to enter your token securely:

[🔑 Enter Your Hugging Face Token](command:tenstorrent.setHuggingFaceToken)

## Step 2: Authenticate

Once your token is set, authenticate with Hugging Face using this command:

```bash
huggingface-cli login --token "$HF_TOKEN"
```

[✓ Authenticate with Hugging Face](command:tenstorrent.loginHuggingFace)

## Step 3: Download the Model

Download the Llama-3.1-8B-Instruct model to `~/models/Llama-3.1-8B-Instruct`:

```bash
mkdir -p ~/models && hf download meta-llama/Llama-3.1-8B-Instruct \
  --local-dir ~/models/Llama-3.1-8B-Instruct
```

[⬇️ Download Llama 3.1-8B Model](command:tenstorrent.downloadModel)

## What Gets Downloaded

The model includes:
- **HuggingFace format files** - `config.json`, `model.safetensors`, etc. (for vLLM)
- **Meta original format files** - `params.json`, `consolidated.00.pth`, `tokenizer.model` (in `original/` subdirectory, for Direct API)
- **Tokenizer files** - Compatible with both formats
- **Full model weights** - ~16GB total

**Note:** This downloads the complete model with all formats. The download is approximately 16GB and may take several minutes depending on your internet connection.

**Why both formats?**
- Direct API (Lessons 4-5) uses Meta's native format in `original/` subdirectory
- vLLM (Lessons 6-7) uses HuggingFace format in the root directory

## Step 4: Get TT-Metal Repository

To run inference with the downloaded model, you'll need the TT-Metal repository. Many cloud images have this pre-installed at `~/tt-metal`.

This will clone the repository (if needed):

```bash
git clone https://github.com/tenstorrent/tt-metal.git "/path/you/choose" --recurse-submodules
```

[📦 Setup TT-Metal Repository](command:tenstorrent.cloneTTMetal)

**What this does:**
- Checks if `~/tt-metal` already exists on your system
- If found, offers to use the existing installation
- If not found, asks where you'd like to clone it (defaults to `~/tt-metal`)
- Clones the repository from GitHub with all submodules

The TT-Metal repository contains the inference demo scripts and all necessary tools to run Llama models on Tenstorrent hardware.

## Step 5: Setup Python Environment

Before running inference, set up the Python environment with all required dependencies.

This command will execute (using your tt-metal location):

```bash
cd "/path/to/tt-metal" && \
  export PYTHONPATH=$(pwd) && \
  pip install -r tt_metal/python_env/requirements-dev.txt
```

[🐍 Install Python Dependencies](command:tenstorrent.setupEnvironment)

**What this does:**
- Sets the `PYTHONPATH` to the tt-metal directory
- Installs Python dependencies from `requirements-dev.txt`
- Prepares the environment for running model demos

This step ensures all Python packages needed for inference are installed and configured correctly.

## Step 6: Run Llama Inference Demo

Now for the exciting part - run actual inference with Llama 3.1-8B on your Tenstorrent hardware!

This command will execute:

```bash
cd "/path/to/tt-metal" && \
  export LLAMA_DIR="~/models/Llama-3.1-8B-Instruct/original" && \
  export PYTHONPATH=$(pwd) && \
  pytest models/tt_transformers/demo/simple_text_demo.py \
    -k performance-batch-1 \
    --max_seq_len 1024 \
    --max_generated_tokens 128
```

[🚀 Run Inference Now!](command:tenstorrent.runInference)

**What this does:**
- Runs the `simple_text_demo.py` script using pytest
- Generates text using the Llama 3.1-8B model
- Demonstrates performance on Tenstorrent hardware

**Expected Output:**
You'll see:
- Model loading and initialization messages
- Generated text output from the model
- Performance metrics (tokens per second)
- Inference completion confirmation

**Note:** The first run may take a few minutes as the model loads and compiles kernels for your Tenstorrent device. Subsequent runs will be faster due to caching.

## Congratulations!

You've successfully:
✅ Detected your Tenstorrent hardware
✅ Verified your tt-metal installation
✅ Downloaded a production-ready LLM
✅ **Run inference on Tenstorrent hardware!**

You're now ready to explore more advanced use cases, optimize performance, and integrate Tenstorrent into your AI workflows.

## Learn More

- [Llama 3.1 model on Hugging Face](https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct)
- [TT-Metal GitHub Repository](https://github.com/tenstorrent/tt-metal)
- [TT-NN Documentation](https://docs.tenstorrent.com/tt-metal/latest/ttnn/)
- [Model Performance Guide](https://github.com/tenstorrent/tt-metal/blob/main/models/tt_transformers/PERF.md)
