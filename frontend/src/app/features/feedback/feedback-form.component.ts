import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

// ─── Fragen hier anpassen ───────────────────────────────────────────
// Typ 'stars': Sterne-Bewertung 1-5, mit labels pro Stern
// Typ 'choice': Single-Choice Auswahl mit Pill-Buttons
// Typ 'multichoice': Mehrfachauswahl mit Pill-Buttons
// Typ 'text': Freitext-Feld

interface StarQuestion {
  type: 'stars';
  key: string;
  label: string;
  labels: Record<number, string>;
}

interface ChoiceQuestion {
  type: 'choice';
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface MultiChoiceQuestion {
  type: 'multichoice';
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface TextQuestion {
  type: 'text';
  key: string;
  label: string;
  placeholder: string;
}

type Question = StarQuestion | ChoiceQuestion | MultiChoiceQuestion | TextQuestion;

// ─── Konfiguration ──────────────────────────────────────────────────

const FEEDBACK_CONFIG = {
  title: 'Schulungs-Feedback',
  subtitle: 'Coding with AI — 07.04.2026',
  trainers: 'Trainer: David Kreutzer & Karsten Silz',
  thankYou: 'Vielen Dank für deine Teilnahme 😊',
  welcomeSubtext: 'Wir hoffen, du konntest etwas Wertvolles für dich mitnehmen.',
  successMessage: 'Dein Feedback hilft uns, die nächste Schulung noch besser zu machen.',
};

const QUESTIONS: Question[] = [
  {
    type: 'stars',
    key: 'gesamteindruck',
    label: 'Wie bewertest du die Schulung insgesamt?',
    labels: { 1: 'Gar nicht gut', 2: 'Ausbaufähig', 3: 'Okay', 4: 'Gut', 5: 'Hervorragend' },
  },
  {
    type: 'stars',
    key: 'praxisnutzen',
    label: 'Wie gut kannst du das Gelernte direkt in deinem Alltag einsetzen?',
    labels: { 1: 'Gar nicht', 2: 'Wenig', 3: 'Teilweise', 4: 'Gut', 5: 'Sofort einsetzbar' },
  },
  {
    type: 'stars',
    key: 'trainer',
    label: 'Wie gut waren Aufbau und Struktur des Trainings?',
    labels: {
      1: 'Nicht zufrieden',
      2: 'Wenig zufrieden',
      3: 'Okay',
      4: 'Zufrieden',
      5: 'Sehr zufrieden',
    },
  },
  {
    type: 'choice',
    key: 'aiErfahrung',
    label: 'Wie oft hast du vor der Schulung AI-Tools beim Coden genutzt?',
    options: [
      { value: 'nie', label: 'Nie' },
      { value: 'selten', label: 'Selten ausprobiert' },
      { value: 'gelegentlich', label: 'Gelegentlich' },
      { value: 'regelmaessig', label: 'Regelmäßig' },
    ],
  },
  {
    type: 'choice',
    key: 'vorwissen',
    label: 'Wie viel der gezeigten Inhalte war neu für dich?',
    options: [
      { value: 'allesNeu', label: 'Fast alles war neu' },
      { value: 'vielesNeu', label: 'Vieles war neu' },
      { value: 'teils', label: 'Einiges kannte ich schon' },
      { value: 'wenigNeu', label: 'Das meiste war bekannt' },
    ],
  },
  {
    type: 'choice',
    key: 'kiZukunft',
    label: 'Wie oft planst du in Zukunft, KI beim Coden einzusetzen?',
    options: [
      { value: 'weniger', label: 'Eher weniger' },
      { value: 'gleich', label: 'Wie bisher' },
      { value: 'oefter', label: 'Öfter' },
    ],
  },
  {
    type: 'multichoice',
    key: 'advancedThemen',
    label: 'Welche Themen würden dich in einer Advanced-Schulung interessieren?',
    options: [
      { value: 'agents', label: 'AI-Agents im Softwareprojekt' },
      { value: 'prompting', label: 'Prompt Engineering für Entwickler' },
      { value: 'reviews', label: 'AI-gestützte Code Reviews & QA' },
      { value: 'rag', label: 'RAG & Wissensmanagement' },
      { value: 'cicd', label: 'AI in der CI/CD-Pipeline' },
      { value: 'fullstack', label: 'Fullstack-Feature mit AI umsetzen' },
      { value: 'mcp', label: 'MCP-Server & Tool-Integration' },
    ],
  },
  {
    type: 'text',
    key: 'highlight',
    label: 'Was nimmst du heute als Wichtigstes mit?',
    placeholder: 'Deine wichtigste Erkenntnis...',
  },
  {
    type: 'text',
    key: 'verbesserung',
    label: 'Was sollten wir beim nächsten Mal besser machen?',
    placeholder: 'Deine Verbesserungsvorschläge...',
  },
];

// ─── Komponente ─────────────────────────────────────────────────────

@Component({
  selector: 'app-feedback-form',
  imports: [FormsModule],
  templateUrl: './feedback-form.component.html',
  styleUrl: './feedback-form.component.scss',
})
export class FeedbackFormComponent {
  // Google Apps Script Web App URL – nach Deployment hier eintragen
  private readonly GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxA6hGsevrLXP3CVG9yf4sRoUTqxrnipO5gZkVwfW09lX3ab6Bxyf0gS6hNujAkKybT/exec';

  readonly config = FEEDBACK_CONFIG;
  readonly questions = QUESTIONS;

  answers: Record<string, string | number> = {};
  multiAnswers: Record<string, string[]> = {};
  hoveredStar: Record<string, number> = {};

  submitted = signal(false);
  submitting = signal(false);
  error = signal('');

  toggleMultiChoice(key: string, value: string): void {
    if (!this.multiAnswers[key]) this.multiAnswers[key] = [];
    const idx = this.multiAnswers[key].indexOf(value);
    if (idx >= 0) {
      this.multiAnswers[key].splice(idx, 1);
    } else {
      this.multiAnswers[key].push(value);
    }
  }

  isMultiSelected(key: string, value: string): boolean {
    return this.multiAnswers[key]?.includes(value) ?? false;
  }

  setRating(key: string, value: number): void {
    this.answers[key] = value;
  }

  hoverStar(key: string, value: number): void {
    this.hoveredStar[key] = value;
  }

  resetHover(key: string): void {
    this.hoveredStar[key] = 0;
  }

  getStarClass(key: string, index: number): string {
    const hovered = this.hoveredStar[key] || 0;
    const current = (this.answers[key] as number) || 0;
    if (hovered >= index) return 'star active';
    if (!hovered && current >= index) return 'star active';
    return 'star';
  }

  getStarLabel(question: StarQuestion): string {
    const value = this.answers[question.key] as number;
    return value ? question.labels[value] || '' : '';
  }

  async submitFeedback(): Promise<void> {
    const starQuestions = this.questions.filter((q) => q.type === 'stars');
    const unanswered = starQuestions.filter((q) => !this.answers[q.key]);

    if (unanswered.length > 0) {
      this.error.set('Bitte bewerte alle Sterne-Fragen.');
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    const now = new Date();
    const schulungsDatum = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`;

    const payload: Record<string, string | number> = {
      timestamp: now.toISOString(),
      schulungsDatum,
    };
    for (const q of this.questions) {
      if (q.type === 'multichoice') {
        payload[q.key] = (this.multiAnswers[q.key] || []).join(', ');
      } else {
        payload[q.key] = this.answers[q.key] || '';
      }
    }

    try {
      await fetch(this.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
      this.submitted.set(true);
    } catch {
      this.error.set('Fehler beim Senden. Bitte versuche es erneut.');
    } finally {
      this.submitting.set(false);
    }
  }
}
