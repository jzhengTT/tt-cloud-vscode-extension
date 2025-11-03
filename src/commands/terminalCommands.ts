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
    template:
      'mkdir -p ~/models && huggingface-cli download meta-llama/Llama-3.1-8B-Instruct --include "original/*" --local-dir ~/models/Llama-3.1-8B-Instruct',
    description: 'Creates ~/models directory and downloads Llama-3.1-8B-Instruct model (~16GB)',
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
    template: 'cp "{{templatePath}}" ~/tt-chat.py && chmod +x ~/tt-chat.py',
    description: 'Copies the chat script template to home directory and makes it executable',
    variables: ['templatePath'],
  },

  START_CHAT_SESSION: {
    id: 'start-chat-session',
    name: 'Start Interactive Chat',
    template:
      'cd "{{ttMetalPath}}" && export LLAMA_DIR="{{modelPath}}" && export PYTHONPATH=$(pwd) && python3 ~/tt-chat.py',
    description: 'Starts the interactive chat REPL with the Llama model on tt-metal',
    variables: ['ttMetalPath', 'modelPath'],
  },

  // HTTP API Server (Lesson 5)
  CREATE_API_SERVER: {
    id: 'create-api-server',
    name: 'Create API Server Script',
    template: 'cp "{{templatePath}}" ~/tt-api-server.py && chmod +x ~/tt-api-server.py',
    description: 'Copies the API server script template to home directory and makes it executable',
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
      'cd "{{ttMetalPath}}" && export LLAMA_DIR="{{modelPath}}" && export PYTHONPATH=$(pwd) && python3 ~/tt-api-server.py --port 8080',
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
