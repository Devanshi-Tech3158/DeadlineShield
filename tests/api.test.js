const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server/server');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('API GET /api/health - returns server status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'online');
  assert.equal(data.appName, 'DeadlineShield');
  assert.ok('aiConfigured' in data);
});

test('API POST /api/breakdown - rejects empty title with 400', async () => {
  const res = await fetch(`${baseUrl}/api/breakdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '' })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.errors.length > 0);
});

test('API POST /api/breakdown - returns structured subtasks for valid task', async () => {
  const res = await fetch(`${baseUrl}/api/breakdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'DBMS Library Management System',
      course: 'Database Management Systems',
      category: 'Project',
      difficulty: 'Hard',
      effortHours: 10,
      deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
      forceFallback: true
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.subtasks));
  assert.ok(data.subtasks.length >= 3);
  
  const firstStep = data.subtasks[0];
  assert.ok(firstStep.title);
  assert.ok(firstStep.description);
  assert.ok(firstStep.suggestedDay);
  assert.ok(firstStep.estimatedDuration);
  assert.equal(firstStep.status, 'pending');
});
