# Image Generation with Stable Diffusion 3.5 Large

Generate images on your Tenstorrent hardware using Stable Diffusion 3.5 Large - turn text prompts into high-resolution images powered by your N150!

## What is Stable Diffusion?

**Stable Diffusion 3.5 Large** is a state-of-the-art text-to-image diffusion model that generates high-quality 1024x1024 images from text descriptions. This version uses a Multimodal Diffusion Transformer (MMDiT) architecture.

**Why Image Generation on Tenstorrent?**
- 🎨 **Native TT Acceleration** - Runs directly on Tenstorrent hardware using tt-metal
- 🔒 **Privacy** - Your prompts and images stay private
- ⚡ **High Resolution** - Generate 1024x1024 images (vs 512x512 in older models)
- 🎓 **Production Ready** - Real hardware acceleration, not CPU fallback

## Journey So Far

- **Lesson 3:** Text generation with Llama
- **Lesson 4-5:** Chat and API servers
- **Lesson 6-7:** Production deployment with vLLM
- **Lesson 8:** Image generation ← **You are here**

## Architecture

Stable Diffusion 3.5 uses a Multimodal Diffusion Transformer (MMDiT):

```
┌──────────────────────────────────────┐
│     Text Prompt                      │
│  "If Tenstorrent were a company      │
│   in the 1960s and 1970s"            │
└─────────────┬────────────────────────┘
              │
              ▼
     ┌────────────────────────────┐
     │ 3 Text Encoders:           │
     │ • CLIP-L (OpenAI)          │ ← Encode text to embeddings
     │ • CLIP-G (OpenCLIP)        │
     │ • T5-XXL (Google)          │
     └────────┬───────────────────┘
              │
              ▼
     ┌────────────────────────────┐
     │ MMDiT Transformer          │ ← Generate latent representation
     │ (38 blocks)                │    (28 denoising steps)
     │ Running on TT Hardware     │
     └────────┬───────────────────┘
              │
              ▼
     ┌────────────────┐
     │ VAE Decoder    │ ← Convert latents to 1024x1024 pixels
     └────────┬───────┘
              │
              ▼
     ┌────────────────┐
     │ Generated      │
     │ Image (PNG)    │
     └────────────────┘
```

## Prerequisites

- tt-metal installed and working (completed Lesson 2)
- Hugging Face account with access to SD 3.5 Large
- N150 hardware
- ~10-15 GB disk space for model weights

## Model: Stable Diffusion 3.5 Large

We'll use **Stable Diffusion 3.5 Large** which runs natively on Tenstorrent hardware using tt-metal.

**Model Details:**
- **Size:** ~10 GB
- **Resolution:** 1024x1024 images (high quality!)
- **Speed:** ~12-15 seconds per image on N150
- **Architecture:** MMDiT (Multimodal Diffusion Transformer)
- **Inference Steps:** 28 (optimized for quality/speed)
- **Hardware:** Runs on TT-NN operators (native acceleration)

## Step 1: Grant Model Access

Stable Diffusion 3.5 Large requires access from Hugging Face:

