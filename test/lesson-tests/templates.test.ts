/**
 * Template Validation Tests
 *
 * Tests all Python script templates for:
 * - Valid Python syntax
 * - No import errors
 * - Proper file structure
 *
 * These tests run quickly and catch common errors before deployment.
 */

import { expect } from 'chai';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

describe('Python Template Validation', () => {
  const templatesDir = path.join(__dirname, '../../content/templates');

  /**
   * Validates Python syntax using py_compile
   * This catches syntax errors without executing the code
   */
  async function validatePythonSyntax(filename: string): Promise<void> {
    const filePath = path.join(templatesDir, filename);

    // First check file exists
    await fs.access(filePath);

    // Compile to check syntax (doesn't execute)
    // py_compile exits with error code if syntax is invalid
    await execAsync(`python3 -m py_compile "${filePath}"`);

    // If we get here, syntax is valid
  }

  /**
   * Validates that required imports are present
   * This doesn't execute code, just checks the file contents
   * Handles multi-line imports by checking for key parts
   */
  async function checkImports(filename: string, expectedModules: string[]): Promise<void> {
    const filePath = path.join(templatesDir, filename);
    const content = await fs.readFile(filePath, 'utf-8');

    for (const module of expectedModules) {
      // Remove whitespace/newlines for flexible matching
      const normalizedContent = content.replace(/\s+/g, ' ');
      expect(normalizedContent).to.include(module, `Missing import or module: ${module}`);
    }
  }

  describe('Direct API Templates', () => {
    it('tt-chat-direct.py has valid syntax', async () => {
      await validatePythonSyntax('tt-chat-direct.py');
    });

    it('tt-chat-direct.py has required imports', async () => {
      await checkImports('tt-chat-direct.py', [
        'from models.tt_transformers.tt.generator import Generator',
        'from models.tt_transformers.tt.common import',
        'import ttnn'
      ]);
    });

    it('tt-api-server-direct.py has valid syntax', async () => {
      await validatePythonSyntax('tt-api-server-direct.py');
    });

    it('tt-api-server-direct.py has required imports', async () => {
      await checkImports('tt-api-server-direct.py', [
        'from flask import Flask, request, jsonify',
        'from models.tt_transformers.tt.generator import Generator',
        'import ttnn'
      ]);
    });
  });

  describe('Pytest Wrapper Templates', () => {
    it('tt-chat.py has valid syntax', async () => {
      await validatePythonSyntax('tt-chat.py');
    });

    it('tt-chat.py has required imports', async () => {
      await checkImports('tt-chat.py', [
        'import subprocess',
        'import sys',
        'import os'
      ]);
    });

    it('tt-api-server.py has valid syntax', async () => {
      await validatePythonSyntax('tt-api-server.py');
    });

    it('tt-api-server.py has required imports', async () => {
      await checkImports('tt-api-server.py', [
        'from flask import Flask, request, jsonify',
        'import subprocess'
      ]);
    });
  });

  describe('Specialized Templates', () => {
    it('tt-coding-assistant.py has valid syntax', async () => {
      await validatePythonSyntax('tt-coding-assistant.py');
    });

    it('tt-coding-assistant.py has system prompt', async () => {
      const content = await fs.readFile(
        path.join(templatesDir, 'tt-coding-assistant.py'),
        'utf-8'
      );
      expect(content).to.include('SYSTEM_PROMPT =');
      expect(content).to.include('expert coding assistant');
    });

    it('tt-forge-classifier.py has valid syntax', async () => {
      await validatePythonSyntax('tt-forge-classifier.py');
    });

    it('tt-forge-classifier.py has required imports', async () => {
      await checkImports('tt-forge-classifier.py', [
        'import forge',
        'import torch',
        'from PIL import Image'
      ]);
    });

    it('tt-image-gen.py has valid syntax', async () => {
      await validatePythonSyntax('tt-image-gen.py');
    });

    it('tt-image-gen.py has required imports', async () => {
      await checkImports('tt-image-gen.py', [
        'from diffusers import',
        'import torch',
        'import argparse'
      ]);
    });
  });

  describe('vLLM Templates', () => {
    it('start-vllm-server.py has valid syntax', async () => {
      await validatePythonSyntax('start-vllm-server.py');
    });

    it('start-vllm-server.py has model registration', async () => {
      const content = await fs.readFile(
        path.join(templatesDir, 'start-vllm-server.py'),
        'utf-8'
      );
      expect(content).to.include('from vllm import ModelRegistry');
      expect(content).to.include('def register_tt_models():');
      expect(content).to.include('TTLlamaForCausalLM');
    });

    it('start-vllm-server.py has main guard', async () => {
      const content = await fs.readFile(
        path.join(templatesDir, 'start-vllm-server.py'),
        'utf-8'
      );
      expect(content).to.include('if __name__ == \'__main__\':');
    });
  });

  describe('Template File Structure', () => {
    it('all templates exist', async () => {
      const expectedTemplates = [
        'tt-chat-direct.py',
        'tt-api-server-direct.py',
        'tt-chat.py',
        'tt-api-server.py',
        'tt-coding-assistant.py',
        'tt-forge-classifier.py',
        'tt-image-gen.py',
        'start-vllm-server.py'
      ];

      for (const template of expectedTemplates) {
        const filePath = path.join(templatesDir, template);
        await fs.access(filePath); // Throws if file doesn't exist
      }
    });

    it('all templates are non-empty', async () => {
      const templates = await fs.readdir(templatesDir);
      const pythonTemplates = templates.filter(f => f.endsWith('.py'));

      for (const template of pythonTemplates) {
        const filePath = path.join(templatesDir, template);
        const content = await fs.readFile(filePath, 'utf-8');
        expect(content.length).to.be.greaterThan(100, `${template} is too short`);
      }
    });

    it('all templates have docstrings or comments', async () => {
      const templates = await fs.readdir(templatesDir);
      const pythonTemplates = templates.filter(f => f.endsWith('.py'));

      for (const template of pythonTemplates) {
        const filePath = path.join(templatesDir, template);
        const content = await fs.readFile(filePath, 'utf-8');

        // Should have either a docstring or comment
        const hasDocstringOrComment =
          content.includes('"""') ||
          content.includes("'''") ||
          content.includes('#');

        expect(hasDocstringOrComment, `${template} should have documentation`).to.equal(true);
      }
    });
  });

  describe('Python Version Compatibility', () => {
    it('templates use Python 3 syntax', async () => {
      const templates = await fs.readdir(templatesDir);
      const pythonTemplates = templates.filter(f => f.endsWith('.py'));

      for (const template of pythonTemplates) {
        const filePath = path.join(templatesDir, template);
        const content = await fs.readFile(filePath, 'utf-8');

        // Check for Python 2 print statements (should not exist)
        const hasPython2Print = /print\s+[^(]/.test(content);
        expect(hasPython2Print, `${template} uses Python 2 print syntax`).to.equal(false);
      }
    });
  });
});
