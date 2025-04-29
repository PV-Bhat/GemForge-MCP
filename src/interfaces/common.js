"use strict";
/**
 * Common interfaces and types for Gemini MCP
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskType = void 0;
/**
 * Mapping of task types to recommended models
 */
var TaskType;
(function (TaskType) {
    TaskType["GENERAL_SEARCH"] = "general_search";
    TaskType["RAPID_SEARCH"] = "rapid_search";
    TaskType["RAPID_PROCESSING"] = "rapid_processing";
    TaskType["COMPLEX_REASONING"] = "complex_reasoning";
    TaskType["FILE_ANALYSIS"] = "file_analysis";
})(TaskType || (exports.TaskType = TaskType = {}));
