import { createFilePartsBatch, normalizeFileInput } from '../file-handler.js';
/**
 * Process file inputs for Gemini API
 */
export async function processFileInputs(fileInput) {
    const parts = [];
    if (fileInput.file_path) {
        try {
            // Normalize file input to ensure it's handled consistently
            const filePaths = normalizeFileInput(fileInput.file_path);
            if (filePaths.length > 0) {
                console.log(`Processing ${filePaths.length} file(s):`, filePaths);
                // Process as batch for multiple files
                const fileParts = await createFilePartsBatch(filePaths);
                if (fileParts.length > 0) {
                    parts.push(...fileParts);
                    console.log(`Successfully created ${fileParts.length} file parts`);
                }
                else {
                    console.warn('No valid file parts were created');
                }
            }
        }
        catch (error) {
            console.error('Error processing file inputs:', error);
            // Safely handle unknown error type
            let errorMessage = 'An unknown error occurred while processing files.';
            if (error instanceof Error) {
                errorMessage = `Error processing file inputs: ${error.message}`;
            }
            else if (typeof error === 'string') {
                errorMessage = `Error processing file inputs: ${error}`;
            }
            // No need to check if parts is defined - it was declared as a constant array above
            // Add error message as text part with brackets for clarity
            parts.push({ text: `[${errorMessage}]` });
        }
    }
    else {
        console.log('No file_path provided in file input');
    }
    return parts;
}
//# sourceMappingURL=index.js.map