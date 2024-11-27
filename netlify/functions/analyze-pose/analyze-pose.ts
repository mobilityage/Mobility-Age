import { Handler } from '@netlify/functions';
import OpenAI from "openai";

// ... [previous interface and error class definitions remain the same]

const handler: Handler = async (event) => {
  // ... [previous validation logic remains the same]

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an elite physiotherapist specializing in mobility assessment and exercise prescription. You have extensive experience creating personalized exercise programs that directly target mobility limitations.

For each exercise you prescribe, you must include:
- Clear name of the exercise
- Detailed setup instructions
- Specific movement instructions
- Sets and repetitions
- Key form cues
- Signs of proper execution
- When to progress difficulty`
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyze this ${poseName} pose and provide a detailed mobility report.

Your response must follow this exact format:

1. Form Analysis:
- Evaluate visible joint positions and alignment
- Note any limitations or compensations
- Score overall form quality

2. Mobility Age (20-80):
- Provide specific age based on observed movement quality
- Explain key factors influencing this age assessment

3. Exercise Prescription:
EXERCISE 1:
- Name:
- Setup:
- Movement:
- Sets/Reps:
- Form Cues:
- Progress When:

EXERCISE 2:
- Name:
- Setup:
- Movement:
- Sets/Reps:
- Form Cues:
- Progress When:

Both exercises should directly address limitations observed in the pose assessment. Make exercises accessible but challenging enough to drive improvement.`
            },
            {
              type: "image_url",
              image_url: {
                url: photo,
              },
            }
          ],
        },
      ],
      max_tokens: 500
    });

    const content = completion.choices[0].message.content || '';
    
    // Extract mobility age
    const mobilitySection = content.split('Mobility Age')[1]?.split('Exercise')[0] || '';
    const ageMatch = mobilitySection.match(/\b([2-8][0-9]|20)\b/);
    const mobilityAge = ageMatch ? parseInt(ageMatch[0]) : 35;
    
    // Extract main feedback
    const formSection = content.split('Form Analysis')[1]?.split('Mobility Age')[0] || '';
    const feedback = formSection.split('.')[0] + '.';

    // Extract exercises with improved parsing
    const exerciseSection = content.split('Exercise Prescription:')[1] || '';
    const exercises = exerciseSection
      .split(/EXERCISE \d+:/i)
      .filter(Boolean)
      .map(ex => {
        const parts = ex.split(/\n-\s*/);
        const relevantParts = parts
          .filter(p => p.trim().length > 0)
          .map(p => p.trim());
        return relevantParts.join('. ');
      })
      .filter(ex => ex.length > 20);

    const recommendations = exercises.length ? exercises : [
      "Exercise 1: Perform mobility-specific stretches focusing on identified limitations. 3 sets of 30 seconds each.",
      "Exercise 2: Practice the movement pattern with controlled tempo. 3 sets of 8-10 repetitions."
    ];

    const isGoodForm = mobilityAge <= 40;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobilityAge,
        feedback: feedback || 'Form analysis completed.',
        recommendations,
        isGoodForm
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      })
    };
  }
};

export { handler };
