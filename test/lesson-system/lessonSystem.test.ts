/**
 * Lesson System Tests
 *
 * Tests for the custom TreeView + Webview lesson system.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { LessonRegistry } from '../../src/utils/LessonRegistry';
import { StateManager } from '../../src/state/StateManager';
import { ProgressTracker } from '../../src/state/ProgressTracker';

suite('Lesson System Test Suite', () => {
  let context: vscode.ExtensionContext;

  suiteSetup(async function() {
    this.timeout(30000);

    // Get extension context
    const ext = vscode.extensions.getExtension('tenstorrent.tenstorrent-developer-extension');
    assert.ok(ext, 'Extension should be installed');

    await ext.activate();
    context = (ext.exports as any).context;
    assert.ok(context, 'Extension context should be available');
  });

  suite('Extension Activation', () => {
    test('Extension should be present', () => {
      const ext = vscode.extensions.getExtension('tenstorrent.tenstorrent-developer-extension');
      assert.ok(ext, 'Extension not found');
    });

    test('Extension should activate', async () => {
      const ext = vscode.extensions.getExtension('tenstorrent.tenstorrent-developer-extension');
      await ext!.activate();
      assert.strictEqual(ext!.isActive, true, 'Extension did not activate');
    });
  });

  suite('TreeView Registration', () => {
    test('showLesson command should be registered', async () => {
      const commands = await vscode.commands.getCommands();
      assert.ok(
        commands.includes('tenstorrent.showLesson'),
        'showLesson command not registered'
      );
    });

    test('refreshLessons command should be registered', async () => {
      const commands = await vscode.commands.getCommands();
      assert.ok(
        commands.includes('tenstorrent.refreshLessons'),
        'refreshLessons command not registered'
      );
    });

    test('filterLessons command should be registered', async () => {
      const commands = await vscode.commands.getCommands();
      assert.ok(
        commands.includes('tenstorrent.filterLessons'),
        'filterLessons command not registered'
      );
    });
  });

  suite('Lesson Registry', () => {
    let registry: LessonRegistry;

    setup(() => {
      registry = new LessonRegistry(context);
    });

    test('Should load lesson registry', async () => {
      await registry.load();
      const count = registry.getTotalCount();
      assert.ok(count > 0, 'Should load lessons');
      assert.strictEqual(count, 16, 'Should have 16 lessons');
    });

    test('Should have correct categories', async () => {
      await registry.load();
      const categories = registry.getCategories();

      assert.strictEqual(categories.length, 4, 'Should have 4 categories');

      const categoryIds = categories.map(c => c.id);
      assert.ok(categoryIds.includes('fundamentals'), 'Should have fundamentals');
      assert.ok(categoryIds.includes('application'), 'Should have application');
      assert.ok(categoryIds.includes('exploration'), 'Should have exploration');
    });

    test('Should get lesson by ID', async () => {
      await registry.load();
      const lesson = registry.get('hardware-detection');

      assert.ok(lesson, 'Should find hardware-detection lesson');
      assert.strictEqual(lesson?.id, 'hardware-detection');
      assert.strictEqual(lesson?.title, 'Hardware Detection');
    });

    test('Should filter by category', async () => {
      await registry.load();
      const fundamentals = registry.getByCategory('fundamentals');

      assert.strictEqual(fundamentals.length, 5, 'Should have 5 fundamental lessons');
      fundamentals.forEach(lesson => {
        assert.strictEqual(lesson.category, 'fundamentals');
      });
    });
  });

  suite('Integration Tests', () => {
    test('Should execute showLesson command', async () => {
      await vscode.commands.executeCommand(
        'tenstorrent.showLesson',
        'hardware-detection'
      );

      assert.ok(true, 'showLesson command executed');
    });

    test('Old walkthrough commands should still work', async () => {
      const commands = await vscode.commands.getCommands();

      assert.ok(
        commands.includes('tenstorrent.runHardwareDetection'),
        'Old commands should be preserved'
      );
      assert.ok(
        commands.includes('tenstorrent.openWalkthrough'),
        'Walkthrough commands should be preserved'
      );
    });
  });
});
