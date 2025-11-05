#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Custom vLLM server starter for local models
# This script registers TT models and starts the vLLM server with local model files

import runpy
import sys
import os

# Add tt-vllm to path so we can import from examples
sys.path.insert(0, os.path.expanduser('~/tt-vllm'))

from examples.offline_inference_tt import register_tt_models

if __name__ == '__main__':
    # Register TT models with vLLM
    register_tt_models()

    # Start the vLLM API server with provided arguments
    # All command-line arguments will be passed through
    runpy.run_module("vllm.entrypoints.openai.api_server", run_name="__main__")
