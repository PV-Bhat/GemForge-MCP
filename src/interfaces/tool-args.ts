import { BaseArgs, FileInput, GenerationConfig } from './common.js';

/**
 * Arguments for gemini_search tool
 */
export interface SearchArgs extends BaseArgs, FileInput {
  /** The search query */
  query: string;

  /** Whether to enable thinking mode */
  enable_thinking?: boolean;
}

/**
 * Arguments for gemini_reason tool
 */
export interface ReasonArgs extends BaseArgs, FileInput {
  /** The problem to solve */
  problem: string;

  /** Whether to show reasoning steps */
  show_steps?: boolean;
}

/**
 * Arguments for gemini_code tool
 */
export interface CodeArgs extends BaseArgs {
  /** Question about the codebase */
  question: string;

  /** Path to the code directory */
  directory_path?: string;

  /** Path to pre-packed Repomix file */
  codebase_path?: string;

  /** Custom Repomix command options (for power users) */
  repomix_options?: string;
}

/**
 * Arguments for gemini_fileops tool
 */
export interface FileopsArgs extends BaseArgs, FileInput {
  /** Specific instruction for processing */
  instruction?: string;

  /** Specific operation type */
  operation?: 'summarize' | 'extract' | 'analyze';

  /** Set true if the file is very large to use Gemini 1.5 Pro */
  use_large_context_model?: boolean;
}
