## MODIFIED Requirements

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