import { serve } from 'https://deno.land/std@0.184.0/http/server.ts';
import { load } from 'https://deno.land/std@0.184.0/dotenv/mod.ts';

// Load environment variables
const env = await load();
const OPENAI_API_KEY = env['OPENAI_API_KEY'];

function getRandomEmojis(count: number = 3): string[] {
  // Define emoji ranges
  const emojiRanges = [
    [0x1f600, 0x1f64f], // Emoticons
    [0x1f300, 0x1f5ff], // Miscellaneous Symbols and Pictographs
    [0x1f680, 0x1f6ff], // Transport and Map Symbols
    [0x1f900, 0x1f9ff], // Supplemental Symbols and Pictographs
  ];

  const generateEmoji = (): string => {
    const [start, end] =
      emojiRanges[Math.floor(Math.random() * emojiRanges.length)];
    const randomCodePoint =
      Math.floor(Math.random() * (end - start + 1)) + start;
    return String.fromCodePoint(randomCodePoint);
  };

  return Array.from({ length: count }, generateEmoji);
}

async function generateStoryFromEmojis(emojis: string[]): Promise<string> {
  const prompt = `Generate a short story (no more than 30 words) based on these emojis, story should be chronological with emojis. Do not include emojis in text: ${emojis.join(
    ' '
  )}`;

  console.log('Sending request to OpenAI API...');
  console.log('Prompt:', prompt);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
    }),
  });

  console.log('Received response from OpenAI API');

  if (!response.ok) {
    console.error('API Response:', await response.text());
    throw new Error(`OpenAI API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

const handler = async (req: Request): Promise<Response> => {
  try {
    const emojis = getRandomEmojis(3);
    const story = await generateStoryFromEmojis(emojis);

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Random Emojis and Story</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            text-align: center;
            max-width: 80%;
          }
          #emoji {
            font-size: 5rem;
            margin-bottom: 1rem;
          }
          p {
            font-size: 1.2rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div id="emoji">${emojis.join(' ')}</div>
          <p>${story}</p>
        </div>
      </body>
      </html>
    `;

    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response('An error occurred', { status: 500 });
  }
};

console.log('Server running on http://localhost:8000');
await serve(handler, { port: 8000 });
