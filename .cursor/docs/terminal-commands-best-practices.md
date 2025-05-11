# Terminal Commands Best Practices

This document outlines the best practices and guidelines for running terminal commands in our project.

1. Always run `nvm install` before running any `npm` commands
2. Always run commands from the project root directory
3. Use the provided `npm` scripts instead of running commands directly
4. Check the `package.json` for available scripts before running custom commands
5. Use environment variables for sensitive information
6. Never commit sensitive data or credentials

## Troubleshooting

1. Clear cache:

   ```bash
   # Clear npm cache
   npm cache clean --force
   ```

2. Reset node_modules:

   ```bash
   # Remove node_modules
   rm -rf node_modules
   
   # Ensure we are using the right NodeJs version
   nvm install

   # Reinstall dependencies
   npm install
   ```
