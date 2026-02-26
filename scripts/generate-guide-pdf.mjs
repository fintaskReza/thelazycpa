import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const outPath = path.join(process.cwd(), 'AI-Automation-101-Minimal.pdf');
const doc = new PDFDocument({ size: 'A4', margin: 56 });

doc.pipe(fs.createWriteStream(outPath));

const colors = {
  bg: '#FFFFFF',
  text: '#111111',
  sub: '#4B5563',
  accent: '#111827',
  line: '#E5E7EB'
};

function coverPage() {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.bg);
  doc.fillColor(colors.accent)
    .font('Helvetica-Bold')
    .fontSize(34)
    .text('AI & Automation 101', 56, 130, { align: 'left' });

  doc.fillColor(colors.sub)
    .font('Helvetica')
    .fontSize(14)
    .text('A practical beginner guide in 12 simple topics', 56, 182);

  doc.moveTo(56, 220).lineTo(540, 220).strokeColor(colors.line).stroke();

  doc.fillColor(colors.text)
    .font('Helvetica')
    .fontSize(12)
    .text('Prepared for TheLazyCPA readers', 56, 250)
    .text('By Reza Shahrokhi', 56, 270)
    .text(`Date: ${new Date().toISOString().slice(0,10)}`, 56, 290);

  doc.fillColor(colors.sub)
    .fontSize(11)
    .text('This guide is intentionally minimal: short explanations, practical examples, and clear next steps.', 56, 350, { width: 480, lineGap: 4 });

  doc.fillColor('#6B7280').fontSize(10).text('thelazycpa.vercel.app', 56, 780, { align: 'left' });
}

function topicPage(topic) {
  doc.addPage();

  doc.fillColor(colors.accent)
    .font('Helvetica-Bold')
    .fontSize(24)
    .text(`${topic.number}. ${topic.title}`, 56, 70);

  doc.moveTo(56, 105).lineTo(540, 105).strokeColor(colors.line).stroke();

  doc.fillColor(colors.text)
    .font('Helvetica')
    .fontSize(12)
    .text(topic.summary, 56, 130, { width: 480, lineGap: 4 });

  doc.moveDown(1.2);
  doc.fillColor(colors.accent).font('Helvetica-Bold').fontSize(12).text('Quick example');
  doc.fillColor(colors.text).font('Helvetica').fontSize(11).text(topic.example, { width: 480, lineGap: 3 });

  doc.moveDown(1.1);
  doc.fillColor(colors.accent).font('Helvetica-Bold').fontSize(12).text('Do this');
  topic.doList.forEach(item => {
    doc.fillColor(colors.text).font('Helvetica').fontSize(11).text(`• ${item}`, { width: 480, lineGap: 2 });
  });

  doc.moveDown(0.8);
  doc.fillColor('#374151').font('Helvetica-Bold').fontSize(12).text('Avoid this');
  topic.dontList.forEach(item => {
    doc.fillColor(colors.sub).font('Helvetica').fontSize(11).text(`• ${item}`, { width: 480, lineGap: 2 });
  });

  doc.fillColor('#6B7280').font('Helvetica').fontSize(9).text('AI & Automation 101', 56, 800, { align: 'left' });
  doc.text(`Page ${doc.bufferedPageRange().count + 1}`, 500, 800, { align: 'left' });
}

const topics = [
  {
    number: 1,
    title: 'API Keys',
    summary: 'An API key is a private credential that proves your app is allowed to use a service. Treat it like a password.',
    example: 'Your signup flow sends a welcome email through SMTP. The SMTP password is a secret key used by the server.',
    doList: ['Store secrets in environment variables', 'Rotate keys if exposed', 'Limit permissions'],
    dontList: ['Hardcode keys in source code', 'Share keys in chat screenshots']
  },
  {
    number: 2,
    title: 'Terminal Basics',
    summary: 'The terminal is a fast control panel for files, deployments, and scripts.',
    example: 'Use terminal commands to deploy to Vercel and verify live health endpoints quickly.',
    doList: ['Use clear scripts', 'Keep commands documented'],
    dontList: ['Run destructive commands blindly', 'Ignore output/errors']
  },
  {
    number: 3,
    title: 'Environment Variables',
    summary: 'Environment variables separate code from configuration across development, preview, and production.',
    example: 'Set SMTP_USER and SMTP_PASS in Vercel so production can send emails.',
    doList: ['Set values per environment', 'Validate in /api/health'],
    dontList: ['Assume local values exist in production']
  },
  {
    number: 4,
    title: 'Webhooks',
    summary: 'Webhooks push events automatically to another service when something happens.',
    example: 'A payment event triggers a CRM update without manual input.',
    doList: ['Verify signatures', 'Retry on failure'],
    dontList: ['Accept unsigned webhook payloads']
  },
  {
    number: 5,
    title: 'APIs',
    summary: 'APIs are contracts between systems. Inputs and outputs must be predictable.',
    example: 'Your /api/subscribe endpoint should always return success/error with clear flags.',
    doList: ['Use consistent JSON responses', 'Handle edge cases'],
    dontList: ['Return vague errors']
  },
  {
    number: 6,
    title: 'Data Storage',
    summary: 'Choose persistent storage suited to your runtime. Serverless requires durable external storage.',
    example: 'Use Google Sheets or a database for leads instead of /tmp files.',
    doList: ['Plan persistence from day one'],
    dontList: ['Rely on ephemeral local storage in production']
  },
  {
    number: 7,
    title: 'Automation Flow',
    summary: 'Every automation should have trigger, processing rules, action, and logging.',
    example: 'Signup trigger → validate input → store lead → send confirmation email → log result.',
    doList: ['Add retries and alerts'],
    dontList: ['Skip logging']
  },
  {
    number: 8,
    title: 'Prompting AI',
    summary: 'Good prompts are specific about role, task, constraints, and output format.',
    example: 'Ask for concise email copy with subject line, body, and CTA in plain text.',
    doList: ['Specify format and tone'],
    dontList: ['Use vague one-line prompts for complex tasks']
  },
  {
    number: 9,
    title: 'Human Approval Points',
    summary: 'Keep approvals where mistakes are costly: publishing, legal, finance, and customer-facing content.',
    example: 'Queue posts and request approval before posting to X.',
    doList: ['Define approve/reject workflow'],
    dontList: ['Fully automate high-risk actions']
  },
  {
    number: 10,
    title: 'Monitoring',
    summary: 'What you cannot monitor, you cannot trust.',
    example: 'Use /api/health and alert when SMTP or data sync is down.',
    doList: ['Track uptime and error rates'],
    dontList: ['Wait for customers to report issues']
  },
  {
    number: 11,
    title: 'Security Basics',
    summary: 'Use least privilege, secret rotation, and audit logs as standard practice.',
    example: 'Rotate compromised tokens and revoke old credentials immediately.',
    doList: ['Scope access tightly'],
    dontList: ['Reuse the same token everywhere']
  },
  {
    number: 12,
    title: 'Build-Measure-Improve',
    summary: 'Ship small improvements, measure impact, and iterate quickly.',
    example: 'Release one signup fix, test real submissions, then refine based on results.',
    doList: ['Use weekly iteration loops'],
    dontList: ['Delay launch waiting for perfect polish']
  }
];

coverPage();
topics.forEach(topicPage);

doc.end();
console.log(`Generated: ${outPath}`);
