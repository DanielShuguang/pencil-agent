## ADDED Requirements

### Requirement: Create Agent role

The system SHALL allow users to create Agent role templates.

#### Scenario: Create role with basic info
- **WHEN** user fills in name, description, system prompt and clicks "Save"
- **THEN** system creates a new role template and adds it to the role list

#### Scenario: Create role with model config
- **WHEN** user selects a model (provider + model ID) for the role
- **THEN** system saves the model configuration with the role

#### Scenario: Create role with tool restrictions
- **WHEN** user selects allowed tools for the role
- **THEN** system saves tool restrictions with the role

### Requirement: Edit Agent role

The system SHALL allow users to edit existing role templates.

#### Scenario: Edit role fields
- **WHEN** user modifies any field of an existing role and clicks "Save"
- **THEN** system updates the role template

#### Scenario: Edit built-in role
- **WHEN** user tries to edit a built-in role
- **THEN** system creates a copy with user's modifications

### Requirement: Delete Agent role

The system SHALL allow users to delete custom role templates.

#### Scenario: Delete custom role
- **WHEN** user clicks "Delete" on a custom role and confirms
- **THEN** system removes the role template

#### Scenario: Cannot delete in-use role
- **WHEN** user tries to delete a role that is currently used in a workflow
- **THEN** system shows warning and prevents deletion

### Requirement: List Agent roles

The system SHALL display all available role templates.

#### Scenario: Show role list
- **WHEN** user opens the role manager
- **THEN** system displays all roles with name, description, model info

#### Scenario: Filter roles
- **WHEN** user types in search box
- **THEN** system filters roles by name or description
