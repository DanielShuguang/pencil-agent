## ADDED Requirements

### Requirement: API format selection

The system SHALL allow users to select the API format (OpenAI or Anthropic) when creating or editing a custom model provider.

#### Scenario: Select OpenAI format
- **WHEN** user creates a new provider with "OpenAI" API format
- **THEN** the provider's `apiFormat` field is set to `'openai'`

#### Scenario: Select Anthropic format
- **WHEN** user creates a new provider with "Anthropic" API format
- **THEN** the provider's `apiFormat` field is set to `'anthropic'`

### Requirement: OpenAI connection test

The system SHALL test OpenAI-format providers using the standard OpenAI API convention.

#### Scenario: Successful OpenAI connection
- **WHEN** user tests connection for an OpenAI-format provider with valid credentials
- **THEN** the system sends `GET {baseUrl}/models` with `Authorization: Bearer {apiKey}` header
- **AND** returns success if the response is HTTP 200

#### Scenario: Failed OpenAI connection
- **WHEN** user tests connection for an OpenAI-format provider with invalid credentials
- **THEN** the system returns an error with the HTTP status code or network error message

### Requirement: Anthropic connection test

The system SHALL test Anthropic-format providers using the Anthropic API convention.

#### Scenario: Successful Anthropic connection
- **WHEN** user tests connection for an Anthropic-format provider with valid credentials
- **THEN** the system sends `GET {baseUrl}/v1/models` with `x-api-key: {apiKey}` header
- **AND** returns success if the response is HTTP 200

#### Scenario: Failed Anthropic connection
- **WHEN** user tests connection for an Anthropic-format provider with invalid credentials
- **THEN** the system returns an error with the HTTP status code or network error message

### Requirement: URL format validation

The system SHALL validate that the provider base URL is a valid HTTP/HTTPS URL.

#### Scenario: Valid URL
- **WHEN** user enters `https://api.openai.com/v1` as base URL
- **THEN** the form accepts the input

#### Scenario: Invalid URL
- **WHEN** user enters `not-a-url` as base URL
- **THEN** the form shows an error message "请输入有效的 URL"

### Requirement: API Key format validation

The system SHALL validate API key format based on the selected API format.

#### Scenario: Valid OpenAI API key
- **WHEN** user enters an API key starting with `sk-` for an OpenAI-format provider
- **THEN** the form accepts the input

#### Scenario: Valid Anthropic API key
- **WHEN** user enters an API key starting with `sk-ant-` for an Anthropic-format provider
- **THEN** the form accepts the input

#### Scenario: Empty API key
- **WHEN** user leaves the API key field empty
- **THEN** the form shows a required field error
