#!/usr/bin/env node
const { existsSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

/**
 * Small helper that installs dependencies for each workspace directory
 * when its package.json is present. This keeps local DX (postinstall) intact
 * while avoiding failures on platforms that check out a subset of the repo
 * (e.g. Docker layers that only copy package.json files).
 */

const PACKAGES = [
  { name: 'backend', label: 'backend' },
  { name: 'frontend', label: 'frontend' },
  { name: 'admin', label: 'admin' }
];

const useShell = process.platform === 'win32';
const npmCommand = useShell ? 'npm' : 'npm';
const repoRoot = process.cwd();

const baseInstallArgs = ['install'];
if (process.env.npm_config_production === 'true' || process.env.NODE_ENV === 'production') {
  baseInstallArgs.push('--omit=dev');
}

let anyInstalled = false;

for (const pkg of PACKAGES) {
  const packageJsonPath = join(repoRoot, pkg.name, 'package.json');
  if (!existsSync(packageJsonPath)) {
    console.log(`[install-all] Skipping ${pkg.label}: ${packageJsonPath} not found.`);
    continue;
  }

  console.log(`[install-all] Installing dependencies for ${pkg.label}...`);
  const installProcess = spawnSync(npmCommand, baseInstallArgs, {
    cwd: join(repoRoot, pkg.name),
    stdio: 'inherit',
    env: process.env,
    shell: useShell
  });

  if (installProcess.status !== 0) {
    const errorMessage = installProcess.error
      ? installProcess.error.message
      : `exit code ${installProcess.status ?? 'unknown'}${installProcess.signal ? ` (signal ${installProcess.signal})` : ''}`;
    console.error(`[install-all] Installation failed for ${pkg.label}: ${errorMessage}.`);
    process.exit(installProcess.status ?? 1);
  }

  anyInstalled = true;
}

if (!anyInstalled) {
  console.log('[install-all] No package directories detected. Nothing to install.');
}
