#!/usr/bin/env node

/**
 * Build script for Claude Code Chat VS Code Extension
 * Cross-platform (Windows/Mac/Linux)
 * Prompts for version bump before building
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
    try {
        return execSync(command, {
            stdio: options.silent ? 'pipe' : 'inherit',
            encoding: 'utf8',
            ...options
        });
    } catch (error) {
        if (!options.ignoreError) {
            log(`Error executing: ${command}`, 'red');
            process.exit(1);
        }
        return null;
    }
}

function getPackageVersion() {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return pkg.version;
}

function prompt(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

function calculateNewVersion(current, type) {
    const [major, minor, patch] = current.split('.').map(Number);
    switch (type) {
        case 'major': return `${major + 1}.0.0`;
        case 'minor': return `${major}.${minor + 1}.0`;
        case 'patch': return `${major}.${minor}.${patch + 1}`;
        default: return current;
    }
}

async function main() {
    console.log('');
    log('================================', 'blue');
    log('  Claude Code Chat Build Tool', 'blue');
    log('================================', 'blue');
    console.log('');

    const currentVersion = getPackageVersion();
    log(`Current version: ${currentVersion}`, 'green');
    console.log('');

    // Show version bump options
    console.log('How would you like to bump the version?');
    console.log('');
    log(`  1) patch  (${currentVersion} -> ${calculateNewVersion(currentVersion, 'patch')}) - Bug fixes`, 'yellow');
    log(`  2) minor  (${currentVersion} -> ${calculateNewVersion(currentVersion, 'minor')}) - New features`, 'yellow');
    log(`  3) major  (${currentVersion} -> ${calculateNewVersion(currentVersion, 'major')}) - Breaking changes`, 'yellow');
    log(`  4) skip   - Keep current version`, 'yellow');
    log(`  5) custom - Enter version manually`, 'yellow');
    console.log('');

    const choice = await prompt('Select option [1-5]: ');

    let newVersion = currentVersion;

    switch (choice) {
        case '1':
            log('Bumping patch version...', 'yellow');
            exec('npm version patch --no-git-tag-version');
            newVersion = getPackageVersion();
            break;
        case '2':
            log('Bumping minor version...', 'yellow');
            exec('npm version minor --no-git-tag-version');
            newVersion = getPackageVersion();
            break;
        case '3':
            log('Bumping major version...', 'yellow');
            exec('npm version major --no-git-tag-version');
            newVersion = getPackageVersion();
            break;
        case '4':
            log('Keeping current version...', 'yellow');
            break;
        case '5':
            const customVersion = await prompt('Enter custom version (e.g., 1.2.3): ');
            if (!/^\d+\.\d+\.\d+$/.test(customVersion)) {
                log('Invalid version format. Use semantic versioning (e.g., 1.2.3)', 'red');
                process.exit(1);
            }
            log(`Setting version to ${customVersion}...`, 'yellow');
            exec(`npm version ${customVersion} --no-git-tag-version`);
            newVersion = customVersion;
            break;
        default:
            log('Invalid option. Exiting.', 'red');
            process.exit(1);
    }

    console.log('');
    log(`Building version: ${newVersion}`, 'green');
    console.log('');

    // Compile TypeScript
    log('Compiling TypeScript...', 'yellow');
    exec('npm run compile');

    // Build the VSIX
    log('Packaging VSIX...', 'yellow');
    exec('npx vsce package');

    const outputName = `claude-code-chat-${newVersion}.vsix`;

    console.log('');
    log('================================', 'green');
    log('  Build Complete!', 'green');
    log('================================', 'green');
    console.log('');
    log(`Output: ${outputName}`, 'blue');
    log(`Version: ${newVersion}`, 'green');
    console.log('');
}

main().catch(err => {
    log(`Build failed: ${err.message}`, 'red');
    process.exit(1);
});
