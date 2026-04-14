const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const packageJsonPath = path.resolve(__dirname, '../package.json');

function runGit(args) {
    const result = spawnSync('git', args, { stdio: 'inherit' });
    if (result.status !== 0) {
        console.error(`Git command failed: git ${args.join(' ')}`);
        process.exit(1);
    }
}

function bumpVersion() {
    // 1. Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const oldVersion = packageJson.version;

    // 2. Increment PATCH version
    const parts = oldVersion.split('.');
    if (parts.length !== 3) {
        console.error(`Invalid version format: ${oldVersion}. Expected x.y.z`);
        process.exit(1);
    }
    
    parts[2] = parseInt(parts[2], 10) + 1;
    const newVersion = parts.join('.');
    packageJson.version = newVersion;

    // 3. Write back package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`Version bumped from ${oldVersion} to ${newVersion}`);

    // 4. Commit updated version
    runGit(['add', 'package.json']);
    runGit(['commit', '-m', `chore: bump version to ${newVersion} [skip ci]`]);

    // 5. Push the change avoiding hooks loop
    console.log('Pushing updated version...');
    runGit(['push', '--no-verify']);

    // Exit with 1 to cancel the original push command
    console.log('New version pushed successfully. Cancelling original push command.');
    process.exit(1);
}

bumpVersion();
