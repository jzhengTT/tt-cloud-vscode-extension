# Research Report: Expanding VS Code's Walkthrough Interface

**Date:** 2025-01-21
**Project:** Tenstorrent VS Code Extension
**Purpose:** Plan for contributing hierarchical walkthrough organization to VS Code

---

## Executive Summary

The "don't add multiple walkthroughs unless absolutely necessary" guideline suggests underinvestment in the feature. The good news: **VS Code is very open to community contributions**, and the walkthrough feature is ripe for enhancement.

## Current State of VS Code Walkthroughs

### Architecture (from source code analysis)

**Location:** `src/vs/workbench/contrib/welcomeGettingStarted/browser/`

**Key Components:**
- `gettingStarted.ts` - Main walkthrough controller
- `GettingStartedPage` - Editor pane renderer
- `GettingStartedIndexList` - List management and ranking
- Progress tracking system per-step and per-category

**Current Capabilities:**
- ✅ Walkthroughs organized as categories containing steps
- ✅ "Featured" and "New" badges
- ✅ Progress tracking and completion states
- ✅ Hidden categories (user can hide completed walkthroughs)
- ✅ Basic ranking algorithm (featured → new → recency)

**Missing Capabilities:**
- ❌ Multi-level hierarchies (only 2 levels: category → steps)
- ❌ Sub-categories or grouped steps
- ❌ Conditional prerequisites (show walkthrough B only after completing A)
- ❌ Learning paths (sequences of related walkthroughs)
- ❌ Filtering by skill level or topic

## VS Code Contribution Process

### How Open is Microsoft?

**Very open** - VS Code follows an **open development model**:

1. **Monthly Iteration Cycles**
   - Roadmap published 6-12 months ahead
   - Community feedback shapes priorities
   - Transparent iteration plans

2. **Community Contributions Welcomed**
   - Active GitHub PR review
   - Community members help triage issues
   - Wiki states: "Want to contribute? Fork it and send a pull request"

3. **Feature Request Process**
   - File GitHub issue with `feature-request` label
   - Team evaluates during planning
   - High-voted features prioritized

### Requirements for UX/Workbench Changes

**Definition of Done Checklist:**
- ✅ Test plan created
- ✅ Keyboard accessible
- ✅ Screen reader accessible
- ✅ Works with all themes (including high contrast)
- ✅ Telemetry events in place
- ✅ Release notes updated

### Historical Precedent

**Recent Workbench UX Improvements:**
- Flexible sidebar (left AND right) - community-driven
- Profiles feature - roadmap item
- Tree view enhancements - reduced need for custom webviews
- First-run experience improvements - ongoing

**Most upvoted requests show they listen:**
- Detachable windows (investigating)
- Detachable terminals (2nd most upvoted, being worked on)

## Code-Server Relationship

### Tracking Strategy

**Code-server actively tracks VS Code upstream:**
- Latest: code-server v4.105.1 → VS Code v1.105.1
- **Minimal patch approach** - they keep changes small
- **Upstream first** - they contribute back to VS Code when possible
- Successfully merged 3 upstream changes in 2022

**Key Insight:** If you enhance VS Code walkthroughs, code-server will automatically inherit them.

### Where Code-Server Differs

Only in self-hosting features:
- Custom marketplace
- Custom telemetry
- Sub-path hosting
- Proposed API access

**Walkthrough features would be identical** - no divergence here.

## Feasibility Assessment

### What Would It Take?

**Option 1: Minimal Enhancement (Low Effort)**
- Add `category` field to walkthrough schema
- Update `GettingStartedIndexList` to group by category
- Add collapsible sections to UI
- **Estimated:** 1-2 weeks for experienced TypeScript dev

**Option 2: Full Hierarchy (Medium Effort)**
- Multi-level categories (category → subcategory → walkthrough → steps)
- Filtering by topic/skill level
- Learning path sequences (prerequisites)
- Enhanced progress visualization
- **Estimated:** 4-6 weeks

**Option 3: Learning Platform (Ambitious)**
- Achievement system
- Recommended next steps
- Search across all walkthroughs
- Community-contributed content
- **Estimated:** 3-6 months (multiple contributors)

### Implementation Path

**Phase 1: Research & Proposal (2 weeks)**
1. File GitHub issue describing use case
2. Gather community feedback
3. Create design mockups
4. Propose schema changes

**Phase 2: Proof of Concept (2-3 weeks)**
1. Fork microsoft/vscode
2. Implement basic category grouping
3. Test with real extensions
4. Share screenshots/videos

**Phase 3: PR Submission (1-2 weeks)**
1. Write comprehensive tests
2. Ensure accessibility (keyboard + screen reader)
3. Add telemetry events
4. Update documentation
5. Submit PR with clear rationale

**Phase 4: Iteration (variable)**
1. Address reviewer feedback
2. Refine implementation
3. Merge upstream

