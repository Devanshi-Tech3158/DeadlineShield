/**
 * DeadlineShield Priority Engine
 * Deterministic multi-factor priority scoring algorithm
 * Works independently of AI APIs
 */

function calculatePriority(task, referenceDate = new Date()) {
  const now = new Date(referenceDate);

  // Completed tasks are handled gracefully
  if (task.status === 'completed') {
    return {
      level: 'COMPLETED',
      score: 0,
      badgeClass: 'priority-completed',
      explanation: `Task "${task.title}" is already completed! No urgent action required.`
    };
  }

  const deadline = new Date(task.deadline);
  if (isNaN(deadline.getTime())) {
    return {
      level: 'LOW',
      score: 10,
      badgeClass: 'priority-low',
      explanation: 'No valid deadline specified. Marked as low priority.'
    };
  }

  const msRemaining = deadline.getTime() - now.getTime();
  const hoursRemaining = msRemaining / (1000 * 60 * 60);
  const daysRemaining = hoursRemaining / 24;

  const effortHours = Math.max(0.5, parseFloat(task.effortHours) || 2);
  const difficulty = (task.difficulty || 'Medium').toLowerCase();
  const category = (task.category || 'Assignment').toLowerCase();

  // OVERDUE CHECK
  if (hoursRemaining < 0) {
    const overdueHours = Math.abs(Math.round(hoursRemaining));
    const overdueDays = Math.floor(overdueHours / 24);
    const overdueText = overdueDays > 0 ? `${overdueDays} day(s)` : `${overdueHours} hour(s)`;

    return {
      level: 'CRITICAL',
      score: 100,
      badgeClass: 'priority-critical',
      isOverdue: true,
      explanation: `OVERDUE: Your ${task.course || 'course'} ${task.category || 'task'} was due ${overdueText} ago. Immediate submission or extension request recommended.`
    };
  }

  // Factor 1: Effort to Time Ratio (how crammed the student will be)
  const availableHours = Math.max(hoursRemaining, 1);
  const effortRatio = Math.min(effortHours / availableHours, 1.0);

  // Factor 2: Category weights (High-stakes vs lower-stakes)
  const categoryWeights = {
    examination: 1.5,
    exam: 1.5,
    project: 1.4,
    assignment: 1.2,
    'lab work': 1.1,
    presentation: 1.25,
    other: 1.0
  };
  const catWeight = categoryWeights[category] || 1.1;

  // Factor 3: Difficulty weights
  const difficultyWeights = {
    hard: 1.4,
    medium: 1.1,
    easy: 0.9
  };
  const diffWeight = difficultyWeights[difficulty] || 1.1;

  // Base Urgency Points (0 - 55)
  let urgencyPoints = 0;
  if (hoursRemaining <= 12) {
    urgencyPoints = 55;
  } else if (hoursRemaining <= 24) {
    urgencyPoints = 48;
  } else if (hoursRemaining <= 48) {
    urgencyPoints = 35;
  } else if (hoursRemaining <= 72) {
    urgencyPoints = 25;
  } else if (hoursRemaining <= 168) { // 7 days
    urgencyPoints = 15;
  } else {
    urgencyPoints = 5;
  }

  // Workload pressure score (0 - 25)
  const effortPressurePoints = Math.round(effortRatio * 25);

  // Category and difficulty bonuses (0 - 20)
  const bonusPoints = Math.round(((catWeight - 1.0) * 15) + ((diffWeight - 1.0) * 15));

  // Total calculated score (0 - 100)
  const rawScore = urgencyPoints + effortPressurePoints + bonusPoints;
  const score = Math.min(100, Math.max(5, rawScore));

  // Determine Level
  let level = 'LOW';
  let badgeClass = 'priority-low';

  if (hoursRemaining <= 24 || score >= 70 || (hoursRemaining <= 48 && effortHours >= 4)) {
    level = 'CRITICAL';
    badgeClass = 'priority-critical';
  } else if (score >= 45 || hoursRemaining <= 72) {
    level = 'HIGH';
    badgeClass = 'priority-high';
  } else if (score >= 25 || hoursRemaining <= 168) {
    level = 'MEDIUM';
    badgeClass = 'priority-medium';
  } else {
    level = 'LOW';
    badgeClass = 'priority-low';
  }

  // Human-readable student-friendly explanation
  const timeDesc = daysRemaining < 1
    ? `due in ${Math.max(1, Math.round(hoursRemaining))} hour(s)`
    : daysRemaining < 2
    ? 'due tomorrow'
    : `due in ${Math.round(daysRemaining)} days`;

  const coursePrefix = task.course ? `${task.course} ` : '';
  const explanation = `Your ${coursePrefix}${task.category || 'task'} is ${level} priority because it is ${timeDesc} and requires approximately ${effortHours} hour(s) of ${difficulty} effort.`;

  return {
    level,
    score,
    badgeClass,
    isOverdue: false,
    hoursRemaining,
    daysRemaining,
    explanation
  };
}

module.exports = {
  calculatePriority
};
