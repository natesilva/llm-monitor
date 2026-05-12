### Requirement: Config loaded via native YAML import
The system SHALL load the YAML configuration file using a dynamic `import()` instead of `Bun.YAML.parse()`. The `import()` call returns the parsed YAML object directly as its default export.

#### Scenario: Successful config loading
- **WHEN** `loadConfigFromYaml()` is called and `config.yaml` exists and is valid YAML
- **THEN** the function imports the file, extracts the default export, applies defaults, validates, and returns an `AppConfig`

#### Scenario: Config file not found
- **WHEN** `loadConfigFromYaml()` is called and the config file does not exist at the configured path
- **THEN** the function throws an error with a message indicating the file was not found and suggesting to copy `config.example.yaml`

#### Scenario: Invalid YAML content
- **WHEN** `loadConfigFromYaml()` is called and the config file contains invalid YAML
- **THEN** the function throws an error indicating the YAML could not be parsed

#### Scenario: Custom config path via env var
- **WHEN** the `CONFIG_PATH` environment variable is set to a valid path
- **THEN** `loadConfigFromYaml()` imports the file at that path instead of the default `config.yaml`
