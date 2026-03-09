# Plan: Convert Claude Code Configuration to Gemini CLI

This plan outlines the steps to migrate agents, skills, and project configurations from Claude Code (`.claude/`) to Gemini CLI (`.gemini/`), utilizing Gemini's native Subagent and Skill architectures.

## 1. Goal
Provide a seamless transition for the AI agent to use existing project expertise, specialized roles, and complex workflows when operating via Gemini CLI.

## 2. Research & Mapping

### 2.1 Tool Mapping
Claude Code and Gemini CLI use different names for similar tools. Instructions in converted subagents and skills must be updated:

| Claude Tool | Gemini CLI Tool |
| :--- | :--- |
| `Read` | `read_file` |
| `Write` | `write_file` |
| `Edit` | `replace` |
| `Bash` | `run_shell_command` |
| `Glob` | `glob` |
| `Grep` | `grep_search` |
| `Task` | Calling a specific Subagent or `generalist` |

### 2.2 Architectural Mapping
- **Claude Agents** (`.claude/agents/*.md`) → **Gemini Subagents** (`.gemini/agents/*.md`)
  - These are specialized, autonomous agents that the main agent can delegate tasks to.
- **Claude Skills** (`.claude/skills/<skill-name>/SKILL.md`) → **Gemini Skills** (`.gemini/skills/<skill-name>/SKILL.md`)
  - These provide expert procedural guidance to the main agent when activated.
- **`CLAUDE.md`** → **`GEMINI.md`**
  - Foundational project mandates and architectural rules.

## 3. Implementation Strategy

### Step 3.1: Configuration & Structure
1. Create `.gemini/agents/` and `.gemini/skills/` directories.
2. Enable subagents in the project's `settings.json`:
   ```json
   {
     "experimental": {
       "enableAgents": true
     }
   }
   ```

### Step 3.2: Convert Agents to Subagents
For each agent in `.claude/agents/` (e.g., `be-coder`, `fe-reviewer`):
1. Create `.gemini/agents/<agent-name>.md`.
2. Map YAML frontmatter:
   - `name`: Unique slug (e.g., `be-coder`).
   - `description`: Instructions for the main agent on when to delegate to this subagent.
   - `tools`: Explicitly list the Gemini tools the subagent needs.
3. Update the Markdown body:
   - Convert instructions to a system prompt persona.
   - Update all tool references to Gemini tool names.

### Step 3.3: Migrate and Adapt Complex Skills
For `plan-and-do` and `review` skills:
1. Create `.gemini/skills/<skill-name>/SKILL.md`.
2. Migrate all supporting `.md` files to the same directory.
3. Update complex workflow steps to use Gemini CLI tool names and syntax.
4. Replace `Task` tool calls with delegation to specific project subagents.

### Step 3.4: Create `GEMINI.md`
1. Extract architectural rules and coding standards from `CLAUDE.md`.
2. Format them for `GEMINI.md` as foundational mandates.

## 4. Validation Plan

1. **Discovery Test**: 
   - Run `gemini agents list` to verify subagents are recognized.
   - Run `gemini skills list` to verify skills are recognized.
2. **Subagent Delegation Test**: Ask the main agent to perform a task specific to a subagent (e.g., "Analyze the backend entities") and verify it calls the subagent tool.
3. **Skill Activation Test**: Activate the `plan-and-do` skill and verify it can correctly follow the procedural steps using the new tool names.

## 5. Cleanup
- Keep `.claude/` for reference during the transition.
- Once migration is verified, suggest removal or archival of `.claude/`.
