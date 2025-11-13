/**
 * Terminal Commands Configuration
 *
 * This file is the single source of truth for all terminal commands used in the walkthrough.
 * Commands defined here are:
 * 1. Shown to users in markdown lessons (so they know what will execute)
 * 2. Executed by the extension (ensuring what's shown matches what runs)
 *
 * When updating commands, update them here and they'll automatically sync everywhere.
 */

/**
 * Model configuration type
 */
interface ModelConfig {
  huggingfaceId: string;
  localDirName: string;
  displayName: string;
}

/**
 * Model Registry
 * Must match MODEL_REGISTRY in extension.ts
 */
const MODEL_REGISTRY: Record<string, ModelConfig> = {
  'llama-3.1-8b': {
    huggingfaceId: 'meta-llama/Llama-3.1-8B-Instruct',
    localDirName: 'Llama-3.1-8B-Instruct',
    displayName: 'Llama 3.1 8B Instruct',
  },
  // Future models can be added here as they become compatible with tt-metal
} as const;

/**
 * Default model key
 */
const DEFAULT_MODEL_KEY = 'llama-3.1-8b';

/**
 * Get the default model config
 */
function getDefaultModel(): ModelConfig {
  return MODEL_REGISTRY[DEFAULT_MODEL_KEY];
}

/**
 * Command template that can include variables to be replaced at runtime
 */
export interface CommandTemplate {
  /** Unique identifier for this command */
  id: string;

  /** Display name for the command */
  name: string;

  /** The actual command template (may include {{variables}}) */
  template: string;

  /** Description of what this command does */
  description: string;

  /** Variables that will be replaced in the template */
  variables?: string[];
}

/**
 * All terminal commands used in the walkthrough
 */
