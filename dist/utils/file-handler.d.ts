import { FileInput } from '../interfaces/common.js';
import { Part } from '@google/generative-ai';
/**
 * Get MIME type from file path, URL, or extension
 * @param filePath - File path or URL
 * @returns MIME type or undefined if not determinable
 */
export declare function getMimeType(filePath: string): string | undefined;
/**
 * Get file type category from file path or MIME type
 * @param filePathOrMimeType - File path, URL, or MIME type
 * @returns File type category (image, document, code, etc.)
 */
export declare function getFileTypeCategory(filePathOrMimeType: string): string;
/**
 * Check if file exists and is accessible
 * @param filePath - Path to file
 * @returns Promise resolving to boolean
 */
export declare function fileExists(filePath: string): Promise<boolean>;
/**
 * Normalize file input to array of file paths
 * @param fileInput - File input from request
 * @returns Array of file paths
 */
export declare function normalizeFileInput(fileInput: FileInput['file_path']): string[];
/**
 * Read file as base64 string
 * @param filePath - Path to file
 * @returns Promise resolving to base64 string
 */
export declare function readFileAsBase64(filePath: string): Promise<string>;
/**
 * Detect if a path is a URL
 * @param path - Path or URL string
 * @returns True if path is a URL
 */
export declare function isUrl(path: string): boolean;
/**
 * Create a file part for model input
 * @param filePath - Path to file
 * @returns Promise resolving to Part object
 */
export declare function createFilePart(filePath: string): Promise<Part>;
/**
 * Create file parts for multiple files
 * @param filePaths - Array of file paths
 * @returns Promise resolving to array of Part objects
 */
export declare function createFilePartsBatch(filePaths: string[]): Promise<Part[]>;
/**
 * Prepare parts array with text and files
 * @param filePath - Single file path or array of file paths
 * @param text - Text prompt
 * @returns Promise resolving to array of Part objects
 */
export declare function preparePartsWithFiles(filePath: string | string[], text: string): Promise<Part[]>;
/**
 * Concatenate multiple files into a single temporary file
 * @param filePaths Array of file paths
 * @param separator Separator to use between files
 * @returns Path to the temporary file
 */
export declare function concatenateFiles(filePaths: string[], separator?: string): Promise<string>;
/**
 * Check if a file is considered "large" for model selection purposes
 * @param filePath Path to the file
 * @returns True if the file is considered large
 */
export declare function isLargeFile(filePath: string | string[]): boolean;
