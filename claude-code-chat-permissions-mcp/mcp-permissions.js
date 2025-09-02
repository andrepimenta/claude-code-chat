"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var zod_1 = require("zod");
var fs = require("fs");
var path = require("path");
var server = new mcp_js_1.McpServer({
    name: "Claude Code Permissions MCP Server",
    version: "0.0.1",
});
// Get permissions directory from environment
var PERMISSIONS_PATH = process.env.CLAUDE_PERMISSIONS_PATH;
if (!PERMISSIONS_PATH) {
    console.error("CLAUDE_PERMISSIONS_PATH environment variable not set");
    process.exit(1);
}
function getWorkspacePermissionsPath() {
    if (!PERMISSIONS_PATH)
        return null;
    return path.join(PERMISSIONS_PATH, 'permissions.json');
}
function loadWorkspacePermissions() {
    var permissionsPath = getWorkspacePermissionsPath();
    if (!permissionsPath || !fs.existsSync(permissionsPath)) {
        return { alwaysAllow: {} };
    }
    try {
        var content = fs.readFileSync(permissionsPath, 'utf8');
        return JSON.parse(content);
    }
    catch (error) {
        console.error("Error loading workspace permissions: ".concat(error));
        return { alwaysAllow: {} };
    }
}
function isAlwaysAllowed(toolName, input) {
    var permissions = loadWorkspacePermissions();
    var toolPermission = permissions.alwaysAllow[toolName];
    if (!toolPermission)
        return false;
    // If it's true, always allow
    if (toolPermission === true)
        return true;
    // If it's an array, check for specific commands (mainly for Bash)
    if (Array.isArray(toolPermission)) {
        if (toolName === 'Bash' && input.command) {
            var command_1 = input.command.trim();
            return toolPermission.some(function (allowedCmd) {
                // Support exact match or pattern matching
                if (allowedCmd.includes('*')) {
                    // Handle patterns like "npm i *" to match both "npm i" and "npm i something"
                    var baseCommand = allowedCmd.replace(' *', '');
                    if (command_1 === baseCommand) {
                        return true; // Exact match for base command
                    }
                    // Pattern match for command with arguments
                    var pattern = allowedCmd.replace(/\*/g, '.*');
                    return new RegExp("^".concat(pattern, "$")).test(command_1);
                }
                return command_1.startsWith(allowedCmd);
            });
        }
    }
    return false;
}
function generateRequestId() {
    return "req_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 9));
}
function requestPermission(tool_name, input) {
    return __awaiter(this, void 0, void 0, function () {
        var requestId, requestFile, responseFile, request;
        return __generator(this, function (_a) {
            if (!PERMISSIONS_PATH) {
                console.error("Permissions path not available");
                return [2 /*return*/, { approved: false, reason: "Permissions path not configured" }];
            }
            // Check if this tool/command is always allowed for this workspace
            if (isAlwaysAllowed(tool_name, input)) {
                console.error("Tool ".concat(tool_name, " is always allowed for this workspace"));
                return [2 /*return*/, { approved: true }];
            }
            requestId = generateRequestId();
            requestFile = path.join(PERMISSIONS_PATH, "".concat(requestId, ".request"));
            responseFile = path.join(PERMISSIONS_PATH, "".concat(requestId, ".response"));
            request = {
                id: requestId,
                tool: tool_name,
                input: input,
                timestamp: new Date().toISOString()
            };
            try {
                fs.writeFileSync(requestFile, JSON.stringify(request, null, 2));
                // Use fs.watch to wait for response file
                return [2 /*return*/, new Promise(function (resolve) {
                        var timeout = setTimeout(function () {
                            watcher.close();
                            // Clean up request file on timeout
                            if (fs.existsSync(requestFile)) {
                                fs.unlinkSync(requestFile);
                            }
                            console.error("Permission request ".concat(requestId, " timed out"));
                            resolve({ approved: false, reason: "Permission request timed out" });
                        }, 3600000); // 1 hour timeout
                        var watcher = fs.watch(PERMISSIONS_PATH, function (eventType, filename) {
                            if (eventType === 'rename' && filename === path.basename(responseFile)) {
                                // Check if file exists (rename event can be for creation or deletion)
                                if (fs.existsSync(responseFile)) {
                                    try {
                                        var responseContent = fs.readFileSync(responseFile, 'utf8');
                                        var response = JSON.parse(responseContent);
                                        // Clean up response file
                                        fs.unlinkSync(responseFile);
                                        // Clear timeout and close watcher
                                        clearTimeout(timeout);
                                        watcher.close();
                                        resolve({
                                            approved: response.approved,
                                            reason: response.approved ? undefined : "User rejected the request"
                                        });
                                    }
                                    catch (error) {
                                        console.error("Error reading response file: ".concat(error));
                                        // Continue watching in case of read error
                                    }
                                }
                            }
                        });
                        // Handle watcher errors
                        watcher.on('error', function (error) {
                            console.error("File watcher error: ".concat(error));
                            clearTimeout(timeout);
                            watcher.close();
                            resolve({ approved: false, reason: "File watcher error" });
                        });
                    })];
            }
            catch (error) {
                console.error("Error requesting permission: ".concat(error));
                return [2 /*return*/, { approved: false, reason: "Error processing permission request: ".concat(error) }];
            }
            return [2 /*return*/];
        });
    });
}
server.tool("approval_prompt", 'Request user permission to execute a tool via VS Code dialog', {
    tool_name: zod_1.z.string().describe("The name of the tool requesting permission"),
    input: zod_1.z.object({}).passthrough().describe("The input for the tool"),
    tool_use_id: zod_1.z.string().optional().describe("The unique tool use request ID"),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var permissionResult, behavior;
    var tool_name = _b.tool_name, input = _b.input;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                console.error("Requesting permission for tool: ".concat(tool_name));
                return [4 /*yield*/, requestPermission(tool_name, input)];
            case 1:
                permissionResult = _c.sent();
                behavior = permissionResult.approved ? "allow" : "deny";
                console.error("Permission ".concat(behavior, "ed for tool: ").concat(tool_name));
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: behavior === "allow" ?
                                    JSON.stringify({
                                        behavior: behavior,
                                        updatedInput: input,
                                    })
                                    :
                                        JSON.stringify({
                                            behavior: behavior,
                                            message: permissionResult.reason || "Permission denied",
                                        }),
                            },
                        ],
                    }];
        }
    });
}); });
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var transport;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    transport = new stdio_js_1.StdioServerTransport();
                    return [4 /*yield*/, server.connect(transport)];
                case 1:
                    _a.sent();
                    console.error("Permissions MCP Server running on stdio");
                    console.error("Using permissions directory: ".concat(PERMISSIONS_PATH));
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
