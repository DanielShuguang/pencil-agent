## ADDED Requirements

### Requirement: API Key input

The system SHALL allow users to securely input and save API keys for each provider.

#### Scenario: Open API Key settings
- **WHEN** user clicks "API Keys" in settings or model selector
- **THEN** a settings dialog opens showing API Key input fields for each provider

#### Scenario: Save API Key
- **WHEN** user enters an API Key and clicks "Save"
- **THEN** the key is encrypted using safeStorage and persisted

#### Scenario: Mask API Key display
- **WHEN** an API Key is saved
- **THEN** the input field shows a masked value (e.g., "sk-...abc") instead of the full key

### Requirement: API Key retrieval

The system SHALL provide saved API Keys to the main process for LLM calls.

#### Scenario: Use saved API Key
- **WHEN** a chat message is sent
- **THEN** the system retrieves the saved API Key for the selected provider and passes it to the LLM

#### Scenario: Missing API Key
- **WHEN** no API Key is saved for the selected provider
- **THEN** the system shows an error message prompting the user to configure the API Key

### Requirement: API Key deletion

The system SHALL allow users to delete saved API Keys.

#### Scenario: Delete API Key
- **WHEN** user clicks "Delete" next to an API Key
- **THEN** the key is removed from storage after confirmation

### Requirement: Settings dialog

The system SHALL provide a settings dialog accessible from the title bar or sidebar.

#### Scenario: Open settings
- **WHEN** user clicks the settings icon in the title bar
- **THEN** a modal dialog opens with API Key management section

#### Scenario: Close settings
- **WHEN** user clicks "Close" or clicks outside the dialog
- **THEN** the dialog closes and changes are preserved
