/**
 * File handling utilities for Gemini MCP
 *
 * This file provides utility functions for working with files,
 * including MIME type detection, file reading, and URL processing.
 */
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';
/**
 * Common MIME types by file extension
 */
const MIME_TYPES = {
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.bmp': 'image/bmp',
    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.odt': 'application/vnd.oasis.opendocument.text',
    '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
    '.odp': 'application/vnd.oasis.opendocument.presentation',
    // Text
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.md': 'text/markdown',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.xml': 'text/plain', // Changed from application/xml to text/plain for better compatibility
    '.json': 'text/plain', // Changed from application/json to text/plain for better compatibility
    '.yaml': 'text/plain', // Changed from application/x-yaml to text/plain for better compatibility
    '.yml': 'text/plain', // Changed from application/x-yaml to text/plain for better compatibility
    // Code - Additional file types
    '.js': 'text/javascript',
    '.ts': 'text/typescript',
    '.py': 'text/x-python',
    '.java': 'text/x-java-source',
    '.c': 'text/x-c',
    '.cpp': 'text/x-c++',
    '.cs': 'text/x-csharp',
    '.go': 'text/x-go',
    '.rb': 'text/x-ruby',
    '.php': 'application/x-php',
    '.astro': 'text/html',
    '.svelte': 'text/html',
    '.vue': 'text/html',
    '.tf': 'text/plain',
    '.tfvars': 'text/plain',
    '.bicep': 'text/plain',
    '.shader': 'text/plain',
    '.gd': 'text/plain',
    '.toml': 'application/toml',
    '.config': 'text/plain',
    '.gitignore': 'text/plain',
    '.env': 'text/plain',
    '.jsx': 'text/javascript',
    '.tsx': 'text/typescript',
    '.swift': 'text/x-swift',
    '.kt': 'text/x-kotlin',
    '.rs': 'text/x-rust',
    '.scala': 'text/x-scala',
    '.dart': 'text/x-dart',
    '.sql': 'text/x-sql',
    '.sh': 'text/x-shellscript',
    '.bash': 'text/x-shellscript',
    '.ps1': 'text/plain',
    '.groovy': 'text/x-groovy',
    '.gradle': 'text/x-groovy',
    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    '.aac': 'audio/aac',
    // Video
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',
    // Archive
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.7z': 'application/x-7z-compressed',
    // Other
    '.bin': 'application/octet-stream',
    '.exe': 'application/x-msdownload',
    '.wasm': 'application/wasm',
};
/**
 * File type categories for better model selection
 */
const FILE_TYPE_CATEGORIES = {
    // Images
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/gif': 'image',
    'image/webp': 'image',
    'image/svg+xml': 'image',
    'image/tiff': 'image',
    'image/bmp': 'image',
    // Documents
    'application/pdf': 'document',
    'application/msword': 'document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
    'application/vnd.ms-excel': 'spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',
    'application/vnd.ms-powerpoint': 'presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'presentation',
    'application/vnd.oasis.opendocument.text': 'document',
    'application/vnd.oasis.opendocument.spreadsheet': 'spreadsheet',
    'application/vnd.oasis.opendocument.presentation': 'presentation',
    // Text
    'text/plain': 'text',
    'text/csv': 'data',
    'text/markdown': 'text',
    'text/html': 'code',
    'application/xml': 'code',
    'text/plain+xml': 'text', // Added for XML files
    'application/json': 'data',
    'application/x-yaml': 'data',
    'application/toml': 'data',
    // Code
    'text/javascript': 'code',
    'text/typescript': 'code',
    'text/x-python': 'code',
    'text/x-java-source': 'code',
    'text/x-c': 'code',
    'text/x-c++': 'code',
    'text/x-csharp': 'code',
    'text/x-go': 'code',
    'text/x-ruby': 'code',
    'application/x-php': 'code',
    'text/x-swift': 'code',
    'text/x-kotlin': 'code',
    'text/x-rust': 'code',
    'text/x-scala': 'code',
    'text/x-dart': 'code',
    'text/x-sql': 'code',
    'text/x-shellscript': 'code',
    'text/x-groovy': 'code',
    // Audio
    'audio/mpeg': 'audio',
    'audio/wav': 'audio',
    'audio/ogg': 'audio',
    'audio/flac': 'audio',
    'audio/aac': 'audio',
    // Video
    'video/mp4': 'video',
    'video/webm': 'video',
    'video/x-msvideo': 'video',
    'video/quicktime': 'video',
    'video/x-matroska': 'video',
    // Archive
    'application/zip': 'archive',
    'application/x-rar-compressed': 'archive',
    'application/x-tar': 'archive',
    'application/gzip': 'archive',
    'application/x-7z-compressed': 'archive',
    // Default
    'application/octet-stream': 'binary',
};
/**
 * Get MIME type from file path, URL, or extension
 * @param filePath - File path or URL
 * @returns MIME type or undefined if not determinable
 */
