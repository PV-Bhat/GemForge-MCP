/**
 * Repository packing utilities using Repomix
 *
 * This file provides utility functions for packing a code repository
 * using the Repomix tool, which creates an XML representation of the codebase.
 */
import { execFile } from 'child_process'; // MODIFIED: Import execFile
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

/** Configuration options for packing a repository */
export interface RepoPackOptions {
  outputPath?: string;
  compress?: boolean;
  includePatterns?: string;
  excludePatterns?: string;
  keepTemp?: boolean;
  customOptions?: string; // Custom Repomix command options (for power users)
}

/** Result of packing a repository */
export interface RepoPackResult {
  outputPath: string;
  error?: string;
}

/** Pack a local directory using repomix */
export async function packDirectory(
  directoryPath: string,
  options: RepoPackOptions = {}
): Promise<RepoPackResult> {
  try {
    // Verify the directory exists
    try {
      const stats = await fs.stat(directoryPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${directoryPath}`);
      }
    } catch (error: any) {
       if (error.code === 'ENOENT') {
          throw new Error(`Directory not found: ${directoryPath}`);
       }
       throw new Error(`Invalid directory path: ${directoryPath} - ${error.message}`);
    }

    // Create a temporary output path if not specified
    const tempFileName = `repomix-${Date.now()}.xml`;
    const outputPath = options.outputPath || path.join(os.tmpdir(), tempFileName);

    // Build the repomix command arguments
    const { command, args } = buildRepomixCommandArgs(directoryPath, outputPath, options); // MODIFIED

    // Execute repomix
    console.error(`Executing repomix: ${command} ${args.join(' ')}`); // Log command
    const result = await executeCommand(command, args); // MODIFIED
    console.error(`Repomix stdout: ${result.stdout}`);
    console.error(`Repomix stderr: ${result.stderr}`);

    // Basic check if output file exists
    try {
       await fs.access(outputPath);
    } catch (e) {
       throw new Error(`Repomix execution failed. Output file not found: ${outputPath}. Stderr: ${result.stderr}`);
    }

    return { outputPath };
  } catch (error: any) {
    console.error('Error packing directory:', error); // Log error
    return {
      outputPath: '',
      error: error.message
    };
  }
}

/** Build the repomix command and its arguments */
function buildRepomixCommandArgs( // MODIFIED function name and return type
  directoryPath: string,
  outputPath: string,
  options: RepoPackOptions
): { command: string, args: string[] } {
  const command = 'npx'; // The command to execute
  const args: string[] = ['repomix']; // Initial arguments for npx

  // IMPORTANT: Path sanitization/validation should ideally happen before this point,
  // or be very strictly applied here. For this example, we assume paths are safe.
  args.push(directoryPath);
  args.push('--output', outputPath);

  // Add custom options if provided.
  // SECURITY NOTE: `customOptions` is the riskiest part.
  // If user-supplied, it MUST be heavily sanitized or, preferably,
  // specific allowed options should be exposed rather than a raw string.
  // For now, we split it, but this doesn't inherently make it safe if the options themselves are malicious.
  if (options.customOptions) {
    const customOptionsParts = options.customOptions.trim().split(/\s+/);
    args.push(...customOptionsParts);
  }

  // Example: If you wanted to ensure only specific options are allowed from customOptions:
  // const allowedCustomFlags = ['--some-safe-flag', '--another-allowed-one'];
  // if (options.customOptions) {
  //   const customOptionsParts = options.customOptions.trim().split(/\s+/);
  //   customOptionsParts.forEach(part => {
  //     if (allowedCustomFlags.includes(part.split('=')[0])) { // Basic check, might need more robust parsing
  //       args.push(part);
  //     } else {
  //       console.warn(`[buildRepomixCommandArgs] Ignoring potentially unsafe custom option: ${part}`);
  //     }
  //   });
  // }


  // Repomix 0.3.3 doesn't support --exclude flag, so we'll omit it
  // if (options.excludePatterns) {
  //   args.push('--exclude', options.excludePatterns); // Check repomix docs for correct flag
  // }

  // if (options.compress !== false) {
  //   args.push('--compress'); // Check repomix docs for correct compression flag
  // }

  console.error(`[buildRepomixCommandArgs] Command: ${command}, Args: ${JSON.stringify(args)}`);
  return { command, args };
}

/** Execute a shell command using execFile */
function executeCommand(command: string, args: string[]): Promise<{ stdout: string, stderr: string }> { // MODIFIED
  return new Promise((resolve, reject) => {
    execFile(command, args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => { // MODIFIED: use execFile
      if (error) {
        console.error(`Command execution failed: ${command} ${args.join(' ')}`);
        console.error(`Error code: ${(error as any).code}`); // Type assertion for code
        console.error(`Signal received: ${(error as any).signal}`); // Type assertion for signal
        console.error(`Stderr: ${stderr}`);
        reject(new Error(`Command failed: ${error.message}. Stderr: ${stderr}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

/** Clean up temporary files */
export async function cleanupPackedFile(outputPath: string): Promise<void> {
  try {
     if (outputPath && outputPath.includes(os.tmpdir()) && outputPath.includes('repomix-')) {
       await fs.unlink(outputPath);
       console.error(`Deleted temporary file: ${outputPath}`);
     }
   } catch (error: any) {
     console.error(`Error cleaning up packed file ${outputPath}: ${error.message}`);
   }
}