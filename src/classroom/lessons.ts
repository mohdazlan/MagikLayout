/**
 * Teacher lesson packs.
 *
 * A lesson pack is what makes the product adoptable: a teacher should be able to
 * run a competent 25-minute lesson from this file alone, without reading any
 * other documentation and without a developer in the room. So each pack carries
 * the learning outcome, the NOSS mapping, a timed predict-test-explain-repair
 * arc with what the teacher does and what the learner does at each step, an exit
 * ticket with the cues that count as understanding, and differentiation for both
 * ends of a mixed-ability class.
 *
 * Everything student-facing is bilingual. Everything else — the teacher's own
 * script — is not, because Malaysian TVET teachers read both and translating a
 * teacher note twice is maintenance without benefit.
 *
 * Packs reference existing challenges by id rather than defining new ones. The
 * Challenges surface already holds the graded practice; a lesson pack sequences
 * it, and no pack may point at a challenge that does not exist (asserted below
 * in the tests).
 */
import type { MisconceptionCode } from '../coach/misconceptions'

export interface Bilingual {
  en: string
  ms: string
}

export interface LessonPhase {
  /** Minute offset within the lesson, e.g. "0:00–4:00". */
  time: string
  name: string
  /** What the teacher says or does. */
  teacher: string
  /** What the learner does — the observable activity, not a mood. */
  learner: string
  /** What a visitor to the room would see as evidence this phase happened. */
  evidence: string
}

export interface ExitTicketItem {
  prompt: Bilingual
  /** Phrases that indicate understanding. Not a mark scheme — a cue for a busy teacher. */
  lookFor: string[]
}

export interface VideoBeat {
  time: string
  sequence: string
  onScreen: string
}

export interface LessonPack {
  id: string
  title: Bilingual
  /** One measurable competency, in the NOSS sense. */
  learningOutcome: Bilingual
  noss: {
    /** Competency unit code. */
    unit: string
    /** Level and programme name. */
    programme: string
    workActivity: string
  }
  durationMinutes: number
  /** The misconception this lesson is built to surface and repair. */
  misconception: MisconceptionCode
  /** The hook that makes the misconception visible in the first twenty seconds. */
  hook: Bilingual
  priorKnowledge: string[]
  phases: LessonPhase[]
  exitTicket: ExitTicketItem[]
  differentiation: {
    support: string[]
    extension: string[]
  }
  /** Challenge ids in the Challenges surface, in the order the pack uses them. */
  practiceChallengeIds: string[]
  transferChallengeIds: string[]
  /** The competition video arc — kept with the lesson so the two cannot drift apart. */
  videoArc: VideoBeat[]
  /** What the teacher needs in the room. */
  materials: string[]
  version: string
  reviewer: string
}

