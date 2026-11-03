const http = require('http');

async function testOllamaChat() {
  console.log('Testing local Ollama runtime with model: qwen3.5:4b...');

  const prompt = {
    model: 'qwen3.5:4b',
    messages: [
      {
        role: 'system',
        content: `You are Alex Mercer, Senior Full-Stack Software Engineer in the Engineering department at Virtual AI Company (VAC).
You report to Marcus Vance (CTO). You specialize in TypeScript, React, NestJS, Three.js, and PostgreSQL.
Inspect files and provide technical architectural assessments.`
      },
      {
        role: 'user',
        content: `Task: Alex, inspect the existing VAC frontend architecture and prepare a short technical report identifying three maintainability improvements. Do not modify any files.`
      }
    ],
    stream: false,
    options: {
      temperature: 0.3
    }
  };

  const start = Date.now();
  const res = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prompt)
  });

  const durationMs = Date.now() - start;
  console.log('Response status:', res.status, `(took ${durationMs}ms)`);
  const data = await res.json();
  console.log('--- Ollama Output ---');
  console.log(data.message?.content);
}

testOllamaChat().catch(console.error);