1. Visit [stabilityai/stable-diffusion-3.5-large](https://huggingface.co/stabilityai/stable-diffusion-3.5-large)
2. Click "Agree and access repository"
3. Login with your Hugging Face account

## Step 2: Authenticate with Hugging Face

Login to download the model (uses token from Lesson 3):

```bash
huggingface-cli login
```

[🔐 Login to Hugging Face](command:tenstorrent.loginHuggingFace)

The model will be automatically downloaded the first time you run it.

## Step 3: Set Environment for N150

Set the mesh device environment variable:

```bash
export MESH_DEVICE=N150
```

**What this does:**
- Tells tt-metal to configure for single-chip N150
- Optimizes model parallelization for 1x1 mesh
- Enables VAE CPU fallback for memory efficiency

## Step 4: Generate Your First Image

Run the Stable Diffusion 3.5 demo with a sample prompt:

```bash
cd ~/tt-metal
export MESH_DEVICE=N150

# Run with default prompt
pytest models/experimental/stable_diffusion_35_large/demo.py
```

[🎨 Generate Sample Image](command:tenstorrent.generateRetroImage)

**What you'll see:**

```
Loading Stable Diffusion 3.5 Large from stabilityai...
Initializing MMDiT transformer on N150 (1x1 mesh)...
✓ Model loaded on TT hardware

Generating 1024x1024 image (28 inference steps)...
Step 1/28... 2/28... 5/28... 10/28... 15/28... 20/28... 25/28... 28/28
Decoding with VAE...

✓ Image saved to: sd35_1024_1024.png
Generation time: 12.2 seconds
```

The generated image will be saved as `sd35_1024_1024.png` in your current directory.

## Step 5: Interactive Mode - Try Your Own Prompts

Run in interactive mode to generate multiple images with custom prompts:

```bash
cd ~/tt-metal
export MESH_DEVICE=N150

# Run interactive mode
pytest models/experimental/stable_diffusion_35_large/demo.py
```

[🖼️ Start Interactive Image Generation](command:tenstorrent.startInteractiveImageGen)

**When prompted, enter your custom text:**

```
Enter the input prompt, or q to exit: If Tenstorrent were a company in the 1960s and 1970s, retro corporate office, vintage computers, orange and brown color scheme
```

The model will generate a new image for each prompt. Type `q` to exit.

**Example prompts to try:**

1. **Retro Tech:**
   ```
   "1970s computer lab with orange and brown terminals, vintage aesthetic"
   ```

2. **Futuristic Office:**
   ```
   "Modern tech company office with AI hardware, orange accent lighting, sleek design"
   ```

3. **Abstract Tech:**
   ```
   "Abstract visualization of AI neural network, orange and blue colors, digital art"
   ```

4. **Historical Computing:**
   ```
   "1960s mainframe computer room, scientists in white coats, vintage photograph"
   ```

5. **Product Design:**
   ```
   "Futuristic AI accelerator card, orange accents, product photography, studio lighting"
   ```

## Understanding the Generation Process

### **Diffusion Process in SD 3.5:**

1. **Text Encoding** - Three encoders (CLIP-L, CLIP-G, T5-XXL) process your prompt
2. **Start with noise** - Begin with random latent representation
3. **Denoise iteratively** - MMDiT transformer removes noise in 28 steps
4. **Each step runs on TT hardware** - Native acceleration on N150
5. **VAE Decoding** - Convert latents to 1024x1024 pixel image

### **Key Parameters:**

**num_inference_steps (28)**
- Optimized for SD 3.5 Large
- Balances quality and speed
- Fixed in the demo (can't be changed without model retraining)

**guidance_scale (3.5)**
- How closely to follow your prompt
- 3.5: Optimized default for SD 3.5
- Lower than SD 1.x because of improved architecture

**image_w, image_h (1024x1024)**
- High resolution output
- Can be adjusted but 1024x1024 is optimal for SD 3.5

**seed (0)**
- Random seed for reproducibility
- Same seed + same prompt = same image
- Useful for iterating on prompts

## Prompt Engineering Tips

**Good prompts include:**
1. **Subject** - What you want to see
2. **Style** - Art style, photography type
3. **Colors** - Color scheme
4. **Lighting** - Lighting conditions
5. **Details** - Specific details to include

**Example:**
```
"Vintage 1970s office, orange and brown color scheme, retro computers,
warm lighting, film photograph, detailed, high quality"
```

**Keywords that work well:**
- Art styles: `photorealistic`, `digital art`, `oil painting`, `sketch`
- Quality: `detailed`, `high quality`, `8k`, `professional`
- Lighting: `studio lighting`, `natural light`, `dramatic lighting`
- Camera: `35mm photograph`, `wide angle`, `close-up`

## Performance Optimization

**For faster generation on N150:**

1. **Reduce steps:**
   ```bash
   --steps 30  # Instead of 50
   ```

2. **Lower resolution:**
   ```bash
   --width 256 --height 256  # Instead of 512x512
   ```

3. **Use attention slicing:**
   The script automatically enables this for N150 to reduce memory usage

## Comparing Generation Speed

| Hardware | Steps | Time | Notes |
|----------|-------|------|-------|
| CPU Only | 50 | ~5-10 min | Very slow |
| **N150** | 50 | ~15-30 sec | Accelerated |
| N300 | 50 | ~10-20 sec | Faster (2 chips) |
| High-end GPU | 50 | ~5-10 sec | Comparison |

## Troubleshooting

**Out of memory:**
```bash
# Reduce resolution
--width 256 --height 256

# Enable more aggressive optimizations
--low-memory
```

**Model download fails:**
```bash
# Check Hugging Face authentication
huggingface-cli whoami

# Re-download specific files
huggingface-cli download CompVis/stable-diffusion-v1-4 --local-dir ~/models/stable-diffusion-v1-4
```

**Slow generation:**
- Verify tt-metal is properly installed (Lesson 2)
- Check device is detected: `tt-smi`
- First generation is slower (model loading), subsequent ones are faster

**Black images:**
- Some prompts trigger safety filters
- Try different wording
- Avoid sensitive content

## What You Learned

✅ How to set up Stable Diffusion on Tenstorrent hardware
✅ Text-to-image generation with custom prompts
✅ Understanding diffusion model parameters
✅ Prompt engineering for better results
✅ Batch generation and optimization

**Key takeaway:** You can generate high-quality images locally on your Tenstorrent hardware, with full control over the generation process and complete privacy.

## Next Steps

**Experiment with:**
1. **Different prompts** - Try various subjects and styles
2. **Parameter tuning** - Adjust steps, guidance_scale, and seed
3. **Batch generation** - Create variations of successful prompts
4. **Image-to-image** - Use generated images as starting points (advanced)

**Advanced topics:**
- Fine-tuning Stable Diffusion on custom images
- Inpainting (editing parts of images)
- ControlNet for precise control
- Integrating with web interfaces

## Resources

- **Stable Diffusion:** [stability.ai](https://stability.ai/)
- **Hugging Face Diffusers:** [huggingface.co/docs/diffusers](https://huggingface.co/docs/diffusers)
- **Prompt Engineering Guide:** [prompthero.com](https://prompthero.com/)
- **TT-Metal Docs:** [docs.tenstorrent.com](https://docs.tenstorrent.com/)

**Happy generating! 🎨**
