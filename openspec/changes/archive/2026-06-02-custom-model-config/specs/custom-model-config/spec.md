## ADDED Requirements

### Requirement: Custom model provider management
The system SHALL allow users to add, edit, and delete custom model providers.

#### Scenario: Add a new provider
- **WHEN** user clicks "Add Provider" in model settings
- **THEN** system shows a form with fields: name, base URL, API key
- **WHEN** user fills in the form and saves
- **THEN** the new provider is added to the provider list

#### Scenario: Edit a provider
- **WHEN** user selects a provider and clicks "Edit"
- **THEN** system shows the provider form with existing values
- **WHEN** user modifies and saves
- **THEN** the provider configuration is updated

#### Scenario: Delete a provider
- **WHEN** user selects a provider and clicks "Delete"
- **THEN** system asks for confirmation
- **WHEN** user confirms
- **THEN** the provider and its models are removed

### Requirement: Custom model management
The system SHALL allow users to add, edit, and delete models under a provider.

#### Scenario: Add a model to provider
- **WHEN** user clicks "Add Model" under a provider
- **THEN** system shows a form with fields: model ID, display name, max tokens, temperature
- **WHEN** user fills in the form and saves
- **THEN** the new model is added to the provider's model list

#### Scenario: Edit a model
- **WHEN** user selects a model and clicks "Edit"
- **THEN** system shows the model form with existing values
- **WHEN** user modifies and saves
- **THEN** the model configuration is updated

#### Scenario: Delete a model
- **WHEN** user selects a model and clicks "Delete"
- **THEN** the model is removed from the provider's model list

### Requirement: Configuration persistence
The system SHALL persist model configurations to local storage.

#### Scenario: Save configuration
- **WHEN** user saves model configuration
- **THEN** the configuration is stored using electron-store

#### Scenario: Load configuration on startup
- **WHEN** the application starts
- **THEN** the system loads saved model configurations
- **AND** merges them with built-in providers (OpenAI, Anthropic)