### Success Probability

**High likelihood of acceptance if:**
- ✅ Solves real pain point (check - we have 14 lessons!)
- ✅ Backwards compatible (existing walkthroughs still work)
- ✅ Follows VS Code design language
- ✅ Meets accessibility requirements
- ✅ Well-tested and documented
- ✅ Community support (upvotes on issue)

**Risk factors:**
- Microsoft may have architectural reasons for current design
- Performance concerns with many walkthroughs
- Maintenance burden of more complex UI

## Recommendations

### Short Term (Our Extension)

**Create multiple walkthroughs NOW** (within current API):

```json
"walkthroughs": [
  {
    "id": "tenstorrent.setup",
    "title": "🚀 Getting Started (Required)",
    "description": "Hardware setup and first inference",
    "steps": [
      "01-hardware-detection",
      "02-verify-installation",
      "03-download-model"
    ]
  },
  {
    "id": "tenstorrent.ai-apps",
    "title": "💬 AI Applications (LLM & Images)",
    "description": "Build chat apps, APIs, and generate images",
    "steps": [
      "04-interactive-chat",
      "05-api-server",
      "06-vllm-production",
      "07-vscode-chat",
      "08-image-generation",
      "09-coding-assistant"
    ]
  },
  {
    "id": "tenstorrent.tools",
    "title": "🛠️ Advanced Tools (Jukebox & Forge)",
    "description": "Environment management and MLIR compiler",
    "steps": [
      "10-jukebox-environment",
      "11-forge-image-classification"
    ]
  },
  {
    "id": "tenstorrent.community",
    "title": "🌟 Contributing & Projects",
    "description": "Bounty program, tutorials, and cookbook",
    "steps": [
      "12-bounty-program",
      "13-explore-metalium",
      "14-metalium-cookbook"
    ]
  }
]
```

**Benefits:**
- Works today with zero code changes
- Users can focus on relevant paths
- 3-6 steps per walkthrough vs 14
- Better completion rates

### Medium Term (Contribute to VS Code)

**File a feature request:**

**Title:** "Enhancement: Hierarchical organization for extension walkthroughs"

**Body:**
```markdown
## Problem
Extensions with comprehensive learning content (10+ lessons) create
overwhelming single walkthroughs. Users abandon due to cognitive overload.

Example: The Tenstorrent extension has 14 lessons covering hardware setup,
LLM inference, image generation, tools, and contribution guides. As a single
flat list, users don't know where to start or what's relevant to them.

## Current Limitations
- Extensions discouraged from creating multiple walkthroughs
- No way to organize related walkthroughs
- No difficulty levels or learning paths
- Users see one long list

## Proposed Solution
Add optional `category` and `difficulty` fields to walkthrough schema:

```json
{
  "walkthroughs": [
    {
      "id": "...",
      "title": "...",
      "category": "Getting Started",  // NEW: Groups related walkthroughs
      "difficulty": "beginner",        // NEW: Helps users find appropriate content
      "prerequisites": ["other.walkthrough.id"],  // NEW: Learning paths
      ...
    }
  ]
}
```

UI changes:
- Get Started page displays grouped/collapsible sections by category
- Filter by difficulty level
- Show prerequisite chains
- Recommend "next steps" after completion

## Benefits
- Reduced cognitive load for learners
- Better content discovery
- Progressive learning paths
- Backwards compatible (all fields optional)
- Extensions can provide richer educational experiences

## Real-World Use Case
The Tenstorrent extension would organize as:
- **Getting Started** (3 lessons) - Required for everyone
- **AI Applications** (6 lessons) - Choose your interest: LLM, images, or both
- **Advanced Tools** (2 lessons) - Optional power-user features
- **Contributing** (3 lessons) - For community contributors

Each category becomes manageable instead of overwhelming.

## Implementation Offer
Happy to contribute PR if the team is interested. Initial proof of concept
could be done in 2-3 weeks.

## Related Issues
- [List any related issues about walkthrough organization]

## Community Interest
Would love feedback from other extension authors - does this solve problems
for your extensions too?
```

### Long Term (VS Code as Learning Platform)

**Vision:** Make VS Code the **best developer learning environment**

**Features:**
- 📚 Rich hierarchical walkthroughs
- 🎯 Skill-level filtering (beginner → advanced)
- 🔗 Learning paths (course sequences)
- 🏆 Achievement system
- 🔍 Search across all walkthroughs
- 📊 Progress dashboard
- 🤝 Community-contributed content

**Why it matters:**
- Onboarding new devs to tools/frameworks
- Interactive documentation beats static docs
- Extension authors create better learning experiences
- VS Code becomes educational platform, not just editor

