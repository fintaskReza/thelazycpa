import fs from 'fs';
import path from 'path';
import html_to_pdf from 'html-pdf-node';

const outPath = path.join(process.cwd(), 'AI-Automation-101-Minimal.pdf');

const topics = [
  ['API Keys', 'Private credentials that authenticate your app. Treat as secrets.'],
  ['Terminal Basics', 'Fast command-line control for deployments, scripts, and debugging.'],
  ['Environment Variables', 'Keep config outside code across dev/preview/prod.'],
  ['Webhooks', 'Automatic event messages between systems.'],
  ['APIs', 'Clear contracts for system-to-system communication.'],
  ['Data Storage', 'Use durable storage in production, not ephemeral runtime files.'],
  ['Automation Flow', 'Trigger → logic → action → logging.'],
  ['Prompting AI', 'Specific context and output format improve reliability.'],
  ['Human Approval', 'Add approval gates for high-risk actions.'],
  ['Monitoring', 'Track health and failures proactively.'],
  ['Security Basics', 'Least privilege, token rotation, and auditability.'],
  ['Iteration Loop', 'Ship, measure, improve weekly.']
];

const topicPages = topics.map((t, i) => `
<section class="page topic">
  <h1>${i + 1}. ${t[0]}</h1>
  <p>${t[1]}</p>
  <h2>Quick example</h2>
  <p>Apply this in TheLazyCPA signup flow with clear validation, confirmation emails, and persistent lead storage.</p>
  <h2>Do</h2>
  <ul><li>Keep it simple</li><li>Document assumptions</li><li>Test with real submissions</li></ul>
  <h2>Avoid</h2>
  <ul><li>Hidden configuration</li><li>Silent failures</li><li>Overengineering too early</li></ul>
</section>
`).join('\n');

const html = `<!doctype html>
<html><head><meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; color:#111; margin:0; }
  .page { page-break-after: always; min-height: 250mm; }
  .cover h1 { font-size: 44px; margin: 60px 0 10px; }
  .cover p { color:#4b5563; font-size:16px; max-width: 70ch; line-height:1.6; }
  .rule { border:0; border-top:1px solid #e5e7eb; margin: 24px 0; }
  .topic h1 { font-size: 30px; margin: 0 0 12px; }
  .topic h2 { font-size: 16px; margin: 22px 0 8px; }
  p, li { font-size: 13px; line-height: 1.6; }
  ul { margin: 0; padding-left: 20px; }
  .muted { color:#6b7280; }
</style></head>
<body>
<section class="page cover">
  <h1>AI & Automation 101</h1>
  <p><strong>Cover letter</strong></p>
  <p>Hi — this guide is designed to be practical and easy to read. Each topic gets one clean page with a short explanation, a concrete example, and simple do/avoid lists.</p>
  <hr class="rule" />
  <p class="muted">Prepared by Reza Shahrokhi · TheLazyCPA</p>
</section>
${topicPages}
</body></html>`;

const file = { content: html };
const options = { format: 'A4', printBackground: true, margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } };

const pdfBuffer = await html_to_pdf.generatePdf(file, options);
fs.writeFileSync(outPath, pdfBuffer);
console.log(`Generated: ${outPath}`);
