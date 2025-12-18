#!/usr/bin/env node
/**
 * Lesson Validation Script
 *
 * Validates lesson metadata before release:
 * - Counts lessons by status (validated, draft, blocked)
 * - Lists lessons without validation on any hardware
 * - Optionally filters package.json to only include validated lessons
 *
 * Usage:
 *   node scripts/check-lessons.js              # Check status
 *   node scripts/check-lessons.js --strict     # Exit 1 if any draft/blocked
 *   node scripts/check-lessons.js --filter     # Generate filtered package.json
 */

const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const steps = pkg.contributes.walkthroughs[0].steps;

// Count by status
const byStatus = {
  validated: [],
  draft: [],
  blocked: []
};

steps.forEach(step => {
  const status = step.metadata?.status || 'validated'; // backward compat
  byStatus[status].push(step);
});

// Find lessons with no validation
const noValidation = steps.filter(s =>
  s.metadata?.validatedOn?.length === 0
);

// Print report
console.log('========================================');
console.log('Lesson Validation Report');
console.log('========================================');
console.log();

console.log(`Total lessons: ${steps.length}`);
console.log(`  ✅ Validated: ${byStatus.validated.length}`);
console.log(`  📝 Draft:     ${byStatus.draft.length}`);
console.log(`  🚫 Blocked:   ${byStatus.blocked.length}`);
console.log();

if (byStatus.draft.length > 0) {
  console.log('Draft lessons:');
  byStatus.draft.forEach(s => {
    console.log(`  - ${s.id} (${s.title})`);
  });
  console.log();
}

if (byStatus.blocked.length > 0) {
  console.log('Blocked lessons:');
  byStatus.blocked.forEach(s => {
    const reason = s.metadata.blockReason || 'No reason specified';
    console.log(`  - ${s.id}: ${reason}`);
  });
  console.log();
}

if (noValidation.length > 0) {
  console.log('⚠️  Lessons with NO validation on ANY hardware:');
  noValidation.forEach(s => {
    console.log(`  - ${s.id} (supported: ${s.metadata?.supportedHardware?.join(', ') || 'all'})`);
  });
  console.log();
}

// Hardware coverage
const hardwareCoverage = {};
steps.forEach(step => {
  const validatedOn = step.metadata?.validatedOn || [];
  validatedOn.forEach(hw => {
    hardwareCoverage[hw] = (hardwareCoverage[hw] || 0) + 1;
  });
});

console.log('Hardware validation coverage:');
Object.entries(hardwareCoverage)
  .sort(([, a], [, b]) => b - a)
  .forEach(([hw, count]) => {
    console.log(`  ${hw}: ${count} lessons`);
  });
console.log();

// Handle --strict flag
if (process.argv.includes('--strict')) {
  const hasIssues = byStatus.draft.length > 0 || byStatus.blocked.length > 0;
  if (hasIssues) {
    console.error('❌ FAIL: Found draft or blocked lessons (use --strict only for release builds)');
    process.exit(1);
  } else {
    console.log('✅ PASS: All lessons validated');
  }
}

// Handle --filter flag
if (process.argv.includes('--filter')) {
  const filteredSteps = steps.filter(s =>
    s.metadata?.status === 'validated' ||
    s.metadata?.status === undefined
  );

  const filteredPkg = {
    ...pkg,
    contributes: {
      ...pkg.contributes,
      walkthroughs: [{
        ...pkg.contributes.walkthroughs[0],
        steps: filteredSteps
      }]
    }
  };

  const outputPath = path.join(__dirname, '..', 'package.filtered.json');
  fs.writeFileSync(outputPath, JSON.stringify(filteredPkg, null, 2));
  console.log(`✅ Generated filtered package.json → ${outputPath}`);
  console.log(`   Included: ${filteredSteps.length} validated lessons`);
  console.log(`   Excluded: ${steps.length - filteredSteps.length} draft/blocked lessons`);
}

console.log('========================================');
