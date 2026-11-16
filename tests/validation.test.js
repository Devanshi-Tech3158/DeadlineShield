const test = require('node:test');
const assert = require('node:assert/strict');
const { validateBreakdownRequest, validateSubtasks } = require('../server/utils/validation');

test('Validation - should reject breakdown requests without title', () => {
  const result = validateBreakdownRequest({});
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
  assert.match(result.errors[0], /title is required/i);
});

test('Validation - should sanitize and set defaults for valid request', () => {
  const input = {
    title: '  Design Database for Library Management System  ',
    course: '  CS204 Database Systems  ',
    effortHours: '8',
    category: 'Project',
    difficulty: 'Hard'
  };

  const result = validateBreakdownRequest(input);
  assert.equal(result.valid, true);
  assert.equal(result.data.title, 'Design Database for Library Management System');
  assert.equal(result.data.course, 'CS204 Database Systems');
  assert.equal(result.data.effortHours, 8);
  assert.equal(result.data.category, 'Project');
  assert.equal(result.data.difficulty, 'Hard');
});

test('Validation - should validate subtasks structure', () => {
  const validSubtasks = [
    { title: 'Step 1: Planning', description: 'Plan the app', suggestedDay: 'Day 1' },
    { title: 'Step 2: Coding', description: 'Write the app', suggestedDay: 'Day 2' }
  ];
  assert.equal(validateSubtasks(validSubtasks), true);

  const invalidSubtasks = [
    { title: '', description: 'Empty title' }
  ];
  assert.equal(validateSubtasks(invalidSubtasks), false);
  assert.equal(validateSubtasks([]), false);
  assert.equal(validateSubtasks(null), false);
});