export function getMimeType(filePath) {
    if (!filePath)
        return undefined;
    // For URLs, try to extract extension from path
    if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('gs://')) {
        try {
            // Extract the path portion for URLs
            let urlPath;
            if (filePath.startsWith('gs://')) {
                // Extract path from GCS URL (after bucket name)
                const parts = filePath.substring(5).split('/');
                if (parts.length > 1) {
                    parts.shift(); // Remove bucket name
                    urlPath = parts.join('/');
                }
                else {
                    urlPath = '';
                }
            }
            else {
                // For HTTP(S) URLs, extract path from URL object
                const url = new URL(filePath);
                urlPath = url.pathname;
            }
            // Get extension from path
            const extension = path.extname(urlPath).toLowerCase();
            const mimeType = MIME_TYPES[extension];
            if (!mimeType) {
                console.warn(`Could not determine MIME type for URL: ${filePath}, extension: ${extension}. Using application/octet-stream as default.`);
                return 'application/octet-stream';
            }
            return mimeType;
        }
        catch (error) {
            console.error(`Error extracting MIME type from URL: ${filePath}`, error);
            console.warn('Using application/octet-stream as default MIME type for URL.');
            return 'application/octet-stream';
        }
    }
    // For local files, use path.extname
    const extension = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[extension];
    if (!mimeType) {
        console.warn(`Could not determine MIME type for file: ${filePath}, extension: ${extension}. Using application/octet-stream as default.`);
        return 'application/octet-stream';
    }
    return mimeType;
}
/**
 * Get file type category from file path or MIME type
 * @param filePathOrMimeType - File path, URL, or MIME type
 * @returns File type category (image, document, code, etc.)
 */
export function getFileTypeCategory(filePathOrMimeType) {
    // If input is already a MIME type
    if (filePathOrMimeType.includes('/')) {
        return FILE_TYPE_CATEGORIES[filePathOrMimeType] || 'unknown';
    }
    // Get MIME type from file path
    const mimeType = getMimeType(filePathOrMimeType);
    if (!mimeType)
        return 'unknown';
    return FILE_TYPE_CATEGORIES[mimeType] || 'unknown';
}
/**
 * Check if file exists and is accessible
 * @param filePath - Path to file
 * @returns Promise resolving to boolean
 */
export async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Normalize file input to array of file paths
 * @param fileInput - File input from request
 * @returns Array of file paths
 */
export function normalizeFileInput(fileInput) {
    if (!fileInput)
        return [];
    return Array.isArray(fileInput) ? fileInput : [fileInput];
}
/**
 * Read file as base64 string
 * @param filePath - Path to file
 * @returns Promise resolving to base64 string
 */
