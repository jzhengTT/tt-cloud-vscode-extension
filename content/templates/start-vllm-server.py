#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Production-ready vLLM server starter for Tenstorrent hardware
#
# This script registers TT-specific models with vLLM and starts the OpenAI-compatible API server.
# NO dependencies on examples/ directory - this is production code!

import runpy
import sys
import os

def register_tt_models():
    """
    Register Tenstorrent model implementations with vLLM's ModelRegistry.

    This allows vLLM to find TTLlamaForCausalLM and other TT model classes
    in the tt-metal repository without falling back to HuggingFace Transformers.

    Models are imported from: TT_METAL_HOME/models/tt_transformers/tt/generator_vllm.py

    Why this is needed:
    - vLLM doesn't automatically discover custom model implementations
    - TT models use specialized kernels and operators from tt-metal
    - Must register before vLLM tries to load any models
    """
    from vllm import ModelRegistry

    # Register Llama models for Tenstorrent hardware
    # Format: ModelRegistry.register_model(
    #     model_name: str,           # Name used in config.json
    #     module_path: str           # Python path to model class
    # )

    ModelRegistry.register_model(
        "TTLlamaForCausalLM",
        "models.tt_transformers.tt.generator_vllm:LlamaForCausalLM"
    )

    # Add more TT models here as they become available:
    # ModelRegistry.register_model("TTMixtralForCausalLM", "...")
    # ModelRegistry.register_model("TTQwenForCausalLM", "...")

    print("✓ Registered Tenstorrent models with vLLM")


if __name__ == '__main__':
    # Register TT models with vLLM
    # This must happen before vLLM loads any models
    register_tt_models()

    # Start the vLLM API server
    # All command-line arguments are passed through unchanged
    # Example: --model ~/models/Llama-3.1-8B-Instruct --port 8000 --max-model-len 65536
    runpy.run_module("vllm.entrypoints.openai.api_server", run_name="__main__")
