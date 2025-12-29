# Documentation Review & Improvements

## Executive Summary

Analyzed 9,084 lines of documentation across 14 lessons, README, and welcome page. Found **critical issues** requiring immediate attention before release, plus numerous opportunities for improvement following Microsoft Writing Style Guide.

---

## 🚨 Critical Issues (Must Fix Before Release)

### 1. **README.md is Completely Outdated**

**Current state:** Talks about "Hello World" extension
**Reality:** Comprehensive 13-lesson walkthrough with production features

**Impact:** Users and GitHub visitors see completely wrong information

**Fix required:**
- Rewrite README to reflect actual extension capabilities
- Include lesson overview
- Show real features (vLLM, Forge, TT-XLA, etc.)
- Update screenshots/examples

### 2. **Broken Reference to Removed Content**

**File:** `content/lessons/01-hardware-detection.md:76`
**Issue:** "Status: Use Lesson 10 (Jukebox) for validated configs"
**Problem:** Jukebox (Lesson 10) has been moved to separate repository

**Fix required:**
- Remove or update reference
- Update lesson numbers if referencing later lessons

### 3. **Inconsistent Lesson Numbering**

**Issue:** Files show "11-" prefix for multiple different lessons:
- `11-bounty-program-model-bringup.md`
- `11-explore-metalium.md`
- `11-forge-image-classification.md`

**Fix required:**
- Rename files to match actual lesson order
- Update all cross-references

---

## Microsoft Writing Style Guide Issues

### Voice & Tone

#### ✅ **What's Working Well**

1. **Active voice dominates** (good examples):
   - "Run the command" (not "The command should be run")
   - "You'll see information about..." (direct address)
   - "Click the button to run Python code" (clear action)

2. **Conversational tone** (appropriate for developer docs):
   - "Don't worry if `tt-smi` doesn't detect your hardware immediately"
   - "You've been working with TT-Metal..."
   - Uses contractions appropriately ("you'll", "isn't")

3. **Present tense preference**:
   - "This command scans..." (not "will scan")
   - "The extension provides..." (not "will provide")

#### ❌ **Issues to Fix**

1. **Passive voice instances** (found ~15):

   **Lesson 6, Line 3:**
   ```markdown
   ❌ "If you downloaded the model in Lesson 3 before this update, you may need to re-download..."
   ✅ "Did you download the model before we updated Lesson 3? Re-download to get both formats."
   ```

   **Lesson 1, Line 128:**
   ```markdown
   ❌ "This is common and usually easy to fix."
   ✅ "You can usually fix this easily."
   ```

2. **Vague pronouns**:

   **Lesson 11, Line 80:**
   ```markdown
   ❌ "Current Status: TT-Forge is experimental."
   ✅ "TT-Forge is experimental as of December 2025."
   ```

3. **Overly formal phrases**:

   **Multiple lessons:**
   ```markdown
   ❌ "The following command will..."
   ✅ "This command will..." or "Run this command to..."
   ```

---

## Terminology Inconsistencies

### Issue: Mixed Capitalization & Hyphenation

**Found variations:**
- `tt-metal` vs `TT-Metal` vs `tt-Metal` vs `TT-METAL`
- `vLLM` vs `VLLM` vs `vllm`
- `TT-Forge` vs `tt-forge` vs `Forge`
- `TT-XLA` vs `tt-xla`
- `Tenstorrent` vs `TensTorrent`

### Recommended Standard

| Term | When to Use | Examples |
|------|-------------|----------|
| **tt-metal** | Commands, paths, technical | `cd ~/tt-metal`, `import ttnn` |
| **TT-Metal** | Product name, first mention | "TT-Metal is Tenstorrent's framework" |
| **vLLM** | Always (matches official branding) | "vLLM provides OpenAI-compatible API" |
| **TT-Forge** | Product name | "TT-Forge is an MLIR-based compiler" |
| **TT-XLA** | Product name | "TT-XLA supports JAX and PyTorch" |
| **Tenstorrent** | Always (company name) | Never "TensTorrent" |

---

## Formatting Inconsistencies

### Code Blocks

**Mixed styles found:**

```markdown
❌ Style 1 (no language):
```
command here
```

❌ Style 2 (bash without indicator):
```
$ command here
```

✅ Recommended:
```bash
command here
```
```

### Command Links

**Inconsistent emoji usage:**
- Some: `[🔍 Detect Hardware](command:...)`
- Others: `[Detect Hardware](command:...)`
- No clear pattern

**Recommendation:** Either use emojis consistently or remove entirely (personal preference check with team)

### Headings

**Mixed hierarchy found:**
- Some lessons use `##` for main sections
- Others start with `#` for title, then `##`
- Inconsistent use of "---" dividers

**Recommendation:**
```markdown
# Lesson Title (H1 - once)
## Main Sections (H2)
### Subsections (H3)
#### Details (H4)
```

---

## Content Quality Issues

### 1. **Outdated Cross-References**

**Examples found:**
- References to "Lesson 10 (Jukebox)" after Jukebox removal
- "Continue to Lesson 2" (should these be clickable?)
- Version numbers in text may become stale

**Recommendation:**
- Audit all lesson cross-references
- Consider using relative references
- Add dates to version-specific statements

### 2. **Repetitive Content**

**Pattern:** Every lesson has similar troubleshooting sections