export async function readFileAsBase64(filePath) {
    console.error(`[readFileAsBase64] Attempting to read: ${filePath}`);
    try {
        const fileBuffer = await fs.readFile(filePath);
        const base64Data = fileBuffer.toString('base64');
        console.error(`[readFileAsBase64] Read success, base64 length: ${base64Data.length}`);
        return base64Data;
    }
    catch (error) {
        console.error(`[readFileAsBase64] Error reading file ${filePath}:`, error);
        // Provide more specific error messages based on error code
        if (error.code === 'ENOENT') {
            throw new Error(`File not found: ${filePath}`);
        }
        else if (error.code === 'EACCES') {
            throw new Error(`Permission denied reading file: ${filePath}`);
        }
        else if (error.code === 'EISDIR') {
            throw new Error(`Cannot read directory as file: ${filePath}`);
        }
        else {
            throw new Error(`Failed to read file "${filePath}": ${error.message || error}`);
        }
    }
}
/**
 * Detect if a path is a URL
 * @param path - Path or URL string
 * @returns True if path is a URL
 */
export function isUrl(path) {
    return path.startsWith('http://') ||
        path.startsWith('https://') ||
        path.startsWith('gs://');
}
/**
 * Create a file part for model input
 * @param filePath - Path to file
 * @returns Promise resolving to Part object
 */
export async function createFilePart(filePath) {
    console.error(`[createFilePart] Creating part for file: ${filePath}`);
    try {
        const mimeType = getMimeType(filePath) || 'application/octet-stream';
        console.error(`[createFilePart] Determined MIME type: ${mimeType}`);
        if (isUrl(filePath)) {
            // For URLs, we need to return a FileData part for the Gemini API
            console.error(`[createFilePart] Processing as URL: ${filePath}`);
            return {
                fileData: {
                    mimeType,
                    fileUri: filePath
                }
            };
        }
        else {
            // For local files, use base64 encoding
            console.error(`[createFilePart] Processing as local file: ${filePath}`);
            const base64Data = await readFileAsBase64(filePath);
            console.error(`[createFilePart] Successfully created inlineData part with ${base64Data.length} bytes base64 data`);
            return {
                inlineData: {
                    mimeType,
                    data: base64Data
                }
            };
        }
    }
    catch (error) {
        console.error(`[createFilePart] Error creating file part for ${filePath}:`, error);
        // Return an error text part instead
        return { text: `[Error processing file: ${filePath}]` };
    }
}
/**
 * Create file parts for multiple files
 * @param filePaths - Array of file paths
 * @returns Promise resolving to array of Part objects
 */
export async function createFilePartsBatch(filePaths) {
    const parts = [];
    console.error(`[createFilePartsBatch] Processing ${filePaths.length} file paths`);
    for (const filePath of filePaths) {
        console.error(`[createFilePartsBatch] Processing file: ${filePath}`);
        try {
            const exists = await fileExists(filePath);
            console.error(`[createFilePartsBatch] File exists check: ${exists}`);
            if (!exists) {
                console.error(`[createFilePartsBatch] File does not exist: ${filePath}`);
                parts.push({ text: `[Error: File not found: ${filePath}]` });
                continue;
            }
            const part = await createFilePart(filePath);
            console.error(`[createFilePartsBatch] Successfully created part for: ${filePath}`);
            parts.push(part);
        }
        catch (error) {
            console.error(`[createFilePartsBatch] Error creating file part for ${filePath}:`, error);
            // Add error text part
            parts.push({ text: `[Error processing file: ${filePath}]` });
        }
    }
    console.error(`[createFilePartsBatch] Created ${parts.length} parts for ${filePaths.length} files`);
    return parts;
}
/**
 * Prepare parts array with text and files
 * @param filePath - Single file path or array of file paths
 * @param text - Text prompt
 * @returns Promise resolving to array of Part objects
 */
