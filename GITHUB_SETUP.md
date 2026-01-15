
# GitHub Setup Instructions

Follow these steps to push this project to GitHub and connect it to your new Natively project.

## Step 1: Create a New GitHub Repository

1. Go to [github.com](https://github.com) and log in
2. Click the "+" icon in the top right → "New repository"
3. Repository settings:
   - **Name**: `SmallFarm-Copilot` (or your preferred name)
   - **Description**: "AI-powered farm management app for small farms and homesteads"
   - **Visibility**: Private (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click "Create repository"

## Step 2: Initialize Git and Push to GitHub

Open your terminal in the project directory and run:

```bash
# Initialize git repository (if not already initialized)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Complete SmallFarm Copilot export"

# Add your GitHub repository as remote
# Replace YOUR_USERNAME and YOUR_REPO with your actual values
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Alternative: Using SSH

If you prefer SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Step 3: Verify Upload

1. Go to your GitHub repository URL
2. Verify all files are present:
   - ✅ `app/` folder with all screens
   - ✅ `components/` folder
   - ✅ `contexts/` folder
   - ✅ `data/` folder
   - ✅ `lib/` folder
   - ✅ Configuration files (package.json, app.json, etc.)
   - ✅ README.md and documentation

## Step 4: Connect to New Natively Project

### Option A: Import via Natively Dashboard

1. Go to your new Natively project
2. Look for "Import from GitHub" or "Connect Repository" option
3. Authorize Natively to access your GitHub account
4. Select the `SmallFarm-Copilot` repository
5. Natively will automatically:
   - Clone the repository
   - Install dependencies
   - Set up the development environment
   - Sync all files

### Option B: Manual Clone (if needed)

If Natively doesn't have direct GitHub integration:

1. In your new Natively project, use the terminal/console
2. Clone your repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   npm install
   ```

## Step 5: Environment Setup in New Project

1. Create `.env` file with your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. Verify all dependencies installed:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Step 6: Verify Everything Works

Test these key features:
- ✅ App launches without errors
- ✅ Navigation works (tabs, screens)
- ✅ Supabase connection works
- ✅ Authentication flow works
- ✅ Data loads from database
- ✅ All screens render correctly

## Troubleshooting

### Issue: "Permission denied" when pushing

**Solution**: Set up SSH keys or use personal access token
```bash
# Use personal access token as password when prompted
# Or set up SSH: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```

### Issue: "Repository not found"

**Solution**: Verify the repository URL is correct
```bash
git remote -v  # Check current remote
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### Issue: Files not showing in GitHub

**Solution**: Check .gitignore isn't excluding important files
```bash
git status  # See what's being tracked
git add -f <file>  # Force add if needed
```

### Issue: Merge conflicts

**Solution**: If repository was initialized with files
```bash
git pull origin main --allow-unrelated-histories
# Resolve any conflicts
git push origin main
```

## Next Steps

After successful GitHub push and Natively import:

1. **Configure Secrets**: Add environment variables in Natively project settings
2. **Test Build**: Run a development build to ensure everything compiles
3. **Database Setup**: Verify Supabase tables and data are accessible
4. **Deploy**: When ready, build for iOS/Android app stores

## Useful Git Commands

```bash
# Check status
git status

# View commit history
git log --oneline

# Create a new branch
git checkout -b feature/new-feature

# Push branch to GitHub
git push origin feature/new-feature

# Pull latest changes
git pull origin main

# View remote repositories
git remote -v
```

## GitHub Repository Settings (Recommended)

1. **Branch Protection**: Protect `main` branch from force pushes
2. **Collaborators**: Add team members if needed
3. **Secrets**: Store sensitive data in GitHub Secrets (for CI/CD)
4. **Actions**: Set up GitHub Actions for automated testing (optional)

---

**Need Help?**
- GitHub Docs: https://docs.github.com
- Natively Support: https://natively.dev/support
- Git Basics: https://git-scm.com/doc
