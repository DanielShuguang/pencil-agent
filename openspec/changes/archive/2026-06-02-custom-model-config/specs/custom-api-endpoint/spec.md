## ADDED Requirements

### Requirement: Custom API endpoint configuration
The system SHALL allow users to configure custom API endpoints for each provider.

#### Scenario: Configure API endpoint
- **WHEN** user adds or edits a provider
- **THEN** the system shows a "Base URL" field
- **AND** the user can enter a custom API endpoint URL

#### Scenario: OpenAI-compatible API format
- **WHEN** a custom API endpoint is configured
- **THEN** the system uses OpenAI API format for requests
- **AND** sends requests to the configured endpoint

### Requirement: API connection testing
The system SHALL allow users to test the API connection before saving.

#### Scenario: Test connection
- **WHEN** user clicks "Test Connection" button
- **THEN** the system sends a test request to the API endpoint
- **AND** shows success or error message

#### Scenario: Test with API key
- **WHEN** testing connection
- **THEN** the system includes the configured API key in the request
- **AND** validates the key is accepted

### Requirement: API key security
The system SHALL securely store API keys using encryption.

#### Scenario: Encrypt API key
- **WHEN** user saves an API key
- **THEN** the system encrypts the key using safeStorage
- **AND** stores the encrypted value

#### Scenario: Decrypt API key
- **WHEN** the system needs to use the API key
- **THEN** it decrypts the key from storage
- **AND** uses it in API requests