**Examples of what becomes possible:**
- **Framework tutorials:** React, Vue, Angular extensions provide learning paths
- **Language courses:** Learn Python, Rust, Go through interactive walkthroughs
- **Tool mastery:** Git, Docker, Kubernetes step-by-step guides
- **Best practices:** Security, testing, accessibility courses built into the editor

## Technical Details

### Source Code Locations
- **Main repository:** https://github.com/microsoft/vscode
- **Walkthrough feature:** `src/vs/workbench/contrib/welcomeGettingStarted/browser/`
- **Key files:**
  - `gettingStarted.ts` - Main controller
  - `gettingStartedPage.ts` - UI renderer
  - `gettingStartedIndexList.ts` - List management

### Schema Extension Proposal

**Current schema** (package.json):
```json
{
  "contributes": {
    "walkthroughs": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "when": "string (optional)",
        "steps": [...]
      }
    ]
  }
}
```

**Proposed enhanced schema:**
```json
{
  "contributes": {
    "walkthroughs": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "category": "string (optional)",           // NEW
        "difficulty": "beginner|intermediate|advanced (optional)",  // NEW
        "estimatedTime": "number (minutes, optional)",  // NEW
        "prerequisites": ["walkthrough.id (optional)"],  // NEW
        "when": "string (optional)",
        "steps": [...]
      }
    ]
  }
}
```

### UI Mockup Ideas

**Before (current):**
```
Getting Started
├─ Extension 1: Walkthrough A (14 steps)
├─ Extension 2: Walkthrough B (8 steps)
└─ Extension 3: Walkthrough C (12 steps)
```

**After (proposed):**
```
Getting Started
├─ 🚀 Getting Started
│   ├─ Extension 1: Setup (3 steps) [beginner, 10 min]
│   └─ Extension 2: Installation (2 steps) [beginner, 5 min]
├─ 💻 Development
│   ├─ Extension 1: Build Apps (6 steps) [intermediate, 30 min]
│   └─ Extension 3: API Guide (4 steps) [intermediate, 20 min]
└─ 🛠️ Advanced
    ├─ Extension 1: Tools (2 steps) [advanced, 15 min]
    └─ Extension 3: Optimization (8 steps) [advanced, 45 min]

[Filter: All | Beginner | Intermediate | Advanced]
```

## Action Plan

**Immediate (Week 1):**
- [ ] Restructure Tenstorrent extension to 4 separate walkthroughs
- [ ] Test with users to validate improvement
- [ ] Gather feedback on organization

**Near-term (Week 2-3):**
- [ ] Create mockups for hierarchical walkthrough UI
- [ ] File GitHub issue with detailed proposal
- [ ] Share with VS Code community for feedback
- [ ] Gauge interest from other extension authors

**If Positive Response (Month 2):**
- [ ] Fork microsoft/vscode
- [ ] Study existing walkthrough implementation
- [ ] Implement proof of concept
- [ ] Create demo video/screenshots
- [ ] Share with VS Code team

**If Approved (Month 3+):**
- [ ] Refine implementation based on feedback
- [ ] Write comprehensive tests
- [ ] Ensure full accessibility compliance
- [ ] Add telemetry events
- [ ] Submit PR with documentation
- [ ] Iterate with reviewers
- [ ] Celebrate merge! 🎉

## Resources

### Key Links
- **VS Code Repository:** https://github.com/microsoft/vscode
- **Contribution Guidelines:** https://github.com/microsoft/vscode/blob/main/CONTRIBUTING.md
- **How to Contribute Wiki:** https://github.com/microsoft/vscode/wiki/How-to-Contribute
- **Development Process:** https://github.com/microsoft/vscode/wiki/Development-Process
- **Roadmap:** https://github.com/microsoft/vscode/wiki/Roadmap
- **Walkthrough API Docs:** https://code.visualstudio.com/api/ux-guidelines/walkthroughs
- **Code-server:** https://github.com/coder/code-server

### Contact Points
- GitHub issues: Primary communication channel
- VS Code team: Active on GitHub, responsive to well-formed proposals
- Community: Stack Overflow (`visual-studio-code` tag)

## Conclusion

**Yes, we should pursue this!**

✅ **VS Code is open** - Community contributions welcomed
✅ **Walkthrough code is accessible** - TypeScript, well-structured
✅ **Real need exists** - We have 14 lessons proving the use case
✅ **Low risk** - Backwards compatible enhancement
✅ **Code-server benefits too** - Automatic upstream tracking
✅ **Helps entire ecosystem** - All extensions with learning content benefit

The "don't add multiple walkthroughs unless necessary" guideline proves the point - they didn't invest enough in this feature. **We have a great opportunity to make VS Code better for everyone.**

**Next Steps:** Start with restructuring our extension into 4 walkthroughs, then gauge community interest before investing in upstream contribution.

---

*This plan saved: 2025-01-21*
*Extension version at time of plan: v0.0.57*
