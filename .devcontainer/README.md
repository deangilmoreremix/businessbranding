# Business Branding Platform - Development Environment

This devcontainer configuration provides a fully configured development environment for the Business Branding Platform with all necessary extensions and tools pre-installed.

## 🚀 Getting Started

### Option 1: Using GitHub Codespaces (Recommended)

1. **Open in Codespaces:**
   - Go to your GitHub repository
   - Click the "Code" button
   - Select "Open with Codespaces"
   - Choose "New codespace"

2. **Wait for Setup:**
   - The devcontainer will automatically build and install all extensions
   - This may take 5-10 minutes on first setup

3. **Start Development:**
   ```bash
   npm run dev
   ```

### Option 2: Using Local VS Code

1. **Prerequisites:**
   - VS Code with Dev Containers extension
   - Docker Desktop running

2. **Open in Dev Container:**
   - Open the project in VS Code
   - When prompted, click "Reopen in Container"
   - Or use Command Palette: `Dev Containers: Reopen in Container`

## 📦 Included Extensions

### Core Development
- **TypeScript & JavaScript:** Full TypeScript support with IntelliSense
- **Tailwind CSS:** Autocomplete, syntax highlighting, and linting
- **ESLint & Prettier:** Code formatting and linting
- **Auto Rename Tag:** Automatically rename paired HTML/JSX tags

### React/Next.js Specific
- **Next.js Extension:** Enhanced Next.js development experience
- **JSON Support:** Better JSON editing and validation

### Database & Backend
- **PostgreSQL:** Database development and query tools
- **SQLite:** Local database support

### Git & Collaboration
- **Git Graph:** Visualize git history and branches
- **GitHub Issues:** Manage GitHub issues directly in VS Code
- **GitHub Copilot:** AI-powered code completion
- **GitHub Copilot Chat:** AI-powered chat for coding questions

### Testing & Quality
- **Test Explorer:** Run and debug tests
- **Test Adapter Converter:** Support for various testing frameworks

### Documentation
- **Markdown Support:** Enhanced markdown editing
- **Markdown Notebook:** Create executable markdown documents

### Docker & Deployment
- **Docker Extension:** Build, manage, and deploy containerized applications

### Additional Tools
- **YAML Support:** Better YAML editing and validation
- **Environment Variables:** Manage environment variables
- **Todo Tree:** Visualize TODO comments in your code
- **Terminal Here:** Open terminal in current file location

## ⚙️ Pre-configured Settings

The devcontainer comes with optimized settings for:
- **Automatic formatting** on save
- **ESLint integration** with auto-fix
- **Tailwind CSS** class autocomplete
- **TypeScript** with proper import resolution
- **Git** with smart commit and auto-fetch
- **Terminal** with bash shell

## 🔧 Development Workflow

### Starting the Development Server
```bash
npm run dev
```
The server will be available at `http://localhost:3000`

### Database Setup
```bash
# Start Supabase locally
supabase start

# Generate types
supabase gen types typescript --local > lib/types/supabase.ts
```

### Building for Production
```bash
npm run build
npm start
```

## 🐛 Troubleshooting

### Extension Issues
If extensions don't install automatically:
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run `Extensions: Install Missing Extensions`
3. Or manually install from the extensions panel

### Port Forwarding
If you can't access the development server:
1. Check the Ports panel in VS Code
2. Forward port 3000 if not already forwarded
3. Access via the forwarded URL

### Performance Issues
If the devcontainer is slow:
1. Ensure Docker has enough resources allocated
2. Close unused applications
3. Restart the devcontainer

## 📚 Additional Resources

- [VS Code Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

## 🤝 Contributing

When adding new extensions or modifying the devcontainer:
1. Update this README
2. Test the configuration in both Codespaces and local devcontainer
3. Ensure all team members can use the new setup

---

**Happy coding! 🚀**