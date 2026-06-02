## ADDED Requirements

### Requirement: Support Anthropic Claude models
The system SHALL support Anthropic Claude models via pi-ai provider.

#### Scenario: Create session with Claude model
- **WHEN** user creates a session with `{ id: 'claude-sonnet-4-20250514', provider: 'anthropic' }`
- **THEN** system initializes pi-ai with Anthropic provider and ANTHROPIC_API_KEY

#### Scenario: Stream Claude response
- **WHEN** user sends a message to a Claude session
- **THEN** system streams the response from Anthropic API

### Requirement: Support OpenAI models
The system SHALL support OpenAI models via pi-ai provider.

#### Scenario: Create session with GPT model
- **WHEN** user creates a session with `{ id: 'gpt-4o', provider: 'openai' }`
- **THEN** system initializes pi-ai with OpenAI provider and OPENAI_API_KEY

#### Scenario: Stream GPT response
- **WHEN** user sends a message to a GPT session
- **THEN** system streams the response from OpenAI API

### Requirement: Read API keys from environment
The system SHALL read API keys from environment variables.

#### Scenario: Anthropic API key available
- **WHEN** ANTHROPIC_API_KEY environment variable is set
- **THEN** system uses it for Anthropic provider authentication

#### Scenario: OpenAI API key available
- **WHEN** OPENAI_API_KEY environment variable is set
- **THEN** system uses it for OpenAI provider authentication

#### Scenario: Missing API key
- **WHEN** required API key environment variable is not set
- **THEN** system throws an error indicating the missing key

### Requirement: Default model configuration
The system SHALL use a default model when none is specified.

#### Scenario: Default model used
- **WHEN** user creates a session without specifying a model
- **THEN** system uses `{ id: 'claude-sonnet-4-20250514', provider: 'anthropic' }` as default
