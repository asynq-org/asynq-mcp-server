# Asynq MCP Server

This is the official Model Context Protocol (MCP) server for [Asynq](https://asynq.org).
It acts as a bridge/proxy between your MCP Client (like Claude Desktop) and the Asynq platform.

## Features

- **Decision Search**: Find relevant decisions from your team's history.
- **Context Retrieval**: "Soft" vs "Hard" memory access.
- **Draft Creation**: Create new decisions directly from chat.
- **Comment & Finalize**: Participate in decision making without leaving your AI assistant.

---

## Agent Guidelines

To ensure the best experience, the AI agent (Claude) should follow these guidelines when interacting with Asynq. These are also available via the `asynq://guidelines` resource.

### 1. Decision Linking

- **ALWAYS** provide a direct link to any decision you reference, create, or modify.
- **Format**: `https://asynq.org/d/{decision_id}`

### 2. Finalizing Decisions

- **Revisits are Critical**: When a user asks to finalize a decision, **ALWAYS check if they want to schedule a revisit**.
- **Ask Explicitly**: If the user didn't mention a revisit date, ask: _"Would you like to schedule a revisit for this decision (e.g., in 3 months) to verify it's still valid?"_

### 3. Creating Drafts

- **Capture Context**: When creating a draft, summarize the ENTIRE context in the `context_markdown` field.
- **Don't be Lazy**: Do not just say "As discussed". Include the pros/cons, constraints, and key arguments raised in the chat.
- **Variants**: If specific options were discussed, create them as variants immediately.

### 4. Tone & Style

- **Objective**: Asynq is a system of record. Be professional, concise, and objective.
- **No Fluff**: Avoid "Here is the decision..." preambles date context. Just state the context.

---

## Architecture

This server is designed as a **lightweight proxy**.
It handles the JSON-RPC communication locally and forwards authenticated requests to the Asynq API (`https://asynq.org/mcp`).
This ensures:

1.  **Security**: Your PAT (Personal Access Token) is handled securely.
2.  **Updates**: New tools added to the Asynq platform are instantly available without updating this local server.

---

## Examples

### Example 1: Create a decision with options

**User prompt:** "I need to decide whether to use PostgreSQL or MongoDB for our new project. Create a decision for this."

**Expected behavior:**

- Asynq creates a new draft decision titled "Database choice: PostgreSQL vs MongoDB"
- Two variants are created for each option
- Returns confirmation with link to the decision

### Example 2: Search and review past decisions

**User prompt:** "What did we decide about our pricing strategy?"

**Expected behavior:**

- Asynq searches decisions for "pricing"
- Returns matching decisions with their status (draft/final)
- Shows which option was selected for finalized decisions

### Example 3: Add context to an ongoing discussion

**User prompt:** "Add a comment to the database decision saying that MongoDB has better horizontal scaling for our use case"

**Expected behavior:**

- Asynq finds the relevant decision
- Adds the comment to the decision's discussion thread
- Confirms the comment was posted with author attribution

### Example 4: Finalize a decision

**User prompt:** "We've decided to go with PostgreSQL. Finalize the database decision with a note that we chose it for its ACID compliance."

**Expected behavior:**

- Asynq marks PostgreSQL variant as the selected option
- Adds the final note about ACID compliance
- Decision status changes from draft to final
- Returns confirmation with the finalized decision details

### Example 5: Schedule a decision revisit

**User prompt:** "Set a reminder to revisit our database decision in 6 months"

**Expected behavior:**

- Asynq schedules a revisit date 6 months from now
- Returns confirmation with the scheduled date
- User will receive a reminder when the date arrives

---

## Development

### Prerequisites

- [Bun](https://bun.sh) (v1.0.0 or later)
- An Asynq Account

### Setup

1.  Clone this repository.
2.  Install dependencies:
    ```bash
    bun install
    ```
3.  Build the project:
    ```bash
    bun run build
    ```

### Testing Locally

You can run the server directly:

```bash
export ASYNQ_PAT="your-pat-here"
bun run start
```

---

## Bundling for Distribution (.mcpb)

The `.mcpb` file is a standard ZIP archive containing the extension code and manifest.
**It is treated as a binary release artifact and should NOT be committed to the repository.**

### Generating Locally

To generate it locally for testing:

```bash
bun run bundle
```

This will run `mcpb pack . asynq.mcpb`, creating the bundle in the root directory.
You can drag and drop `asynq.mcpb` into Claude Desktop to install the extension.

---

## Release Workflow (CI/CD)

We use GitHub Actions to automate the release process. When a new tag (e.g., `v1.0.1`) is pushed:

1.  The workflow builds the project (`bun run build`).
2.  It uses `mcpb` to pack the extension (`bun run bundle`).
3.  It creates a GitHub Release and attaches the `.mcpb` file as a downloadable asset.

Users can then download the latest version from the [Releases page](../../releases).

---

## Privacy Policy

This extension communicates with the Asynq platform to provide decision-making capabilities within Claude Desktop (or other compatible MCP clients). It sends the following information to the Asynq API:

- Decision titles, descriptions, and comments
- User authentication credentials (Personal Access Token)
- Search queries and filter parameters

**Note**: The extension does NOT send any conversation content or user messages to the Asynq API. It only sends the structured data required to create and manage decisions.

All data is handled in accordance with the [Asynq Privacy Policy](https://asynq.org/privacy).

---

## License

MIT
