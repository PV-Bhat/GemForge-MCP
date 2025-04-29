/** Configuration options for packing a repository */
export interface RepoPackOptions {
    outputPath?: string;
    compress?: boolean;
    includePatterns?: string;
    excludePatterns?: string;
    keepTemp?: boolean;
    customOptions?: string;
}
/** Result of packing a repository */
export interface RepoPackResult {
    outputPath: string;
    error?: string;
}
/** Pack a local directory using repomix */
export declare function packDirectory(directoryPath: string, options?: RepoPackOptions): Promise<RepoPackResult>;
/** Clean up temporary files */
export declare function cleanupPackedFile(outputPath: string): Promise<void>;
