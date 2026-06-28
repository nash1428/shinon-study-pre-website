const PDFDocument = require("pdfkit");
const fs = require("fs");

const doc = new PDFDocument({ margin: 60, size: "A4" });
const output = fs.createWriteStream("WEBSITE_SUMMARY.pdf");
doc.pipe(output);

const pageWidth = doc.page.width - 120;

// Helper: heading
function heading(text, size = 16) {
  doc.fontSize(size).fillColor("#2D4A3E").font("Helvetica-Bold");
  doc.text(text, { underline: false });
  doc.moveDown(0.3);
  doc.fillColor("#2C2A26").font("Helvetica");
}

// Helper: subheading
function subheading(text) {
  doc.fontSize(13).fillColor("#5C5751").font("Helvetica-Bold");
  doc.text(text);
  doc.moveDown(0.2);
  doc.fillColor("#2C2A26").font("Helvetica");
}

// Helper: bullet point
function bullet(text, indent = 20) {
  doc.fontSize(10).fillColor("#2C2A26").font("Helvetica");
  doc.text(`•  ${text}`, indent, doc.y, { width: pageWidth - indent });
}

// Helper: sub-bullet
function subBullet(text, indent = 40) {
  doc.fontSize(9).fillColor("#5C5751");
  doc.text(`–  ${text}`, indent, doc.y, { width: pageWidth - indent });
  doc.fillColor("#2C2A26");
}

// Helper: paragraph
function para(text) {
  doc.fontSize(10).fillColor("#2C2A26").font("Helvetica");
  doc.text(text, { width: pageWidth });
  doc.moveDown(0.3);
}

// Helper: spacer
function space(n = 1) {
  for (let i = 0; i < n; i++) doc.moveDown(0.5);
}

// ===== TITLE =====
doc.fontSize(28).fillColor("#2D4A3E").font("Helvetica-Bold");
doc.text("Study Garden", { align: "center" });
doc.fontSize(16).fillColor("#5C5751");
doc.text("Website Summary", { align: "center" });
space(1);
doc.fontSize(11).fillColor("#2D4A3E");
doc.text("Live URL: https://shinon-study-pre-website-4b4066c4.onbld.com/", { align: "center", link: "https://shinon-study-pre-website-4b4066c4.onbld.com/" });
space(2);

// ===== OVERVIEW =====
heading("Overview", 18);
para("Study Garden is a study companion web app built with Next.js 16, React 19, Tailwind CSS, and Firebase (Auth + Firestore). It features AI-powered study tools, social features, and a Japan-inspired aesthetic with a lo-fi music soundscape.");
space(1);

// ===== HOME =====
heading("Home", 16);
bullet("Monthly calendar with leading/trailing dates, event creation, Google Calendar sync");
bullet("Vertical calendar (weekly timeline) with events");
bullet("Today's Timeline showing events + lecture notes tagged to today's date");
bullet("Blue dots on calendar days that have lecture notes");
bullet("Add/edit/delete events with Firestore sync");
space(1);

// ===== NOTES =====
heading("Notes", 16);
bullet("Create notes with title, category, lecture date, content");
bullet("File uploads: PDF (inline viewer), PowerPoint, Video files, YouTube URLs");
bullet("Inline editing with auto-save (1.5s debounce to localStorage + Firestore)");
bullet("KaTeX math rendering + Mermaid graph support");
bullet("AI Anki Card generation (interactive flashcards with 3D flip animation)");
bullet("AI Quiz generation (interactive multiple-choice with correct/wrong feedback)");
bullet("Category management (create/edit/delete custom categories)");
bullet("View mode (split-screen) / Edit mode toggle");
subBullet("Left (2/3): PDF/Materials + Note Content");
subBullet("Right (1/3): Anki Cards + Quiz");
space(1);

// ===== TASKS =====
heading("Tasks", 16);
bullet("Task tracker with title, content, deadline fields");
bullet("Auto-categorization: Today / Overdue / Next 7 Days (grouped by date)");
bullet("Add/edit/delete tasks with Firestore sync");
bullet("Clear completed tasks");
space(1);

// ===== FRIEND =====
heading("Friend (SNS-style)", 16);
bullet("Profile header with cover, avatar, follower/following counts");
bullet("Study statistics (focus time, sessions, points) synced from Firestore");
bullet("Friend search by name/email");
bullet("Friend request system (send/accept/decline) via Firestore");
bullet("Privacy settings: toggle sharing Today's Tasks and Schedule");
bullet("3-dot menu for privacy toggles");
bullet("View friend's profile: study stats, today's tasks, schedule (respects privacy)");
bullet("Unconnect/unfollow buttons");
space(1);

// ===== SEARCH =====
heading("Search", 16);
bullet("Full-text search across notes, tasks, events, and friends");
bullet("Auto-suggestions, categorized results, highlighted matches");
space(1);

// ===== AI FEATURES =====
heading("AI Features (ai& API — zai-org/glm-5.2)", 16);
bullet("Fox Sensei chatbot — conversational assistant with app data context");
subBullet("Markdown rendering, function calling (creates tasks and notes via chat)");
subBullet("Anti-hallucination: strictly uses provided app data");
bullet("Anki Card generation — AI generates flashcards from note content + files");
bullet("Quiz generation — AI generates multiple-choice questions");
space(1);

// ===== AUDIO =====
heading("Audio (Google Gemini — gemini-2.5-flash-lite)", 16);
bullet("Audio summarization — Record audio in note editor, transcribe + summarize");
space(1);

// ===== FOCUS SESSION =====
heading("Focus Session", 16);
bullet("Customizable timer (5-120 minutes)");
bullet("Points system (10 points per session)");
bullet("Garden stage progression (5 stages)");
bullet("Japan-inspired lo-fi music — Web Audio API jazz beat");
subBullet("ii-V-I chord progression, swing drums, vinyl crackle, tape warble");
bullet("Global persistence — timer and music continue across page navigation");
bullet("Widget in header bar (timer, play/pause, reset, ambient toggle)");
space(1);

// ===== AUTH & DATA =====
heading("Auth & Data", 16);
bullet("Firebase Auth with session isolation (prevents cross-account data mixing)");
bullet("Profile storage — per-user localStorage + Firestore");
subBullet("avatarUrl stays local to avoid Firestore 1MB document limit");
bullet("Firestore collections: users, notes, tasks, events, friend_requests");
bullet("URL hash-based routing (survives refresh)");
bullet("Per-user profile storage keys to prevent cross-account contamination");
space(1);

// ===== DESIGN =====
heading("Design", 16);
bullet("Japan-inspired color palette (moss green, gold, ivory)");
bullet("Fox Sensei character as chatbot icon");
bullet("Custom app icon as favicon and sidebar logo");
bullet("Responsive layout with collapsible sidebar");
bullet("Language toggle (English/Japanese)");
space(1);

// ===== TECH STACK =====
heading("Tech Stack", 16);
bullet("Frontend: Next.js 16, React 19, Tailwind CSS");
bullet("Backend: Next.js API Routes (Node.js)");
bullet("Database: Firebase Firestore");
bullet("Auth: Firebase Authentication");
bullet("AI: ai& API (zai-org/glm-5.2), Google Gemini (audio)");
bullet("Music: Web Audio API (custom lo-fi generator)");
bullet("Math: KaTeX + react-katex");
bullet("Graphs: Mermaid.js");
bullet("Deployment: bld (antimony build platform)");

doc.end();
console.log("PDF generated: WEBSITE_SUMMARY.pdf");
