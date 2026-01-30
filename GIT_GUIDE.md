# 🚀 Git Guide - Quick Reference

## ✅ Your Repository

**Repository URL:** https://github.com/chahatbegmal20/Swappy

**Username:** chahatbegmal20  
**Email:** chahatbegmal@gmail.com

---

## 📋 Common Git Commands

### **Check Status**
```bash
git status
```
Shows modified files, staged files, and branch info.

### **Add Files to Stage**
```bash
# Add all files
git add .

# Add specific file
git add filename.js

# Add all markdown files
git add *.md
```

### **Commit Changes**
```bash
# With message
git commit -m "Your commit message here"

# Add and commit in one step
git commit -am "Your message"
```

### **Push to GitHub**
```bash
# Push to main branch
git push origin main

# Force push (use carefully!)
git push origin main --force
```

### **Pull from GitHub**
```bash
# Pull and merge
git pull origin main

# Pull and rebase (cleaner history)
git pull origin main --rebase
```

---

## 🔄 Typical Workflow

### **1. Make Changes to Your Code**
Edit files, create new files, etc.

### **2. Check What Changed**
```bash
git status
```

### **3. Stage Your Changes**
```bash
git add .
```

### **4. Commit Your Changes**
```bash
git commit -m "Describe what you changed"
```

### **5. Push to GitHub**
```bash
git push origin main
```

---

## 🆘 Common Issues & Solutions

### **Issue: "Your branch is behind"**
**Solution:**
```bash
git pull origin main --rebase
git push origin main
```

### **Issue: "Failed to push - rejected"**
**Solution:**
```bash
# Pull first, then push
git pull origin main
git push origin main
```

### **Issue: "Merge conflicts"**
**Solution:**
1. Open conflicting files
2. Look for `<<<<<<<`, `=======`, `>>>>>>>` markers
3. Choose which code to keep
4. Remove conflict markers
5. Save file
6. Run:
```bash
git add .
git commit -m "Resolved merge conflict"
git push origin main
```

### **Issue: Changed username/credentials**
**Solution:**
```bash
# Update Git config
git config --global user.name "your-new-username"
git config --global user.email "your-email@example.com"

# Update remote URL if username changed
git remote set-url origin https://github.com/new-username/repo-name.git

# Clear cached credentials (Windows)
git credential-manager-core erase
```

### **Issue: "credential-manager-core" warning**
This warning is harmless. It means Git Credential Manager needs updating.

**To fix (optional):**
```bash
# Install Git Credential Manager
# Download from: https://github.com/GitCredentialManager/git-credential-manager/releases
```

Or ignore it - it doesn't affect push/pull operations!

---

## 📦 Quick Commands Reference

```bash
# Initialize Git in a folder
git init

# Clone a repository
git clone https://github.com/username/repo.git

# Check remote URLs
git remote -v

# Change remote URL
git remote set-url origin https://github.com/username/new-repo.git

# View commit history
git log
git log --oneline -10  # Last 10 commits, one line each

# Create new branch
git checkout -b feature-branch

# Switch branches
git checkout main

# Merge branch
git merge feature-branch

# Delete branch
git branch -d feature-branch

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard local changes
git checkout -- filename.js
git reset --hard HEAD  # Discard ALL changes (careful!)

# View changes
git diff              # Unstaged changes
git diff --staged     # Staged changes
```

---

## 🔐 Authentication

### **HTTPS Authentication (What you're using)**
- Uses username and password/token
- Prompted for credentials when pushing

### **To avoid typing password every time:**

**Option 1: Use Personal Access Token**
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scopes: `repo` (full control)
4. Copy token (save it somewhere safe!)
5. Use token as password when pushing

**Option 2: Cache credentials**
```bash
# Cache for 1 hour (3600 seconds)
git config --global credential.helper cache

# Cache for 1 week
git config --global credential.helper 'cache --timeout=604800'
```

**Option 3: Use SSH (more secure)**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key to GitHub
# Settings → SSH and GPG keys → New SSH key

# Change remote to SSH
git remote set-url origin git@github.com:username/repo.git
```

---

## 🌿 Branching Strategy

### **Main Branch**
- `main` - Production-ready code
- Always keep this stable

### **Feature Branches**
```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# Work on feature, commit changes
git add .
git commit -m "Add new feature"

# Push feature branch
git push origin feature/new-feature

# Merge to main
git checkout main
git merge feature/new-feature
git push origin main

# Delete feature branch
git branch -d feature/new-feature
```

---

## 🎯 Best Practices

### **1. Commit Messages**
Good:
- ✅ `Add user authentication`
- ✅ `Fix login button styling`
- ✅ `Update README with setup instructions`

Bad:
- ❌ `update`
- ❌ `fix stuff`
- ❌ `asdfasdf`

### **2. Commit Frequency**
- Commit often (but logically)
- Each commit should be a complete, working state
- Don't commit broken code to main

### **3. Before Pushing**
- Test your code
- Check what you're committing: `git status`, `git diff`
- Write a clear commit message

### **4. Files to Ignore**
Already in `.gitignore`:
```
node_modules/
.next/
.env.local
.DS_Store
*.log
```

---

## 📊 Visual Workflow

```
Local Machine:
  Working Directory
       ↓ (git add)
  Staging Area
       ↓ (git commit)
  Local Repository
       ↓ (git push)
  
GitHub:
  Remote Repository

  Remote Repository
       ↓ (git pull)
  Local Repository
```

---

## 🚀 Quick Start for New Projects

```bash
# 1. Create repository on GitHub
# 2. Initialize locally
git init

# 3. Add remote
git remote add origin https://github.com/username/repo.git

# 4. Create initial commit
git add .
git commit -m "Initial commit"

# 5. Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🔧 Advanced Commands

### **Stash Changes (temporarily save)**
```bash
# Save current changes
git stash

# List stashes
git stash list

# Apply last stash
git stash apply

# Apply and remove from stash list
git stash pop
```

### **Cherry-pick (copy specific commit)**
```bash
git cherry-pick <commit-hash>
```

### **Rebase**
```bash
# Rebase current branch onto main
git rebase main

# Interactive rebase (combine commits, edit messages)
git rebase -i HEAD~3  # Last 3 commits
```

### **Tags (for releases)**
```bash
# Create tag
git tag v1.0.0

# Push tag
git push origin v1.0.0

# List tags
git tag
```

---

## 📞 Need Help?

### **Git Help**
```bash
# General help
git help

# Command-specific help
git help commit
git help push
```

### **GitHub Docs**
https://docs.github.com/

### **Git Documentation**
https://git-scm.com/doc

---

## ✅ Your Current Setup

```
Repository: https://github.com/chahatbegmal20/Swappy
Username: chahatbegmal20
Email: chahatbegmal@gmail.com
Default Branch: main
Status: ✅ Everything pushed successfully
```

---

## 🎉 You're All Set!

You can now:
- ✅ Make changes to your code
- ✅ Commit them
- ✅ Push to GitHub
- ✅ Share your work with others

**Keep coding!** 🚀

---

*Last updated: After successful push on Jan 11, 2026*



