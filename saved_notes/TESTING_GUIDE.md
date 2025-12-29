# Testing Guide - Custom Lesson System

## Quick Test (Press F5)

1. **Press F5** in VSCode to launch Extension Development Host
2. **Look for Tenstorrent icon** in Activity Bar (left sidebar) - it's a book icon 📚
3. **Click the icon** to open the Tenstorrent sidebar
4. **You should see:**
   - 🔧 Fundamentals (5 lessons)
   - 🚀 Application (5 lessons)
   - 🔬 Exploration (6 lessons)

## Detailed Testing Checklist

### 1. Sidebar Visibility
- [ ] Tenstorrent icon (book) appears in Activity Bar
- [ ] Clicking icon shows "Lessons" panel
- [ ] Three categories are visible with emojis

### 2. Category Expansion
- [ ] Click 🔧 Fundamentals - expands to show 5 lessons
- [ ] Click 🚀 Application - expands to show 5 lessons
- [ ] Click 🔬 Exploration - expands to show 6 lessons
- [ ] Categories can collapse/expand

### 3. Lesson Display
- [ ] Each lesson shows with a progress badge (⭕ not started)
- [ ] Lesson titles are clear and readable
- [ ] Hover over lesson shows tooltip with metadata

### 4. Lesson Content
- [ ] Click any lesson - opens in editor panel
- [ ] Lesson header shows title and badges
- [ ] Content is rendered as HTML (not raw markdown)
- [ ] Styling looks good (respects theme)

### 5. Command Buttons
- [ ] Command buttons render as orange buttons
- [ ] Hover effect works (lighter orange)
- [ ] Click button executes command
- [ ] Button shows success feedback (✓)

### 6. Progress Tracking
- [ ] Execute a command from a lesson
- [ ] Badge changes from ⭕ to 🔵 (in progress)
- [ ] Complete all commands in a lesson
- [ ] Badge changes to ✅ (completed)
- [ ] Completion notification appears

### 7. Theme Support
- [ ] Works with light theme
- [ ] Works with dark theme
- [ ] Theme changes reflect immediately
- [ ] Colors look good in both themes

### 8. Code Blocks
- [ ] Syntax highlighting works
- [ ] Copy buttons appear on hover
- [ ] Copy button copies code to clipboard
- [ ] Success feedback shows

### 9. Navigation
- [ ] Previous/Next lesson buttons work
- [ ] Can navigate between lessons
- [ ] Lesson state persists

### 10. Filter System
- [ ] Command Palette → "Tenstorrent: Filter Lessons"
- [ ] "Validated Only" filter works
- [ ] "Clear Filters" works
- [ ] Filtered lessons update in sidebar

## Troubleshooting

### Sidebar Not Showing

**Check:**
```bash
# Verify build succeeded
npm run build

# Verify assets are in dist
ls -la dist/content/lesson-registry.json
ls -la dist/src/webview/
```

**Try:**
1. Reload Extension Development Host (Cmd+R / Ctrl+R)
2. Check Developer Tools console (Help → Toggle Developer Tools)
3. Look for errors in Console tab

### Lessons Not Loading

**Check Console for:**
- "Failed to load lesson registry"
- "Lesson registry not found"

**Fix:**
```bash
# Ensure lesson-registry.json is copied
cp content/lesson-registry.json dist/content/
npm run build
```

### Webview Not Rendering

**Check:**
- DevTools Console for CSP errors
- DevTools Network tab for failed resource loads
- Webview HTML source (right-click webview → Inspect)

**Common issues:**
- Missing CSS file
- Missing JS file
- CSP blocking resources

### Command Buttons Not Working

**Check:**
- Click button - watch terminal
- Check if command is registered
- Look for errors in Console

**Debug:**
```javascript
// In webview console
window.postMessage({type: 'executeCommand', command: 'tenstorrent.runHardwareDetection'})
```

### Progress Not Tracking

**Check:**
- Command execution completes successfully
- Lesson has completionEvents defined
- StateManager is initialized

**Debug in DevTools Console:**
```javascript
// Check current lesson
vscode.commands.executeCommand('tenstorrent.showLesson', 'hardware-detection')
```

## Common Errors

### "Cannot find module 'lesson-registry.json'"

**Solution:**
```bash
npm run build
# This runs copy-content which copies lesson-registry.json
```

### "Webview disposed"

**Cause:** Webview was closed
**Solution:** Click lesson again to recreate webview

### "Command 'tenstorrent.showLesson' not found"

**Cause:** Extension didn't activate properly
**Solution:**
1. Check activation events in package.json
2. Reload window
3. Check for TypeScript errors

### CSS Not Loading

**Check:**
```bash
ls -la dist/src/webview/styles/lesson-theme.css
```

**Fix:**
```bash
npm run build
```

## Manual Verification

### Test Lesson Load Time
```javascript
console.time('lessonLoad');
// Click lesson
console.timeEnd('lessonLoad');
// Should be < 100ms
```

### Test Progress Persistence
1. Complete a lesson
2. Reload Extension Development Host
3. Check if badge is still ✅
4. Progress should persist

### Test Filter Performance
```javascript
console.time('filter');
// Apply filter
console.timeEnd('filter');
// Should be < 50ms
```

## Debugging Tips

### Enable Verbose Logging

Add to extension.ts:
```typescript
console.log('[Lesson System] Loaded', lessonRegistry.getTotalCount(), 'lessons');
```

### Check Registry Loading

```typescript
lessonRegistry.load().then(() => {
  console.log('Registry loaded successfully');
  console.log('Categories:', lessonRegistry.getCategories());
  console.log('Lessons:', lessonRegistry.getAll());
});
```

### Monitor Progress Changes

```typescript
progressTracker.onDidChangeProgress(event => {
  console.log('Progress changed:', event);
});
```

### Inspect TreeView State

```typescript
treeDataProvider.getChildren().then(items => {
  console.log('Root items:', items);
});
```

## Performance Benchmarks

**Expected performance:**
- TreeView load: < 100ms
- Lesson switch: < 50ms
- Filter apply: < 20ms
- Markdown render: < 200ms

**If slower:**
- Check for large markdown files
- Verify caching is working
- Look for expensive operations in render path

## Integration Testing

### Test with Existing Commands
1. Open any lesson
2. Execute existing walkthrough commands
3. Verify they work unchanged
4. Check terminal output

### Test with Chat Integration
1. Open VSCode chat
2. Use @tenstorrent
3. Verify chat participant works
4. Check if lesson system doesn't interfere

### Test with Welcome Page
1. Run "Tenstorrent: Show Welcome Page"
2. Verify welcome page loads
3. Check if lesson links work
4. Welcome page should coexist with new system

## Success Criteria

✅ **Must work:**
- Sidebar shows with lessons
- Clicking lesson opens content
- Command buttons execute
- Progress tracks automatically
- Theme support works

✅ **Should work:**
- Filter system functional
- Search would be nice
- Performance meets targets
- No errors in console

✅ **Nice to have:**
- Smooth animations
- Rich tooltips
- Progress statistics
- Prerequisites visualization

## Next Steps After Testing

1. **If working:** Remove old walkthrough from package.json
2. **If issues:** Document in GitHub issues
3. **Performance issues:** Profile and optimize
4. **Missing features:** Add to roadmap

## Getting Help

**Check:**
1. Console errors (DevTools)
2. Extension Host logs
3. Network tab (resource loading)
4. Application logs (Help → Toggle Developer Tools → Application)

**Report issues with:**
- VSCode version
- Extension version (0.0.103)
- Error messages
- Steps to reproduce
- Screenshots

---

**Happy Testing!** 🚀
