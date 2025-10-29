# Download Model from Hugging Face

Download the Llama-3.1-8B-Instruct model from Hugging Face to run AI workloads on your Tenstorrent hardware.

## Prerequisites

You'll need a **Hugging Face access token** to download models. If you don't have one:

1. Go to [huggingface.co](https://huggingface.co)
2. Sign up or log in
3. Navigate to Settings → Access Tokens
4. Create a new token with read permissions

## Step 1: Set Your Token

First, you'll need to set your Hugging Face token as an environment variable. When you click the button below, you'll be prompted to enter your token:

[Set HF Token](command:tenstorrent.setHuggingFaceToken)

## Step 2: Authenticate

Once your token is set, authenticate with Hugging Face:

[Login to Hugging Face](command:tenstorrent.loginHuggingFace)

## Step 3: Download the Model

Finally, download the Llama-3.1-8B-Instruct model:

[Download Model](command:tenstorrent.downloadModel)

This will download the model files to your local directory: `meta-llama/Llama-3.1-8B-Instruct`

## What Gets Downloaded

The model includes:
- Model weights and configuration
- Tokenizer files
- Original model files from Meta

**Note:** This download is approximately 16GB and may take several minutes depending on your internet connection.

## Learn More

Learn more about the [Llama 3.1 model on Hugging Face](https://huggingface.co/meta-llama/Llama-3.2-1B).
