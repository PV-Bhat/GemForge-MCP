/**
 * Repository packing utilities using Repomix
 *
 * This file provides utility functions for packing a code repository
 * using the Repomix tool, which creates an XML representation of the codebase.
 */
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
/** Pack a local directory using repomix */
export async function packDirectory(directoryPath, options = {}) {
    try {
        // Verify the directory exists
        try {
            const stats = await fs.stat(directoryPath);
            if (!stats.isDirectory()) {
                throw new Error(`Path is not a directory: ${directoryPath}`);
            }
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Directory not found: ${directoryPath}`);
            }
            throw new Error(`Invalid directory path: ${directoryPath} - ${error.message}`);
        }
        // Create a temporary output path if not specified
        // Simple temp name example:
        const tempFileName = `repomix-${Date.now()}.xml`;
        const outputPath = options.outputPath || path.join(os.tmpdir(), tempFileName);
        // Build the repomix command (adjust flags as needed for current repomix version)
        const command = buildRepomixCommand(directoryPath, outputPath, options);
        // Execute repomix
        console.error(`Executing repomix: ${command}`); // Log command
        const result = await executeCommand(command);
        console.error(`Repomix stdout: ${result.stdout}`);
        console.error(`Repomix stderr: ${result.stderr}`);
        // Basic check if output file exists
        try {
            await fs.access(outputPath);
        }
        catch (e) {
            throw new Error(`Repomix execution failed. Output file not found: ${outputPath}. Stderr: ${result.stderr}`);
        }
        // TODO: Add parsing of repomix stdout for metrics if needed
        return { outputPath };
    }
    catch (error) {
        console.error('Error packing directory:', error); // Log error
        return {
            outputPath: '',
            error: error.message
        };
    }
}
/** Build the repomix command string */
function buildRepomixCommand(directoryPath, outputPath, options) {
    // Use npx to run repomix - assumes it's installed or available via npx
    const args = ['npx', 'repomix'];
    args.push(directoryPath); // Add directory path without quotes
    args.push('--output', outputPath); // Specify output file without quotes
    // Add custom options if provided (for power users)
    if (options.customOptions) {
        // Split the custom options string by spaces and add each part to the args array
        const customOptionsParts = options.customOptions.trim().split(/\s+/);
        args.push(...customOptionsParts);
    }
    // Repomix 0.3.3 doesn't support --exclude flag, so we'll omit it
    // If we need to exclude patterns in the future, we'll need to check the version
    // and use the appropriate flags
    // Add other options like --compress if needed and supported
    // if (options.compress !== false) {
    //   args.push('--compress'); // Check repomix docs for correct compression flag
    // }
    console.error(`[buildRepomixCommand] Command args: ${JSON.stringify(args)}`);
    return args.join(' ');
}
/** Execute a shell command */
function executeCommand(command) {
    return new Promise((resolve, reject) => {
        // Increase buffer size if needed for large repomix output
        exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                // Log the error details before rejecting
                console.error(`Command execution failed: ${command}`);
                console.error(`Error code: ${error.code}`);
                console.error(`Signal received: ${error.signal}`);
                console.error(`Stderr: ${stderr}`);
                reject(new Error(`Command failed: ${error.message}. Stderr: ${stderr}`));
                return;
            }
            resolve({ stdout, stderr });
        });
    });
}
/** Clean up temporary files */
export async function cleanupPackedFile(outputPath) {
    try {
        // Only delete if it looks like one of our temp files
        if (outputPath && outputPath.includes(os.tmpdir()) && outputPath.includes('repomix-')) {
            await fs.unlink(outputPath);
            console.error(`Deleted temporary file: ${outputPath}`);
        }
    }
    catch (error) {
        // Log cleanup errors but don't fail the main operation
        console.error(`Error cleaning up packed file ${outputPath}: ${error.message}`);
    }
}
//# sourceMappingURL=repo-packer.js.map