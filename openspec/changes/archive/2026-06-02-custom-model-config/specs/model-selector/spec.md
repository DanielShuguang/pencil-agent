## MODIFIED Requirements

### Requirement: Model selector displays custom models
The model selector SHALL display all configured models, including custom providers.

#### Scenario: Show all providers
- **WHEN** user opens the model selector
- **THEN** the dropdown shows all providers (built-in + custom)
- **AND** each provider shows its configured models

#### Scenario: Select custom model
- **WHEN** user selects a model from a custom provider
- **THEN** the system updates the current model
- **AND** the selector shows the selected model name

#### Scenario: Provider grouping
- **WHEN** the model list is displayed
- **THEN** models are grouped by provider
- **AND** each group has a header showing the provider name

### Requirement: Model selector search
The model selector SHALL support searching across all models.

#### Scenario: Search by model name
- **WHEN** user types in the search box
- **THEN** the selector filters models by name or ID
- **AND** shows matching results across all providers

#### Scenario: Search by provider name
- **WHEN** user types a provider name in search
- **THEN** the selector shows all models under that provider
