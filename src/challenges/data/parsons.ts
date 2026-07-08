/**
 * Parsons seed challenges. The magnet array's own order IS the canonical
 * solution — the target render is derived from it, never stored separately.
 * `trayOrder` is a committed shuffle so the tray is stable run to run.
 */
import type { ParsonsChallenge } from '../types'

export const PARSONS_CHALLENGES: ParsonsChallenge[] = [
  {
    id: 'parsons-confirm-bar',
    type: 'parsons',
    title: 'Name prompt with a button row',
    prompt:
      'Build the target: a text field pinned NORTH, and an OK / Cancel row SOUTH. Watch the button order — FlowLayout places components in the order add() is called.',
    difficulty: 'Apply',
    frameSize: { width: 420, height: 240 },
    magnets: [
      {
        id: 'declare-nameField',
        java: 'JTextField nameField = new JTextField(14);',
        stmt: { kind: 'declare', varName: 'nameField', component: { type: 'JTextField', text: '', columns: 14 } },
      },
      {
        id: 'add-nameField',
        java: 'frame.add(nameField, BorderLayout.NORTH);',
        stmt: { kind: 'add', target: 'frame', child: 'nameField', constraint: 'NORTH' },
      },
      {
        id: 'declare-buttonRow',
        java: 'JPanel buttonRow = new JPanel();',
        stmt: { kind: 'declare', varName: 'buttonRow', component: { type: 'JPanel', text: '' } },
      },
      {
        id: 'declare-okButton',
        java: 'JButton okButton = new JButton("OK");',
        stmt: { kind: 'declare', varName: 'okButton', component: { type: 'JButton', text: 'OK' } },
      },
      {
        id: 'add-okButton',
        java: 'buttonRow.add(okButton);',
        stmt: { kind: 'add', target: 'buttonRow', child: 'okButton' },
      },
      {
        id: 'declare-cancelButton',
        java: 'JButton cancelButton = new JButton("Cancel");',
        stmt: { kind: 'declare', varName: 'cancelButton', component: { type: 'JButton', text: 'Cancel' } },
      },
      {
        id: 'add-cancelButton',
        java: 'buttonRow.add(cancelButton);',
        stmt: { kind: 'add', target: 'buttonRow', child: 'cancelButton' },
      },
      {
        id: 'add-buttonRow',
        java: 'frame.add(buttonRow, BorderLayout.SOUTH);',
        stmt: { kind: 'add', target: 'frame', child: 'buttonRow', constraint: 'SOUTH' },
      },
    ],
    trayOrder: [4, 7, 0, 3, 6, 1, 5, 2],
  },
  {
    id: 'parsons-browser-toolbar',
    type: 'parsons',
    title: 'Browser toolbar (setLayout timing)',
    prompt:
      'Build the target toolbar. Careful: a component added BEFORE setLayout(new BorderLayout(…)) is never registered with the new manager — Swing leaves it unsized and invisible.',
    difficulty: 'Analyze',
    frameSize: { width: 480, height: 280 },
    magnets: [
      {
        id: 'declare-toolbar',
        java: 'JPanel toolbar = new JPanel();',
        stmt: { kind: 'declare', varName: 'toolbar', component: { type: 'JPanel', text: '' } },
      },
      {
        id: 'setlayout-toolbar',
        java: 'toolbar.setLayout(new BorderLayout(6, 0));',
        stmt: { kind: 'setLayout', target: 'toolbar', spec: { kind: 'border', hgap: 6, vgap: 0 } },
      },
      {
        id: 'declare-backButton',
        java: 'JButton backButton = new JButton("Back");',
        stmt: { kind: 'declare', varName: 'backButton', component: { type: 'JButton', text: 'Back' } },
      },
      {
        id: 'add-backButton',
        java: 'toolbar.add(backButton, BorderLayout.WEST);',
        stmt: { kind: 'add', target: 'toolbar', child: 'backButton', constraint: 'WEST' },
      },
      {
        id: 'declare-urlField',
        java: 'JTextField urlField = new JTextField(20);',
        stmt: { kind: 'declare', varName: 'urlField', component: { type: 'JTextField', text: '', columns: 20 } },
      },
      {
        id: 'add-urlField',
        java: 'toolbar.add(urlField, BorderLayout.CENTER);',
        stmt: { kind: 'add', target: 'toolbar', child: 'urlField', constraint: 'CENTER' },
      },
      {
        id: 'declare-goButton',
        java: 'JButton goButton = new JButton("Go");',
        stmt: { kind: 'declare', varName: 'goButton', component: { type: 'JButton', text: 'Go' } },
      },
      {
        id: 'add-goButton',
        java: 'toolbar.add(goButton, BorderLayout.EAST);',
        stmt: { kind: 'add', target: 'toolbar', child: 'goButton', constraint: 'EAST' },
      },
      {
        id: 'add-toolbar',
        java: 'frame.add(toolbar, BorderLayout.NORTH);',
        stmt: { kind: 'add', target: 'frame', child: 'toolbar', constraint: 'NORTH' },
      },
    ],
    trayOrder: [3, 8, 1, 5, 0, 7, 2, 6, 4],
  },
]