export const TERMINAL_COMMANDS: Record<string, CommandTemplate> = {
  // Hardware Detection
  TT_SMI: {
    id: 'tt-smi',
    name: 'Hardware Detection',
    template: 'tt-smi',
    description: 'Scans for connected Tenstorrent devices and displays their status',
  },

  // Verify Installation
  VERIFY_INSTALLATION: {
    id: 'verify-installation',
    name: 'Verify TT-Metal Installation',
    template: 'python3 -m ttnn.examples.usage.run_op_on_device',
    description: 'Runs a test operation to verify tt-metal is working correctly',
  },

  // Hugging Face Authentication
  SET_HF_TOKEN: {
    id: 'set-hf-token',
    name: 'Set Hugging Face Token',
    template: 'export HF_TOKEN="{{token}}"',
    description: 'Sets your Hugging Face access token as an environment variable',
    variables: ['token'],
  },

  LOGIN_HF: {
    id: 'login-hf',
    name: 'Login to Hugging Face',
    template: 'huggingface-cli login --token "$HF_TOKEN"',
    description: 'Authenticates with Hugging Face using your token',
  },

  // Model Download
  DOWNLOAD_MODEL: {
    id: 'download-model',
    name: 'Download Llama Model',
    template: (() => {
      const model = getDefaultModel();
      return `mkdir -p ~/models && hf download ${model.huggingfaceId} --local-dir ~/models/${model.localDirName}`;
    })(),
    description: (() => {
      const model = getDefaultModel();
      return `Creates ~/models directory and downloads ${model.displayName} model (full model with all formats, ~16GB)`;
    })(),
  },

  // Clone TT-Metal
  CLONE_TT_METAL: {
    id: 'clone-tt-metal',
    name: 'Clone TT-Metal Repository',
    template: 'git clone https://github.com/tenstorrent/tt-metal.git "{{path}}" --recurse-submodules',
    description: 'Clones the tt-metal repository with all submodules',
    variables: ['path'],
  },

  // Setup Environment
  SETUP_ENVIRONMENT: {
    id: 'setup-environment',
    name: 'Setup Python Environment',
    template:
      'cd "{{ttMetalPath}}" && export PYTHONPATH=$(pwd) && pip install -r tt_metal/python_env/requirements-dev.txt',
    description: 'Sets PYTHONPATH and installs Python dependencies for tt-metal',
    variables: ['ttMetalPath'],
  },

  // Run Inference
  RUN_INFERENCE: {
    id: 'run-inference',
    name: 'Run Llama Inference',
    template:
      'cd "{{ttMetalPath}}" && export LLAMA_DIR="{{modelPath}}" && export PYTHONPATH=$(pwd) && pytest models/tt_transformers/demo/simple_text_demo.py -k performance-batch-1 --max_seq_len 1024 --max_generated_tokens 128',
    description: 'Runs Llama inference demo with LLAMA_DIR set to the downloaded model',
    variables: ['ttMetalPath', 'modelPath'],
  },

  // Interactive Chat (Lesson 4)
  INSTALL_INFERENCE_DEPS: {
    id: 'install-inference-deps',
    name: 'Install Inference Dependencies',
    template: 'pip install pi && pip install git+https://github.com/tenstorrent/llama-models.git@tt_metal_tag',
    description: 'Installs pi package and llama-models from Tenstorrent GitHub for inference',
  },

  CREATE_CHAT_SCRIPT: {
    id: 'create-chat-script',
    name: 'Create Interactive Chat Script',
    template: 'mkdir -p ~/tt-scratchpad && cp "{{templatePath}}" ~/tt-scratchpad/tt-chat.py && chmod +x ~/tt-scratchpad/tt-chat.py',
    description: 'Copies the chat script template to ~/tt-scratchpad and makes it executable',
    variables: ['templatePath'],
  },

  START_CHAT_SESSION: {
    id: 'start-chat-session',
    name: 'Start Interactive Chat',
    template:
      'cd "{{ttMetalPath}}" && export LLAMA_DIR="{{modelPath}}" && export PYTHONPATH=$(pwd) && python3 ~/tt-scratchpad/tt-chat.py',
    description: 'Starts the interactive chat REPL with the Llama model on tt-metal',
    variables: ['ttMetalPath', 'modelPath'],
  },

  // HTTP API Server (Lesson 5)
  CREATE_API_SERVER: {
    id: 'create-api-server',
    name: 'Create API Server Script',
    template: 'mkdir -p ~/tt-scratchpad && cp "{{templatePath}}" ~/tt-scratchpad/tt-api-server.py && chmod +x ~/tt-scratchpad/tt-api-server.py',
    description: 'Copies the API server script template to ~/tt-scratchpad and makes it executable',
    variables: ['templatePath'],
  },

  INSTALL_FLASK: {
    id: 'install-flask',
    name: 'Install Flask',
    template: 'pip install flask',
    description: 'Installs Flask web framework for the API server',
  },

  START_API_SERVER: {
    id: 'start-api-server',
    name: 'Start API Server',
    template:
      'cd "{{ttMetalPath}}" && export LLAMA_DIR="{{modelPath}}" && export PYTHONPATH=$(pwd) && python3 ~/tt-scratchpad/tt-api-server.py --port 8080',
    description: 'Starts the Flask API server with the Llama model on tt-metal',
    variables: ['ttMetalPath', 'modelPath'],
  },

  TEST_API_BASIC: {
    id: 'test-api-basic',
    name: 'Test API with Basic Query',
    template:
      'curl -X POST http://localhost:8080/chat -H "Content-Type: application/json" -d \'{"prompt": "What is machine learning?"}\'',
    description: 'Tests the API server with a basic curl request',
  },

  TEST_API_MULTIPLE: {
    id: 'test-api-multiple',
    name: 'Test API with Multiple Queries',
    template:
      'echo "Testing Tenstorrent query..." && curl -X POST http://localhost:8080/chat -H "Content-Type: application/json" -d \'{"prompt": "Tell me about Tenstorrent hardware"}\' && echo "\n\nTesting haiku..." && curl -X POST http://localhost:8080/chat -H "Content-Type: application/json" -d \'{"prompt": "Write a haiku about AI"}\'',
    description: 'Tests the API server with multiple sequential curl requests',
  },

  // Image Generation (Lesson 8) - Stable Diffusion 3.5 Large
  GENERATE_RETRO_IMAGE: {
    id: 'generate-retro-image',
    name: 'Generate Sample Image with SD 3.5',
    template:
      'mkdir -p ~/tt-scratchpad && cd ~/tt-scratchpad && export PYTHONPATH="{{ttMetalPath}}":$PYTHONPATH && export MESH_DEVICE=N150 && export NO_PROMPT=1 && pytest "{{ttMetalPath}}"/models/experimental/stable_diffusion_35_large/demo.py',
    description: 'Generates a sample 1024x1024 image using Stable Diffusion 3.5 Large on TT hardware, saves to ~/tt-scratchpad',
    variables: ['ttMetalPath'],
  },

  START_INTERACTIVE_IMAGE_GEN: {
    id: 'start-interactive-image-gen',
    name: 'Start Interactive SD 3.5 Mode',
    template:
      'mkdir -p ~/tt-scratchpad && cd ~/tt-scratchpad && export PYTHONPATH="{{ttMetalPath}}":$PYTHONPATH && export MESH_DEVICE=N150 && export NO_PROMPT=0 && pytest "{{ttMetalPath}}"/models/experimental/stable_diffusion_35_large/demo.py',
    description: 'Starts interactive mode where you can enter custom prompts for image generation, saves to ~/tt-scratchpad',
    variables: ['ttMetalPath'],
  },

  // Coding Assistant with Prompt Engineering (Lesson 9)
  VERIFY_CODING_MODEL: {
    id: 'verify-coding-model',
    name: 'Verify Llama 3.1 8B',
    template: 'ls -lh ~/models/Llama-3.1-8B-Instruct/original/',
    description: 'Verifies Llama 3.1 8B model is downloaded (should be from Lesson 3)',
  },

  CREATE_CODING_ASSISTANT_SCRIPT: {
    id: 'create-coding-assistant-script',
    name: 'Create Coding Assistant Script',
    template: 'mkdir -p ~/tt-scratchpad',
    description: 'Creates the coding assistant script with prompt engineering in ~/tt-scratchpad',
  },

  START_CODING_ASSISTANT: {
    id: 'start-coding-assistant',
    name: 'Start Coding Assistant',
    template: 'cd ~/tt-metal && export LLAMA_DIR=~/models/Llama-3.1-8B-Instruct/original && export PYTHONPATH=$(pwd) && python3 ~/tt-scratchpad/tt-coding-assistant.py',
    description: 'Starts interactive CLI coding assistant with Llama 3.1 8B using Direct API and prompt engineering',
  },

  // Environment Management with TT-Jukebox (Lesson 10)
  COPY_JUKEBOX: {
    id: 'copy-jukebox',
    name: 'Copy TT-Jukebox to Scratchpad',
    template: 'mkdir -p ~/tt-scratchpad && cp \"{{templatePath}}\" ~/tt-scratchpad/tt-jukebox.py && chmod +x ~/tt-scratchpad/tt-jukebox.py',
    description: 'Copies tt-jukebox.py script to ~/tt-scratchpad and makes it executable',
    variables: ['templatePath'],
  },

  LIST_JUKEBOX_MODELS: {
    id: 'list-jukebox-models',
    name: 'List Compatible Models',
    template: 'python3 ~/tt-scratchpad/tt-jukebox.py --list',
    description: 'Lists all models compatible with detected hardware',
  },

  JUKEBOX_FIND_CHAT: {
    id: 'jukebox-find-chat',
    name: 'Find Chat Models',
    template: 'python3 ~/tt-scratchpad/tt-jukebox.py chat',
    description: 'Finds models suitable for chat tasks',
  },

  JUKEBOX_SEARCH_LLAMA: {
    id: 'jukebox-search-llama',
    name: 'Search for Llama Models',
    template: 'python3 ~/tt-scratchpad/tt-jukebox.py --model llama',
    description: 'Fuzzy search for Llama model variants',
  },

  JUKEBOX_SETUP_LLAMA: {
    id: 'jukebox-setup-llama',
    name: 'Generate Setup Script for Llama',
    template: 'python3 ~/tt-scratchpad/tt-jukebox.py --model llama-3.1-8b --setup',
    description: 'Generates setup script for Llama 3.1 8B environment',
  },

  RUN_JUKEBOX_SETUP: {
    id: 'run-jukebox-setup',
    name: 'Run Setup Script',
    template: 'bash ~/tt-scratchpad/setup-scripts/setup_llama_3_1_8b_instruct.sh',
    description: 'Executes generated setup script to build environment',
  },

  VERIFY_JUKEBOX_ENV: {
    id: 'verify-jukebox-env',
    name: 'Verify Environment',
    template: 'cd ~/tt-metal && echo "tt-metal commit: $(git rev-parse --short HEAD)" && cd ~/tt-vllm && echo "vLLM commit: $(git rev-parse --short HEAD)" && source ~/tt-vllm-venv/bin/activate && python -c "import ttnn; import vllm; print(\'✓ Environment ready!\')"',
    description: 'Verifies tt-metal and vLLM commits match and imports work',
  },

  START_JUKEBOX_VLLM: {
    id: 'start-jukebox-vllm',
    name: 'Start vLLM Server',
    template: 'cd ~/tt-vllm && source ~/tt-vllm-venv/bin/activate && export TT_METAL_HOME=~/tt-metal && export MESH_DEVICE=N150 && export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && source ~/tt-vllm/tt_metal/setup-metal.sh && python ~/tt-scratchpad/start-vllm-server.py --model ~/models/Llama-3.1-8B-Instruct --host 0.0.0.0 --port 8000 --max-model-len 65536 --max-num-seqs 32 --block-size 64',
    description: 'Starts vLLM server with configuration from model spec',
  },

  TEST_JUKEBOX_OPENAI: {
    id: 'test-jukebox-openai',
    name: 'Test with OpenAI SDK',
    template: 'python3 -c "from openai import OpenAI; client = OpenAI(base_url=\'http://localhost:8000/v1\', api_key=\'dummy\'); response = client.chat.completions.create(model=\'meta-llama/Llama-3.1-8B-Instruct\', messages=[{\'role\': \'user\', \'content\': \'What is machine learning?\'}], max_tokens=128); print(response.choices[0].message.content)"',
    description: 'Tests vLLM server with OpenAI SDK',
  },

  TEST_JUKEBOX_CURL: {
    id: 'test-jukebox-curl',
    name: 'Test with curl',
    template: 'curl http://localhost:8000/v1/chat/completions -H "Content-Type: application/json" -d \'{"model": "meta-llama/Llama-3.1-8B-Instruct", "messages": [{"role": "user", "content": "Explain neural networks in one sentence"}], "max_tokens": 64}\'',
    description: 'Tests vLLM server with curl HTTP request',
  },

  MONITOR_JUKEBOX_PV: {
    id: 'monitor-jukebox-pv',
    name: 'Monitor with pv',
    template: 'curl -N http://localhost:8000/v1/chat/completions -H "Content-Type: application/json" -d \'{"model": "meta-llama/Llama-3.1-8B-Instruct", "messages": [{"role": "user", "content": "Write a story about AI"}], "max_tokens": 512, "stream": true}\' | pv -l -i 0.1',
    description: 'Monitors streaming API response with pv (pipe viewer)',
  },

  // Image Classification with TT-Forge (Lesson 11)
  INSTALL_FORGE: {
    id: 'install-forge',
    name: 'Install TT-Forge',
    template: 'python3 -m venv ~/tt-forge-venv && source ~/tt-forge-venv/bin/activate && pip install tt_forge_fe --extra-index-url https://pypi.eng.aws.tenstorrent.com/ && pip install tt_tvm --extra-index-url https://pypi.eng.aws.tenstorrent.com/ && pip install pillow torch torchvision requests tabulate',
    description: 'Creates venv and installs TT-Forge-FE (latest), TT-TVM, and dependencies',
  },

  TEST_FORGE_INSTALL: {
    id: 'test-forge-install',
    name: 'Test Forge Installation',
    template: 'source ~/tt-forge-venv/bin/activate && python3 -c "import forge; print(f\'✓ TT-Forge {forge.__version__} loaded successfully\\!\')" && tt-smi',
    description: 'Verifies forge module loads and TT device is detected',
  },

  CREATE_FORGE_CLASSIFIER: {
    id: 'create-forge-classifier',
    name: 'Create Image Classifier Script',
    template: 'mkdir -p ~/tt-scratchpad && cp \"{{templatePath}}\" ~/tt-scratchpad/tt-forge-classifier.py && chmod +x ~/tt-scratchpad/tt-forge-classifier.py',
    description: 'Copies tt-forge-classifier.py template to ~/tt-scratchpad',
    variables: ['templatePath'],
  },

  RUN_FORGE_CLASSIFIER: {
    id: 'run-forge-classifier',
    name: 'Run Image Classifier',
    template: 'cd ~/tt-scratchpad && source ~/tt-forge-venv/bin/activate && python tt-forge-classifier.py',
    description: 'Runs MobileNetV2 image classification with TT-Forge on sample image',
  },

  RUN_FORGE_CUSTOM_IMAGE: {
    id: 'run-forge-custom-image',
    name: 'Classify Custom Image',
    template: 'cd ~/tt-scratchpad && source ~/tt-forge-venv/bin/activate && python tt-forge-classifier.py --image {{imagePath}}',
    description: 'Classifies a user-provided image with TT-Forge compiled model',
    variables: ['imagePath'],
  },
};

/**
 * Replaces variables in a command template with actual values
 *
 * @param template - Command template with {{variable}} placeholders
 * @param variables - Object with variable names and their values
 * @returns Command string with variables replaced
 */
export function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }

  return result;
}

/**
 * Gets a formatted command for display in markdown
 *
 * @param commandKey - Key from TERMINAL_COMMANDS
 * @param variables - Variables to replace (if any)
 * @returns Formatted command string ready for display
 */
export function getDisplayCommand(
  commandKey: keyof typeof TERMINAL_COMMANDS,
  variables?: Record<string, string>
): string {
  const command = TERMINAL_COMMANDS[commandKey];

  if (variables && command.variables) {
    return replaceVariables(command.template, variables);
  }

  return command.template;
}
