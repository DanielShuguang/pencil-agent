## ADDED Requirements

### Requirement: AlertDialog component

The system SHALL provide a reusable AlertDialog component for confirmation dialogs.

#### Scenario: Show confirmation dialog
- **WHEN** developer renders `<AlertDialog>` with `open={true}`
- **THEN** a modal overlay appears with title, description, and action buttons

#### Scenario: Confirm action
- **WHEN** user clicks the confirm button
- **THEN** the `onConfirm` callback is triggered
- **AND** the dialog closes

#### Scenario: Cancel action
- **WHEN** user clicks the cancel button or presses Escape
- **THEN** the `onCancel` callback is triggered
- **AND** the dialog closes

### Requirement: Dialog component

The system SHALL provide a reusable Dialog component for general-purpose modals.

#### Scenario: Show dialog
- **WHEN** developer renders `<Dialog>` with `open={true}`
- **THEN** a modal overlay appears with title, content, and close button

#### Scenario: Close dialog
- **WHEN** user clicks the close button or presses Escape
- **THEN** the `onOpenChange(false)` callback is triggered
- **AND** the dialog closes

### Requirement: Replace native confirm in ModelConfigPanel

The system SHALL replace all native `confirm()` calls in ModelConfigPanel with AlertDialog.

#### Scenario: Delete provider confirmation
- **WHEN** user clicks delete on a provider
- **THEN** an AlertDialog appears asking "确定删除此 Provider？"
- **AND** confirming deletes the provider
- **AND** cancelling closes the dialog without action

#### Scenario: Delete model confirmation
- **WHEN** user clicks delete on a model
- **THEN** an AlertDialog appears asking "确定删除此模型？"
- **AND** confirming deletes the model
- **AND** cancelling closes the dialog without action

### Requirement: Replace native alert in WorkflowToolbar

The system SHALL replace all native `alert()` calls in WorkflowToolbar with AlertDialog.

#### Scenario: Invalid workflow file error
- **WHEN** user imports a workflow file that fails to parse
- **THEN** an AlertDialog appears showing the error message
- **AND** clicking confirm closes the dialog
