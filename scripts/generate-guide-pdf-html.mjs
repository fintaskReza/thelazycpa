import fs from 'fs';
import path from 'path';
import html_to_pdf from 'html-pdf-node';

const outPath = path.join(process.cwd(), 'AI-Automation-101-Minimal.pdf');

const topics = [
  {
    title: 'API Keys',
    why: 'API keys are the identity layer for machine-to-machine actions. They decide what your app can access and what it cannot.',
    concept: 'Treat API keys like banking credentials. If leaked, they can be abused for cost, spam, or data exposure.',
    example: 'Your signup endpoint sends confirmation emails via SMTP. SMTP credentials are effectively API keys and must stay server-side only.',
    checklist: ['Store keys in environment variables', 'Scope keys to minimum permissions', 'Rotate on schedule or immediately after leakage'],
    mistakes: ['Committing keys to Git', 'Sharing screenshots with visible credentials', 'Using production keys in local testing'],
    action: 'Today: audit all secrets used by TheLazyCPA and confirm none are hardcoded.'
  },
  {
    title: 'Terminal Basics',
    why: 'Terminal commands give speed, repeatability, and precision for operations work.',
    concept: 'If a task is repeated, script it. Manual click paths are slower and inconsistent.',
    example: 'Deploying with `npx vercel --prod` is faster and easier to verify than dashboard-only workflows.',
    checklist: ['Use explicit working directories', 'Keep scripts in `/scripts`', 'Capture command output for debugging'],
    mistakes: ['Running commands from the wrong folder', 'Ignoring non-zero exit codes', 'Executing destructive commands without backups'],
    action: 'Today: keep a `scripts/` folder for repeatable deploy/test tasks.'
  },
  {
    title: 'Environment Variables',
    why: 'Configuration changes by environment. Code should not.',
    concept: 'Separate logic from secrets and deployment-specific values.',
    example: 'Set `SMTP_*` and `FROM_EMAIL` in Vercel production so emails work without touching source code.',
    checklist: ['Define required envs in docs', 'Set for production/preview/development', 'Add health checks for missing vars'],
    mistakes: ['Setting values only in one environment', 'Assuming local `.env` exists in production', 'No validation on startup'],
    action: 'Today: keep `/api/health` listing critical config status.'
  },
  {
    title: 'Webhooks',
    why: 'Webhooks automate event-driven workflows with low latency.',
    concept: 'Instead of polling, subscribe to events and process instantly.',
    example: 'When a lead signs up, trigger enrichment or CRM sync immediately.',
    checklist: ['Verify webhook signature', 'Use idempotency keys', 'Retry transient failures'],
    mistakes: ['Trusting unsigned requests', 'Processing duplicates as new events', 'No dead-letter handling'],
    action: 'Today: enforce signature verification on all inbound webhooks.'
  },
  {
    title: 'API Design',
    why: 'Good APIs reduce bugs and speed up future integrations.',
    concept: 'Predictable request/response structure is part of product quality.',
    example: '`/api/subscribe` should always return structured JSON including success state and delivery status.',
    checklist: ['Validate inputs', 'Return consistent status objects', 'Include machine-readable error codes'],
    mistakes: ['Mixed response formats', 'Silent failures', 'Vague error messages'],
    action: 'Today: standardize all endpoints around one response schema.'
  },
  {
    title: 'Data Storage for Serverless',
    why: 'Serverless runtime disks are often temporary. Durable storage is essential for business data.',
    concept: 'Use external persistence for leads, status, and audit logs.',
    example: 'Store waiting-list signups in Google Sheets or a database; `/tmp` is not long-term storage.',
    checklist: ['Pick one source of truth', 'Add unique constraints for dedupe', 'Track write success/failure'],
    mistakes: ['Relying on in-memory arrays', 'Using temp files as primary DB', 'No backup/export plan'],
    action: 'Today: verify every lead path writes to durable storage.'
  },
  {
    title: 'Automation Workflow Structure',
    why: 'Reliable automation is architecture, not luck.',
    concept: 'Every flow should follow: Trigger → Validate → Act → Confirm → Log.',
    example: 'User submits email → validate → save lead → send email → return result + log trace.',
    checklist: ['Define happy path + failure path', 'Add retries for network calls', 'Make logs searchable by email/request ID'],
    mistakes: ['No observability', 'One giant function with no boundaries', 'No fallback when providers fail'],
    action: 'Today: map one full flow as a state diagram.'
  },
  {
    title: 'Prompting for Practical AI Output',
    why: 'Prompt quality determines reliability, especially for customer-facing content.',
    concept: 'Structure prompts with role, context, constraints, and exact output format.',
    example: 'Ask for a 120-word confirmation email in plain English with one CTA and no hype language.',
    checklist: ['Provide clear intent', 'Set length/tone constraints', 'Include expected output format'],
    mistakes: ['Overly open-ended prompts', 'No formatting requirements', 'No review step for public output'],
    action: 'Today: save tested prompt templates in a shared prompt library.'
  },
  {
    title: 'Human Approval Gates',
    why: 'Approvals protect reputation when automation touches external channels.',
    concept: 'Use automation for speed, human review for judgment.',
    example: 'Queue X posts and request explicit approve/reject before publishing.',
    checklist: ['Define approval criteria', 'Capture approver + timestamp', 'Allow easy reject/revise loops'],
    mistakes: ['Auto-publishing sensitive content', 'No audit trail', 'Ambiguous ownership'],
    action: 'Today: add approval-required tags for all public posting flows.'
  },
  {
    title: 'Monitoring & Health',
    why: 'You only control what you can observe.',
    concept: 'Health checks should reflect business-critical dependencies, not just server uptime.',
    example: 'Show SMTP configured status, storage connectivity, and recent error count.',
    checklist: ['Create a useful `/api/health`', 'Alert on failures', 'Review logs daily'],
    mistakes: ['Only monitoring 200 status', 'No alert thresholds', 'No post-incident notes'],
    action: 'Today: add one alert for email send failure spikes.'
  },
  {
    title: 'Security Fundamentals',
    why: 'Small projects are still targets. Security basics are non-optional.',
    concept: 'Apply least privilege, rotate secrets, and log sensitive operations.',
    example: 'If a token was shared in chat, rotate immediately and invalidate old tokens.',
    checklist: ['Use separate tokens per service', 'Rotate credentials routinely', 'Restrict admin access paths'],
    mistakes: ['Reusing one credential everywhere', 'No rotation process', 'Leaking secrets in logs'],
    action: 'Today: rotate any credential exposed outside secure channels.'
  },
  {
    title: 'Build → Measure → Improve',
    why: 'Operational quality improves with short feedback loops.',
    concept: 'Ship small changes, test in production safely, and iterate from real outcomes.',
    example: 'Deploy signup fix, run live test submissions, then improve copy/conversion based on data.',
    checklist: ['Release in small increments', 'Track one metric per change', 'Keep a concise changelog'],
    mistakes: ['Large risky releases', 'No baseline metric', 'No retrospective'],
    action: 'Today: define one KPI for this guide funnel (e.g., submit→email-open rate).'
  }
];