export const BORDER_LAYOUT_SOUTH_LESSON: LessonPack = {
  id: 'bl-south-collision',
  title: {
    en: 'Repair the invisible BorderLayout bug',
    ms: 'Baiki pepijat BorderLayout yang tidak kelihatan',
  },
  learningOutcome: {
    en: 'By the end of this lesson, learners diagnose why two components collide in BorderLayout.SOUTH and repair the interface using a nested JPanel with FlowLayout, using no more than one AI-generated hint.',
    ms: 'Pada akhir pelajaran ini, pelajar mendiagnos sebab dua komponen berlanggar di BorderLayout.SOUTH dan membaiki antara muka menggunakan JPanel bersarang dengan FlowLayout, dengan tidak lebih daripada satu petunjuk yang dijana AI.',
  },
  noss: {
    unit: 'IT-010-3:2016-C01',
    programme: 'IT-010-3:2016 — Pembangunan Aplikasi, Tahap 3',
    workActivity: 'Implement application prototype mock-up flow',
  },
  durationMinutes: 25,
  misconception: 'BL-SOUTH-COLLISION',
  hook: {
    en: 'Add two buttons to the bottom of the frame. Run it. One of them is gone — and the code compiled without a single error.',
    ms: 'Tambah dua butang di bahagian bawah bingkai. Jalankannya. Satu daripadanya hilang — dan kod itu dikompil tanpa satu ralat pun.',
  },
  priorKnowledge: [
    'Can create a JFrame and add a single component to it.',
    'Knows that a JButton and a JLabel are components.',
    'Has seen BorderLayout named, even if the five regions are not yet secure.',
  ],
  phases: [
    {
      time: '0:00–3:00',
      name: 'Hook — the disappearing button',
      teacher: 'Project the Playground. Add a Save button to SOUTH, then add a Cancel button to SOUTH. Say nothing about why. Ask: "How many buttons did I write? How many can you see?"',
      learner: 'Watches, counts, and states the contradiction out loud.',
      evidence: 'The class can articulate that the code is error-free and a component is still missing.',
    },
    {
      time: '3:00–6:00',
      name: 'Predict',
      teacher: 'Before revealing anything, ask every learner to write one sentence: where did the first button go, and why?',
      learner: 'Writes a prediction. No discussion yet — the commitment is the point.',
      evidence: 'Every learner has a written prediction to compare against later. Collect a show of hands on the two or three most common answers.',
    },
    {
      time: '6:00–11:00',
      name: 'Test',
      teacher: 'Open the Challenges surface and run the same construction. Show the generated Java beside the canvas so the code and the result are visibly the same artefact.',
      learner: 'Builds the failing version themselves and runs the check.',
      evidence: 'Each learner has seen the engine fail their own build, not the teacher\'s.',
    },
    {
      time: '11:00–15:00',
      name: 'Explain — engine first, coach second',
      teacher: 'Read the engine\'s finding aloud: the region holds two components and Swing lays out only the last. THEN ask the coach for one hint and show which approved source it came from. Name the rule: the engine decides what is wrong, the coach only explains it.',
      learner: 'Compares the finding against their own prediction from phase 2.',
      evidence: 'Learners can point to which of their predictions was right and which was not.',
    },
    {
      time: '15:00–21:00',
      name: 'Repair',
      teacher: 'Set the repair task and stay quiet. Resist demonstrating; the ladder is there so learners get a nudge before they get a rule.',
      learner: 'Groups the two buttons into a nested JPanel and adds that panel to SOUTH, then re-runs the check until it passes.',
      evidence: 'A passing check per learner, plus the generated Java showing one component in SOUTH.',
    },
    {
      time: '21:00–24:00',
      name: 'Verify by resizing',
      teacher: 'Ask learners to resize the frame wide and narrow. Ask what stayed the same and what changed.',
      learner: 'Resizes and observes that both buttons stay visible and the row keeps its height.',
      evidence: 'Learners state that SOUTH keeps its preferred height and stretches to the full width.',
    },
    {
      time: '24:00–25:00',
      name: 'Exit ticket',
      teacher: 'Collect the exit ticket. Do not accept "I added a JPanel" as an explanation — press for why that fixes it.',
      learner: 'Answers both exit-ticket questions in their own words.',
      evidence: 'A written explanation per learner, gradeable against the cues below.',
    },
  ],
  exitTicket: [
    {
      prompt: {
        en: 'Your code compiled with no errors, but one of your two SOUTH buttons is invisible. Explain why, without using the word "bug".',
        ms: 'Kod anda dikompil tanpa ralat, tetapi satu daripada dua butang SOUTH anda tidak kelihatan. Terangkan sebabnya, tanpa menggunakan perkataan "pepijat".',
      },
      lookFor: [
        'names SOUTH as a single slot or region rather than a row',
        'says the later add replaced the earlier one',
        'says the hidden component was never given a size or position',
      ],
    },
    {
      prompt: {
        en: 'You fixed it by putting both buttons in a nested JPanel. Why does that satisfy BorderLayout instead of fighting it?',
        ms: 'Anda membaikinya dengan meletakkan kedua-dua butang dalam JPanel bersarang. Mengapakah itu memenuhi BorderLayout dan bukannya melawannya?',
      },
      lookFor: [
        'says the region now receives one component',
        'says the JPanel is a container with its own layout manager',
        'says FlowLayout arranges the two buttons inside the panel',
      ],
    },
  ],
  differentiation: {
    support: [
      'Pair the learner with the Playground open beside the challenge so they can try a region and see it immediately.',
      'Allow a level-2 hint straight away; the concept reminder is the scaffold, not the answer.',
      'Offer the Bahasa Malaysia hint language — the Swing terminology stays in English either way, so nothing is lost.',
    ],
    extension: [
      'Ask for a second repair that uses GridLayout inside the nested panel, then to justify which manager suits a button row better.',
      'Set the transfer challenge below, where the same nesting idea is needed in NORTH rather than SOUTH.',
      'Ask the learner to predict, before resizing, which of the two buttons moves further — and to explain the answer using the CENTER expansion rule.',
    ],
  },
  practiceChallengeIds: ['parsons-confirm-bar'],
  transferChallengeIds: ['reverse-search-bar', 'reflow-canteen-south'],
  videoArc: [
    { time: '0:00–0:20', sequence: 'Hook: the second SOUTH button disappears.', onScreen: 'The visible misconception and the question.' },
    { time: '0:20–0:40', sequence: 'State the learning outcome.', onScreen: 'One measurable competency.' },
    { time: '0:40–1:15', sequence: 'Explain the five BorderLayout regions.', onScreen: 'CENTER expansion and the one-per-region rule.' },
    { time: '1:15–1:50', sequence: 'Learner prediction.', onScreen: 'Pause prompt and response cue.' },
    { time: '1:50–2:20', sequence: 'Test the wrong construction.', onScreen: 'Faithful render beside the generated Java.' },
    { time: '2:20–2:55', sequence: 'Engine diagnosis, then the retrieved hint.', onScreen: 'The finding, the source id, and the short hint.' },
    { time: '2:55–3:35', sequence: 'Repair with a nested JPanel on FlowLayout.', onScreen: 'Action-to-code transformation.' },
    { time: '3:35–3:55', sequence: 'Resize and verify.', onScreen: 'Both buttons remain; the engine confirms.' },
    { time: '3:55–4:15', sequence: 'Exit ticket and closure.', onScreen: 'A learner explains the rule in their own words.' },
  ],
  materials: [
    'A projector or shared screen for the hook.',
    'One browser per learner or per pair — no IDE, no installation.',
    'The class session code written on the board.',
    'Printed exit tickets, or a shared form.',
  ],
  version: 'v1.0',
  reviewer: 'MAA',
}

export const LESSON_PACKS: LessonPack[] = [BORDER_LAYOUT_SOUTH_LESSON]

export function findLessonPack(id: string): LessonPack | undefined {
  return LESSON_PACKS.find((pack) => pack.id === id)
}
