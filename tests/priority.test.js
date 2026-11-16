const test = require('node:test');
const assert = require('node:assert/strict');
const { calculatePriority } = require('../server/utils/priorityEngine');

test('Priority Engine - should mark completed tasks with COMPLETED level', () => {
  const task = {
    title: 'Operating Systems Lab',
    status: 'completed',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    effortHours: 3
  };

  const result = calculatePriority(task);
  assert.equal(result.level, 'COMPLETED');
  assert.equal(result.score, 0);
  assert.match(result.explanation, /already completed/i);
});

test('Priority Engine - should mark overdue tasks as CRITICAL with isOverdue true', () => {
  const pastDeadline = new Date(Date.now() - 3600000 * 5).toISOString(); // 5 hours ago
  const task = {
    title: 'Computer Networks Assignment',
    status: 'pending',
    deadline: pastDeadline,
    effortHours: 4,
    category: 'Assignment'
  };

  const result = calculatePriority(task);
  assert.equal(result.level, 'CRITICAL');
  assert.equal(result.isOverdue, true);
  assert.match(result.explanation, /OVERDUE/i);
});

test('Priority Engine - should assign CRITICAL priority to tasks due within 24 hours with significant effort', () => {
  const soonDeadline = new Date(Date.now() + 3600000 * 8).toISOString(); // 8 hours away
  const task = {
    title: 'Algorithms Midterm Exam',
    course: 'CS301',
    status: 'pending',
    deadline: soonDeadline,
    effortHours: 6,
    difficulty: 'Hard',
    category: 'Examination'
  };

  const result = calculatePriority(task);
  assert.equal(result.level, 'CRITICAL');
  assert.equal(result.isOverdue, false);
  assert.ok(result.score >= 70);
  assert.match(result.explanation, /CS301/);
});

test('Priority Engine - should assign MEDIUM or LOW to tasks far in the future with light effort', () => {
  const farDeadline = new Date(Date.now() + 86400000 * 20).toISOString(); // 20 days away
  const task = {
    title: 'Intro to Philosophy Essay',
    status: 'pending',
    deadline: farDeadline,
    effortHours: 2,
    difficulty: 'Easy',
    category: 'Assignment'
  };

  const result = calculatePriority(task);
  assert.ok(result.level === 'LOW' || result.level === 'MEDIUM');
  assert.ok(result.score < 50);
});
