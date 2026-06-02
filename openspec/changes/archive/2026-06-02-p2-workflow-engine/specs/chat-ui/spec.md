## MODIFIED Requirements

### Requirement: AppShell provides tab navigation
The system SHALL provide tab navigation between Chat, Editor, and Workflow views.

#### Scenario: Switch to workflow view
- **WHEN** user clicks Workflow tab in title bar
- **THEN** system displays WorkflowCanvas with node toolbar and config panel

#### Scenario: Switch to chat view
- **WHEN** user clicks Chat tab in title bar
- **THEN** system displays ChatPanel

#### Scenario: Switch to editor view
- **WHEN** user clicks Editor tab in title bar
- **THEN** system displays EditorPanel with file tree and terminal