export async function preparePartsWithFiles(filePath, text) {
    const parts = [];
    console.error(`[preparePartsWithFiles] Starting with filePath: ${typeof filePath === 'string' ? filePath : JSON.stringify(filePath)} and text length: ${text?.length || 0}`);
    // Process file(s) first to allow text to reference them
    const filePaths = Array.isArray(filePath) ? filePath : [filePath];
    // Only process if file paths are provided and valid
    if (filePaths.length > 0 && filePaths[0]) {
        console.error(`[preparePartsWithFiles] Processing ${filePaths.length} file(s): ${JSON.stringify(filePaths)}`);
        try {
            const fileParts = await createFilePartsBatch(filePaths);
            console.error(`[preparePartsWithFiles] Created ${fileParts.length} file parts`);
            if (fileParts.length > 0) {
                parts.push(...fileParts);
            }
        }
        catch (error) {
            console.error(`[preparePartsWithFiles] Error creating file parts:`, error);
            parts.push({ text: `[Error processing files: ${error instanceof Error ? error.message : String(error)}]` });
        }
    }
    else {
        console.error(`[preparePartsWithFiles] No valid file paths provided`);
    }
    // Add text part if provided (after files so it can reference them)
    if (text && text.trim()) {
        console.error(`[preparePartsWithFiles] Adding text part with ${text.length} characters`);
        parts.push({ text });
    }
    // Ensure parts array is not empty
    if (parts.length === 0) {
        console.error(`[preparePartsWithFiles] No parts created, adding fallback message`);
        parts.push({ text: "Please provide a valid file or text input." });
    }
    console.error(`[preparePartsWithFiles] Final parts array contains ${parts.length} parts`);
    // Log the structure (but not full content) of each part
    parts.forEach((part, index) => {
        if ('text' in part && typeof part.text === 'string') {
            console.error(`[preparePartsWithFiles] Part ${index}: text (${part.text.length} chars)`);
        }
        else if ('inlineData' in part && part.inlineData) {
            console.error(`[preparePartsWithFiles] Part ${index}: inlineData (mimeType: ${part.inlineData.mimeType}, data length: ${part.inlineData.data?.length ?? 0})`);
        }
        else if ('fileData' in part && part.fileData) {
            console.error(`[preparePartsWithFiles] Part ${index}: fileData (mimeType: ${part.fileData.mimeType}, fileUri: ${part.fileData.fileUri})`);
        }
        else {
            console.error(`[preparePartsWithFiles] Part ${index}: unknown type`);
        }
    });
    return parts;
}
/**
 * Concatenate multiple files into a single temporary file
 * @param filePaths Array of file paths
 * @param separator Separator to use between files
 * @returns Path to the temporary file
 */
export async function concatenateFiles(filePaths, separator = '\n\n------- NEW FILE -------\n\n') {
    if (!filePaths || filePaths.length === 0) {
        throw new Error('No file paths provided');
    }
    if (filePaths.length === 1) {
        return filePaths[0];
    }
    console.error(`[concatenateFiles] Concatenating ${filePaths.length} files`);
    // Create a temporary file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `multifile-${Date.now()}.txt`);
    console.error(`[concatenateFiles] Creating temporary file: ${tempFilePath}`);
    // Read and concatenate all files
    let combinedContent = '';
    for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i];
        console.error(`[concatenateFiles] Processing file ${i + 1}/${filePaths.length}: ${filePath}`);
        try {
            // Read the file content
            const content = await fs.readFile(filePath, 'utf8');
            // Add file header and content
            combinedContent += `\n\n===== FILE ${i + 1}: ${path.basename(filePath)} =====\n\n`;
            combinedContent += content;
            // Add separator if not the last file
            if (i < filePaths.length - 1) {
                combinedContent += separator;
            }
        }
        catch (error) {
            console.error(`[concatenateFiles] Error reading file ${filePath}:`, error);
            throw error;
        }
    }
    // Write the combined content to the temporary file
    console.error(`[concatenateFiles] Writing ${combinedContent.length} bytes to temporary file`);
    await fs.writeFile(tempFilePath, combinedContent, 'utf8');
    console.error(`[concatenateFiles] Successfully created temporary file: ${tempFilePath}`);
    return tempFilePath;
}
/**
 * Check if a file is considered "large" for model selection purposes
 * @param filePath Path to the file
 * @returns True if the file is considered large
 */
export function isLargeFile(filePath) {
    // For now, treat PDFs and large images as "large files"
    const path = Array.isArray(filePath) ? filePath[0] : filePath;
    const ext = path.toLowerCase().split('.').pop();
    return ext === 'pdf' || ext === 'png' || ext === 'jpg' || ext === 'jpeg';
}
//# sourceMappingURL=file-handler.js.map