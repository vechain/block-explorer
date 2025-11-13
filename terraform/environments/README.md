# Environment Configurations

This directory contains environment-specific configuration files for different workspaces.

## Structure

```
environments/
├── production/
│   ├── backend.config      # S3 backend configuration for production
│   └── production.yaml     # Environment variables and settings
└── preview/
    ├── backend.config      # S3 backend configuration for previews
    └── preview.yaml.example # Template for preview environments
```

## Production Environment

The production environment configuration is static and committed to the repository.

- **Workspace**: `production`
- **Backend**: Uses production S3 bucket
- **Domain**: `block-explorer-prod.vechain.org`
- **Scaling**: min_size=1 (always warm, no cold starts)

## Preview Environments

Preview environments are ephemeral and created dynamically by GitHub Actions.

- **Workspace**: `preview-pr-{number}` (e.g., `preview-pr-123`)
- **Backend**: Uses non-prod S3 bucket (all previews share the same bucket but different workspace states)
- **Domain**: `pr-{number}.block-explorer-preview.vechain.org`
- **Scaling**: min_size=0 (scale to zero when idle)

### Creating Preview Config

GitHub Actions will:
1. Copy `preview.yaml.example`
2. Create `preview/preview-pr-{number}.yaml`
3. Replace `{PR_NUMBER}` with the actual PR number
4. Update `image_tag` with the built image tag

Example for PR #123:
```yaml
environment: preview-pr-123
domain: pr-123.block-explorer-preview.vechain.org
image_tag: pr-123
# ... rest of config
```

## Configuration Fields

### Required Fields

- `environment` - Environment name (must match workspace name)
- `region` - AWS region
- `domain` - Custom domain for the service
- `enable_custom_domain` - Whether to configure custom domain
- `image_tag` - Docker image tag to deploy
- `cpu` - CPU units (256, 512, 1024, 2048, 4096)
- `memory` - Memory in MB (512-12288)
- `port` - Container port
- `min_size` - Minimum instances (0 or 1+)
- `max_size` - Maximum instances
- `max_concurrency` - Concurrent requests per instance
- `health_check_path` - Health check endpoint
- `node_env` - Node.js environment

### Optional Fields

- `environment_variables` - Map of additional env vars for the application