**Example duplicated content:**
```markdown
# In Lesson 1, 2, 3, 6, 11:
"Check system logs: dmesg | grep -i tenstorrent"
"Get help: Discord, GitHub issues"
"Common issues: ..."
```

**Recommendation:**
- Create shared troubleshooting appendix
- Link to it from lessons
- Keep lesson-specific troubleshooting only

### 3. **Missing Context**

**Lesson 6, Line 72:**
```markdown
"If you're jumping directly to this lesson..."
```

**Issue:** Assumes linear progression but users may skip lessons

**Recommendation:**
- Every lesson should be self-contained where possible
- Clear prerequisites at top
- Quick prerequisite check commands
- Links to dependency lessons

---

## Positive Patterns (Keep These!)

### 1. **Excellent Troubleshooting Sections**

- Step-by-step debugging
- Clear expected vs. actual outputs
- Multiple solution paths
- Community resources

**Example from Lesson 1:**
```markdown
### Check 1: Hardware Connection
**Verify card is detected by PCIe:**
```bash
lspci | grep -i tenstorrent
```

**Expected output:**
```
01:00.0 Processing accelerators: Tenstorrent Inc. Device [model]
```

**If nothing appears:**
- Card isn't properly seated...
```

### 2. **Progressive Disclosure**

Lessons build well:
1. Hardware → 2. Verification → 3. Model → 4. Interactive → 5. API → 6. Production

### 3. **Visual Learning Aids**

- ASCII diagrams for architecture
- Before/after comparisons
- Performance tables
- Hardware specifications

---

## Accessibility & Inclusivity

### ✅ Good Practices

- No gendered language ("user" not "he/she")
- International English (color vs colour - consistent American)
- Avoids idioms/cultural references
- Clear technical terms defined on first use

### ⚠️ Potential Issues

1. **Assumes Knowledge:**
   - "PCIe" used without definition (Lesson 1)
   - "Tensor parallelism" assumed understood
   - "MLIR" not explained on first use

2. **Technical Barriers:**
   - Heavy command-line focus (good for target audience)
   - Assumes Linux/Unix knowledge
   - Some commands need sudo (permission implications)

**Recommendation:**
- Add glossary of terms
- Link to external resources for foundational concepts
- Note Windows/Mac differences where applicable

---

## Specific Lesson Issues

### Lesson 1: Hardware Detection
- ✅ Excellent troubleshooting
- ❌ Reference to removed Jukebox (line 76)
- ❌ Some commands assume sudo access

### Lesson 6: vLLM Production
- ✅ Good prerequisite checks
- ✅ Clear comparison tables
- ❌ Note about re-downloading model could be clearer
- ❌ Architecture name for Blackhole mentioned but not always needed

### Lesson 11: TT-Forge
- ✅ Realistic about experimental status
- ✅ Clear comparison to other tools
- ❌ "Current Status" needs date context
- ❌ Environment variable warning could be more prominent

---

## Recommendations for FAQ

Based on documentation review, users will need FAQ for:

1. **"Which hardware do I have?"** (from Lesson 1 issues)
2. **"Which lesson should I start with?"** (from linear progression assumption)
3. **"What if a command fails?"** (common across all lessons)
4. **"How do I know which model to use?"** (from model compatibility questions)
5. **"What's the difference between TT-Metal, TT-Forge, and TT-XLA?"** (tooling confusion)
6. **"Do I need to do lessons in order?"** (lesson dependencies)
7. **"What are the hardware requirements for each lesson?"** (N150 vs N300 vs T3K)
8. **"How do I update tt-metal?"** (version management questions)
9. **"Why isn't my model working?"** (compatibility issues)
10. **"Where can I get help?"** (support channels)

---

## Action Items for Release

### Priority 1 (Blocking Release)
- [ ] Rewrite README.md completely
- [ ] Fix broken Jukebox reference
- [ ] Standardize lesson file numbering
- [ ] Audit all cross-references

### Priority 2 (Important for Quality)
- [ ] Standardize terminology (create style guide document)
- [ ] Remove passive voice instances
- [ ] Add dates to version-specific statements
- [ ] Create comprehensive FAQ (see FAQ_DRAFT.md)

### Priority 3 (Nice to Have)
- [ ] Create shared troubleshooting appendix
- [ ] Add glossary of technical terms
- [ ] Improve code block consistency
- [ ] Add Windows/Mac notes where relevant

---

## Tools to Help

### Automated Checks

```bash
# Find passive voice
grep -r "is \w\+ed" content/lessons/*.md
grep -r "are \w\+ed" content/lessons/*.md
grep -r "was \w\+ed" content/lessons/*.md

# Find terminology inconsistencies
grep -ri "tt-metal\|TT-Metal" content/
grep -ri "vllm\|vLLM\|VLLM" content/

# Find broken references
grep -r "Lesson 10" content/
grep -r "Jukebox" content/
```

### Style Checker

Consider adding to CI:
- Vale (prose linter with Microsoft Writing Style Guide rules)
- markdownlint for format consistency
- Link checker for cross-references

---

## Conclusion

**Overall Assessment:** Documentation is comprehensive and high-quality, but needs polish before release.

**Estimated effort to fix:**
- Priority 1 issues: 4-6 hours
- Priority 2 issues: 3-4 hours
- Priority 3 issues: 2-3 hours

**Key strength:** Excellent troubleshooting and progressive structure

**Key weakness:** Inconsistent terminology and outdated README

**Recommendation:** Fix Priority 1 issues before any release. Priority 2 can be addressed in first patch.
