## ADDED Requirements

### Requirement: Provider selection

The system SHALL allow users to select an LLM provider.

#### Scenario: Display available providers
- **WHEN** user opens the model selector
- **THEN** a dropdown shows available providers: OpenAI, Anthropic

#### Scenario: Select provider
- **WHEN** user selects a provider
- **THEN** the model list updates to show models from that provider

### Requirement: Model selection

The system SHALL allow users to select a specific model within a provider.

#### Scenario: Display available models
- **WHEN** a provider is selected
- **THEN** a dropdown shows available models from that provider (e.g., gpt-4o, claude-sonnet-4-20250514)

#### Scenario: Select model
- **WHEN** user selects a model
- **THEN** the selection is saved and used for subsequent chat messages

### Requirement: Model configuration persistence

The system SHALL persist model selection per session.

#### Scenario: Save model selection
- **WHEN** user changes the model
- **THEN** the new model is saved to the current session's configuration

#### Scenario: Restore model on session switch
- **WHEN** user switches to a different session
- **THEN** the model selector shows that session's configured model

### Requirement: Model selector UI

The system SHALL provide a clear, accessible model selector in the chat interface.

#### Scenario: Display current model
- **WHEN** the chat panel is visible
- **THEN** the current model name is displayed in the model selector

#### Scenario: Model selector placement
- **WHEN** user views the chat panel
- **THEN** the model selector is located at the top of the chat panel, next to the session title
