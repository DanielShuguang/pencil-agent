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

### Requirement: API Key display

The system SHALL display masked API keys in the settings interface, showing only partial characters for verification while maintaining security.

#### Scenario: Display masked API Key in ApiKeyForm
- **WHEN** an API Key is saved for a provider
- **THEN** the ApiKeyForm displays the masked key (first 4 characters + `***` + last 4 characters) instead of "已保存" text

#### Scenario: Display masked API Key in ProviderForm
- **WHEN** editing an existing provider configuration
- **THEN** the ProviderForm displays the masked API key in the input field
- **AND** allows the user to modify the key directly

#### Scenario: Mask API Key format
- **WHEN** masking an API key
- **THEN** the system uses the format: first 4 characters + `***` + last 4 characters
- **AND** for keys with length ≤ 8 characters, replaces all characters with `*`

### Requirement: API Key retrieval for display

The system SHALL provide masked API keys to the frontend without exposing the actual key.

#### Scenario: Get masked API Key
- **WHEN** the frontend requests a masked API key for display
- **THEN** the main process returns the masked version using the mask format
- **AND** the actual API key is never sent to the frontend

#### Scenario: Masked key retrieval failure
- **WHEN** the system fails to retrieve or mask the API key
- **THEN** the system returns null and displays an error message

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
