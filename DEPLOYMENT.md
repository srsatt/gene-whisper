# Deployment Guide

This project is configured to deploy to Cloudflare Pages with R2 storage for static assets.

## Architecture

- **Main App**: Deployed to Cloudflare Pages (`yourdomain.com`)
- **Static Assets**: Served from dedicated subdomain (`static.yourdomain.com`) via Cloudflare Worker
- **Static Data Files**: Stored in R2 bucket (JSON files in `/data/` directory)
- **Model Files**: Stored in R2 bucket (WASM and binary files in `/II-Medical-8B-q4f16_1-MLC/` and `/wasm/` directories)

### Benefits of Static Subdomain:
- **Better CDN caching**: Static assets get aggressive caching (1 year)
- **Parallel downloads**: Browsers can download more files simultaneously
- **Cookie-free requests**: Static assets don't carry unnecessary cookies
- **Optimal performance**: Direct R2 access without main worker overhead

## Setup

### 1. Cloudflare Account Setup

1. Create a Cloudflare account
2. Get your Account ID from the dashboard
3. Create an API token with the following permissions:
   - `Cloudflare Pages:Edit`
   - `Account:Read`
   - `Zone:Read`
   - `Zone:Edit`

### 2. R2 Bucket Setup

Create the following R2 buckets:
- `gene-whisper-static` (production)
- `gene-whisper-static-dev` (development)
- `gene-whisper-static-preview` (preview for production)
- `gene-whisper-static-dev-preview` (preview for development)

### 3. GitHub Secrets

Add the following secrets to your GitHub repository:
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID

### 4. Local Development

Install dependencies:
```bash
npm install
```

Configure wrangler locally:
```bash
npx wrangler login
```

## Deployment

### Automatic Deployment

Push to the `production` branch to trigger automatic deployment:
```bash
git checkout production
git merge main
git push origin production
```

### Manual Deployment

For development environment:
```bash
npm run deploy:dev
```

For production environment:
```bash
npm run deploy
```

### Upload Static Assets to R2

The GitHub Actions workflow automatically uploads static assets, but you can also do it manually:

```bash
# Upload data files
wrangler r2 object put gene-whisper-static --file=public/data --recursive --content-type=application/json --exclude="*.txt" --exclude="*.wasm" --exclude="*.bin"

# Upload text files with correct content type
wrangler r2 object put gene-whisper-static/data/demo_genome.txt --file=public/data/demo_genome.txt --content-type=text/plain

# Upload model files
wrangler r2 object put gene-whisper-static --file=public/II-Medical-8B-q4f16_1-MLC --recursive --content-type=application/octet-stream

# Upload WASM files
wrangler r2 object put gene-whisper-static --file=public/wasm --recursive --content-type=application/wasm
```

## File Structure

```
/data/                     # JSON data files (served from R2)
├── clinvar.json
├── clinvar_description_map.json
├── clinvar_descriptions.json
├── demo_genome.txt
├── mutation_list.json
├── prs_23andme_index_map.json
├── prs_config.json
├── prs_weights.json
├── snp-data-structured.json
├── snp-data.json
└── snpedia.json

/II-Medical-8B-q4f16_1-MLC/ # Model files (served from R2)
├── *.bin files
├── *.json config files
└── tokenizer files

/wasm/                     # WebAssembly files (served from R2)
└── *.wasm files
```

## Environment Variables

The Cloudflare Worker automatically detects the environment and serves files from the appropriate R2 bucket.

## Custom Domain

To use a custom domain:

1. Add your domain to Cloudflare DNS
2. Create DNS records:
   - `A` record for `yourdomain.com` → your Cloudflare Pages
   - `CNAME` record for `static.yourdomain.com` → your static worker
3. Update the `routes` configuration in `wrangler.toml` with your domain
4. Deploy the changes

Example DNS setup:
```
yourdomain.com        A      192.0.2.1 (Cloudflare Pages IP)
static.yourdomain.com CNAME  gene-whisper-static-prod.workers.dev
```

## Troubleshooting

### CORS Issues
The Cloudflare Worker includes CORS headers for all static asset requests.

### Large File Issues
R2 handles large files efficiently. The current setup supports files up to 5GB.

### Cache Issues
Files are served with appropriate ETags for browser caching. Clear your browser cache if you see stale content.