const topicPages = topics.map((t, i) => `
<section class="page topic">
  <div class="topic-head">
    <div class="topic-number">Topic ${i + 1}</div>
    <h1>${t.title}</h1>
  </div>

  <h2>Why it matters</h2>
  <p>${t.why}</p>

  <h2>Core concept</h2>
  <p>${t.concept}</p>

  <h2>Practical example</h2>
  <div class="example-box">${t.example}</div>

  <div class="grid">
    <div>
      <h3>Checklist</h3>
      <ul>${t.checklist.map(item => `<li>${item}</li>`).join('')}</ul>
    </div>
    <div>
      <h3>Common mistakes</h3>
      <ul>${t.mistakes.map(item => `<li>${item}</li>`).join('')}</ul>
    </div>
  </div>

  <h2>Action step</h2>
  <p><strong>${t.action}</strong></p>

  <div class="footer-note">AI & Automation 101 · TheLazyCPA</div>
</section>
`).join('\n');

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 16mm; }
  body {
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    color: #111827;
    margin: 0;
    background: #fff;
  }
  .page { page-break-after: always; min-height: 255mm; }

  .cover {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .cover-kicker {
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7280;
    margin-bottom: 16px;
  }
  .cover h1 {
    font-size: 44px;
    line-height: 1.05;
    margin: 0 0 16px;
  }
  .cover .sub {
    font-size: 17px;
    color: #374151;
    max-width: 72ch;
    line-height: 1.6;
    margin-bottom: 20px;
  }
  .line { border-top: 1px solid #e5e7eb; margin: 20px 0 24px; }
  .meta { color: #6b7280; font-size: 12px; }

  .topic-head { margin-bottom: 12px; }
  .topic-number {
    display: inline-block;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #4b5563;
    background: #f3f4f6;
    padding: 4px 8px;
    border-radius: 999px;
    margin-bottom: 10px;
  }
  h1 {
    font-size: 31px;
    margin: 0 0 8px;
    line-height: 1.2;
  }
  h2 {
    font-size: 14px;
    margin: 16px 0 7px;
    color: #111827;
    text-transform: uppercase;
    letter-spacing: .04em;
  }
  h3 {
    font-size: 13px;
    margin: 0 0 6px;
    color: #111827;
  }
  p, li {
    font-size: 12px;
    line-height: 1.62;
    color: #1f2937;
    margin: 0;
  }
  .example-box {
    border-left: 3px solid #9ca3af;
    background: #f9fafb;
    padding: 10px 12px;
    border-radius: 4px;
    color: #111827;
  }
  ul { margin: 0; padding-left: 18px; }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    margin-top: 10px;
  }
  .grid > div {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px;
    min-height: 110px;
  }
  .footer-note {
    margin-top: 18px;
    color: #6b7280;
    font-size: 10px;
    border-top: 1px solid #e5e7eb;
    padding-top: 8px;
  }
</style>
</head>
<body>
  <section class="page cover">
    <div class="cover-kicker">TheLazyCPA Guide</div>
    <h1>AI & Automation 101</h1>
    <p class="sub">A structured starter guide for founders and operators. Each topic is organized with clear headers, practical examples, checklists, common mistakes, and one action step.</p>
    <div class="line"></div>
    <p class="sub"><strong>Cover letter</strong><br/>Hi — this PDF is designed for fast execution, not theory. Use one topic at a time, apply the action step, and improve your systems weekly.</p>
    <p class="meta">Prepared by Reza Shahrokhi · TheLazyCPA · ${new Date().toISOString().slice(0, 10)}</p>
  </section>

  ${topicPages}
</body>
</html>`;

const file = { content: html };
const options = {
  format: 'A4',
  printBackground: true,
  margin: { top: '8mm', right: '8mm', bottom: '10mm', left: '8mm' }
};

const pdfBuffer = await html_to_pdf.generatePdf(file, options);
fs.writeFileSync(outPath, pdfBuffer);
console.log(`Generated: ${outPath}`);
