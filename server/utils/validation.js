/**
 * Input and Output Validation for DeadlineShield Backend
 */

function sanitizeString(input, maxLength = 500) {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

function validateBreakdownRequest(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a valid JSON object.'] };
  }

  const title = sanitizeString(data.title, 200);
  if (!title || title.length < 2) {
    errors.push('Task title is required and must be at least 2 characters long.');
  }

  const course = sanitizeString(data.course, 100);
  const description = sanitizeString(data.description, 1000);

  let effortHours = parseFloat(data.effortHours);
  if (isNaN(effortHours) || effortHours <= 0) {
    effortHours = 5; // reasonable academic default
  } else if (effortHours > 300) {
    errors.push('Estimated effort cannot exceed 300 hours.');
  }

  const allowedCategories = ['Assignment', 'Examination', 'Project', 'Lab Work', 'Presentation', 'Other'];
  let category = data.category ? data.category.trim() : 'Assignment';
  if (!allowedCategories.some(c => c.toLowerCase() === category.toLowerCase())) {
    category = 'Assignment';
  }

  const allowedDifficulties = ['Easy', 'Medium', 'Hard'];
  let difficulty = data.difficulty ? data.difficulty.trim() : 'Medium';
  if (!allowedDifficulties.some(d => d.toLowerCase() === difficulty.toLowerCase())) {
    difficulty = 'Medium';
  }

  let deadline = null;
  if (data.deadline) {
    const parsedDeadline = new Date(data.deadline);
    if (!isNaN(parsedDeadline.getTime())) {
      deadline = parsedDeadline.toISOString();
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      title,
      course,
      description,
      effortHours,
      category,
      difficulty,
      deadline
    }
  };
}

function validateSubtasks(subtasks) {
  if (!Array.isArray(subtasks) || subtasks.length === 0) {
    return false;
  }

  return subtasks.every(step => {
    return (
      step &&
      typeof step === 'object' &&
      typeof step.title === 'string' &&
      step.title.trim().length > 0
    );
  });
}

module.exports = {
  sanitizeString,
  validateBreakdownRequest,
  validateSubtasks
};
