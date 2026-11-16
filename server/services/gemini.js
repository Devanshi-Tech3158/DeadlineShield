/**
 * Gemini AI Service for DeadlineShield
 * Integrates with Google Generative AI SDK (@google/generative-ai)
 * Handles structured task breakdown, timeouts, and fallback generation
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generates an intelligent, academic-specific fallback breakdown
 * when Gemini API key is missing, network is down, or quota is exceeded.
 */
function generateFallbackBreakdown(task, reason = 'Gemini API not configured or unavailable') {
  const effort = task.effortHours || 6;
  const category = (task.category || 'Assignment').toLowerCase();
  const title = task.title || 'Academic Task';
  const course = task.course ? `for ${task.course}` : '';

  let steps = [];

  if (category.includes('exam')) {
    steps = [
      {
        title: 'Review Syllabus & Exam Pattern',
        description: `Analyze marking schemes and compile list of high-weightage topics ${course}.`,
        suggestedDay: 'Day 1',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.2))} hours`,
        status: 'pending'
      },
      {
        title: 'Core Concept Mastery & Notes',
        description: 'Read primary textbook chapters and prepare 1-page condensed formula sheets.',
        suggestedDay: 'Day 2',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.35))} hours`,
        status: 'pending'
      },
      {
        title: 'Solve Past Papers & Numerical Problems',
        description: 'Solve questions from the last 3-5 years under untimed conditions to build accuracy.',
        suggestedDay: 'Day 3',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.3))} hours`,
        status: 'pending'
      },
      {
        title: 'Timed Mock Test & Final Quick Revision',
        description: 'Attempt a simulated exam environment, review weak spots, and ensure proper rest.',
        suggestedDay: 'Day 4',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.15))} hours`,
        status: 'pending'
      }
    ];
  } else if (category.includes('project')) {
    steps = [
      {
        title: 'Requirements & Scope Definition',
        description: `Define project objectives, user stories, and architecture requirements for "${title}".`,
        suggestedDay: 'Day 1',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.15))} hours`,
        status: 'pending'
      },
      {
        title: 'System Design & Database Schema',
        description: 'Design ER diagrams, database tables, component wireframes, and API endpoints.',
        suggestedDay: 'Day 2',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.2))} hours`,
        status: 'pending'
      },
      {
        title: 'Core Feature Implementation',
        description: 'Implement main logic, CRUD operations, backend handlers, and primary user workflows.',
        suggestedDay: 'Day 3',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.35))} hours`,
        status: 'pending'
      },
      {
        title: 'Testing, Edge Cases & Bug Fixing',
        description: 'Execute end-to-end user tests, fix boundary issues, and polish UI responsiveness.',
        suggestedDay: 'Day 4',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.15))} hours`,
        status: 'pending'
      },
      {
        title: 'Documentation, README & Submission',
        description: 'Write comprehensive project documentation, clean code comments, and prepare submission.',
        suggestedDay: 'Day 5',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.15))} hours`,
        status: 'pending'
      }
    ];
  } else if (category.includes('lab')) {
    steps = [
      {
        title: 'Prelab Theory & Algorithm Setup',
        description: `Review experiment theory, expected input/output ranges, and required software tools.`,
        suggestedDay: 'Day 1',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.25))} hours`,
        status: 'pending'
      },
      {
        title: 'Code/Hardware Experimentation',
        description: 'Write the experiment code, run initial test cases, and record raw observations.',
        suggestedDay: 'Day 2',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.45))} hours`,
        status: 'pending'
      },
      {
        title: 'Analysis, Graphs & Lab Record Writing',
        description: 'Plot necessary charts, write inferences, format answers, and prepare for viva questions.',
        suggestedDay: 'Day 3',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.3))} hours`,
        status: 'pending'
      }
    ];
  } else if (category.includes('presentation')) {
    steps = [
      {
        title: 'Outline & Content Research',
        description: `Identify key takeaways, cite reputable sources, and draft presentation talking points.`,
        suggestedDay: 'Day 1',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.3))} hours`,
        status: 'pending'
      },
      {
        title: 'Slide Deck Creation & Visuals',
        description: 'Build slides with clear visual hierarchy, diagrams, minimal text, and punchy titles.',
        suggestedDay: 'Day 2',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.4))} hours`,
        status: 'pending'
      },
      {
        title: 'Speech Rehearsal & Q&A Prep',
        description: 'Practice speaking aloud with a timer, prepare answers for potential audience questions.',
        suggestedDay: 'Day 3',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.3))} hours`,
        status: 'pending'
      }
    ];
  } else {
    // Standard Assignment / General Academic Task
    steps = [
      {
        title: 'Understand Requirements & Outline',
        description: `Carefully read the prompt for "${title}", clarify questions, and create a solution outline.`,
        suggestedDay: 'Day 1',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.2))} hours`,
        status: 'pending'
      },
      {
        title: 'Core Draft & Solution Development',
        description: 'Write primary answers, code solutions, or report sections without premature editing.',
        suggestedDay: 'Day 2',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.5))} hours`,
        status: 'pending'
      },
      {
        title: 'Review, Proofreading & Submission',
        description: 'Verify calculations, check rubrics, format references, and complete final submission.',
        suggestedDay: 'Day 3',
        estimatedDuration: `${Math.max(1, Math.round(effort * 0.3))} hours`,
        status: 'pending'
      }
    ];
  }

  // Format steps with generated IDs
  const subtasks = steps.map((s, idx) => ({
    id: `step-${Date.now()}-${idx + 1}`,
    stepNumber: idx + 1,
    title: s.title,
    description: s.description,
    suggestedDay: s.suggestedDay,
    estimatedDuration: s.estimatedDuration,
    status: 'pending'
  }));

  return {
    success: true,
    isAiGenerated: false,
    model: 'Manual Academic Template (AI Fallback)',
    fallbackReason: reason,
    summary: `Structured academic plan for "${title}" (${subtasks.length} manageable steps, approx. ${effort} hours total).`,
    subtasks
  };
}

/**
 * Calls Google Gemini API to generate real AI-assisted subtasks
 */
async function generateAiTaskBreakdown(task) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    return generateFallbackBreakdown(
      task,
      'Gemini API key is not configured in backend .env. Loaded verified academic template plan instead.'
    );
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const systemInstruction = `You are DeadlineShield AI, an expert academic productivity coach for university and high school students.
Your job is to break down large, stressful academic assignments, projects, exams, and lab work into 3 to 6 manageable, realistic, actionable steps.
Requirements:
1. Divide the work logically based on the student's deadline and estimated effort.
2. Return ONLY a valid JSON object matching the exact schema requested. Do not include markdown code fences like \`\`\`json or commentary.
3. Every step must have a clear title, practical description, suggestedDay (e.g. "Day 1", "Day 2", etc.), and estimatedDuration (e.g. "1.5 hours").`;

  const prompt = `Please create an actionable, structured deadline protection plan for the following student task:

Task Title: ${task.title}
Course/Subject: ${task.course || 'General'}
Category: ${task.category || 'Assignment'}
Difficulty: ${task.difficulty || 'Medium'}
Total Estimated Effort: ${task.effortHours || 5} hours
Deadline: ${task.deadline ? new Date(task.deadline).toDateString() : 'Upcoming'}
Additional Notes / Description: ${task.description || 'None provided'}

Respond with a JSON object in this exact structure:
{
  "summary": "Brief 1-sentence supportive strategy for the student",
  "subtasks": [
    {
      "stepNumber": 1,
      "title": "Actionable Step Title",
      "description": "Specific guidance on what to complete in this step.",
      "suggestedDay": "Day 1",
      "estimatedDuration": "2 hours",
      "status": "pending"
    }
  ]
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    
    // We try the configured model, and candidate fallback models
    const candidateModels = [modelName, 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    const uniqueModels = [...new Set(candidateModels)];

    let lastError = null;

    for (const modelToTry of uniqueModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelToTry,
          systemInstruction,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3
          }
        });

        // Set a 15-second timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI request timed out after 15 seconds')), 15000)
        );

        const resultPromise = model.generateContent(prompt);
        const result = await Promise.race([resultPromise, timeoutPromise]);
        const responseText = result.response.text();

        // Clean any accidental markdown wrap
        let cleanedJson = responseText.trim();
        if (cleanedJson.startsWith('```json')) {
          cleanedJson = cleanedJson.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (cleanedJson.startsWith('```')) {
          cleanedJson = cleanedJson.replace(/^```/, '').replace(/```$/, '').trim();
        }

        const parsed = JSON.parse(cleanedJson);

        if (!parsed || !Array.isArray(parsed.subtasks) || parsed.subtasks.length === 0) {
          throw new Error('AI returned an invalid subtask structure');
        }

        const formattedSubtasks = parsed.subtasks.map((step, idx) => ({
          id: `step-${Date.now()}-${idx + 1}`,
          stepNumber: step.stepNumber || idx + 1,
          title: step.title || `Step ${idx + 1}`,
          description: step.description || 'Actionable milestone toward completion.',
          suggestedDay: step.suggestedDay || `Day ${idx + 1}`,
          estimatedDuration: step.estimatedDuration || `${Math.max(1, Math.round((task.effortHours || 4) / parsed.subtasks.length))} hours`,
          status: 'pending'
        }));

        return {
          success: true,
          isAiGenerated: true,
          model: modelToTry,
          summary: parsed.summary || `AI-generated ${formattedSubtasks.length}-step roadmap for ${task.title}.`,
          subtasks: formattedSubtasks
        };
      } catch (err) {
        lastError = err;
        console.warn(`[DeadlineShield AI] Model "${modelToTry}" attempt failed:`, err.message);
        // Continue to try next candidate model
      }
    }

    // If all models failed, fall back gracefully
    console.error('[DeadlineShield AI] All Gemini attempts failed. Falling back to academic template.');
    return generateFallbackBreakdown(
      task,
      `Gemini API call encountered an issue (${lastError ? lastError.message : 'Unknown error'}). A verified academic template plan has been provided.`
    );
  } catch (err) {
    console.error('[DeadlineShield AI] Unexpected error during AI generation:', err.message);
    return generateFallbackBreakdown(task, `Unexpected service error: ${err.message}`);
  }
}

module.exports = {
  generateAiTaskBreakdown,
  generateFallbackBreakdown
};
