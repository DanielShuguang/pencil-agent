## ADDED Requirements

### Requirement: Sandbox executes code in isolated environment
The system SHALL execute user/agent code in isolated environments with resource limits.

#### Scenario: Execute JavaScript code
- **WHEN** sandbox receives execute request with `language: 'javascript'`
- **THEN** system runs code via child_process and returns stdout/stderr/exitCode

#### Scenario: Execute Python code
- **WHEN** sandbox receives execute request with `language: 'python'`
- **THEN** system runs code via child_process and returns stdout/stderr/exitCode

#### Scenario: Execute TypeScript code
- **WHEN** sandbox receives execute request with `language: 'typescript'`
- **THEN** system runs code via tsx and returns stdout/stderr/exitCode

#### Scenario: Execute Bash script
- **WHEN** sandbox receives execute request with `language: 'bash'`
- **THEN** system runs code via bash and returns stdout/stderr/exitCode

### Requirement: Sandbox enforces execution timeout
The system SHALL terminate execution after specified timeout.

#### Scenario: Code exceeds timeout
- **WHEN** code execution exceeds timeout (default 30s)
- **THEN** system kills process and returns error with exit code

### Requirement: Sandbox streams output in real-time
The system SHALL send stdout/stderr chunks to renderer as they are produced.

#### Scenario: Real-time output streaming
- **WHEN** code produces stdout output
- **THEN** system sends `sandbox:output` IPC events with type 'stdout' and content

#### Scenario: Error output streaming
- **WHEN** code produces stderr output
- **THEN** system sends `sandbox:output` IPC events with type 'stderr' and content

### Requirement: Docker sandbox provides high isolation
The system SHALL support Docker-based execution with network isolation and resource limits.

#### Scenario: Docker execution with network isolation
- **WHEN** Docker sandbox executes code
- **THEN** container has `NetworkMode: 'none'` (no network access)

#### Scenario: Docker execution with memory limit
- **WHEN** Docker sandbox executes code
- **THEN** container has 256MB memory limit

#### Scenario: Docker not available gracefully degrades
- **WHEN** Docker is not installed or unavailable
- **THEN** system falls back to child_process mode with warning

### Requirement: Sandbox can be stopped
The system SHALL allow stopping running sandbox executions.

#### Scenario: Stop running execution
- **WHEN** user calls `sandbox:stop` with execution ID
- **THEN** system kills the running process/container

### Requirement: Terminal panel displays sandbox output
The system SHALL render sandbox output in a terminal-like UI component.

#### Scenario: Terminal shows streaming output
- **WHEN** sandbox produces output events
- **THEN** TerminalPanel appends output lines with stdout/stderr styling

#### Scenario: Terminal shows exit code
- **WHEN** sandbox execution completes
- **THEN** TerminalPanel displays exit code (green for 0, red for non-zero)
