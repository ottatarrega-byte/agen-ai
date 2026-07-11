# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This repo is a single-script CrewAI agent (`main.py`) that organizes a user's macOS `~/Downloads` folder. It defines one CrewAI `Agent` ("Macbook Expert") with one custom `@tool`, wraps it in a `Task`, and runs it through a `Crew`. The LLM backing the agent is DeepSeek (`deepseek/deepseek-chat`), accessed via the `crewai.LLM` wrapper pointed at `https://api.deepseek.com`.

There is currently no dependency manifest (no `requirements.txt`/`pyproject.toml`), no test suite, and no linter configuration in the repo — `crewai` is not installed in this environment.

## Running the script

```bash
pip install crewai
export DEEPSEEK_API_KEY=<your-key>   # required; read via os.environ.get in main.py
python3 main.py
```

The script prints a startup banner, then the agent scans `~/Downloads`, prints a proposed file-organization plan, and prompts interactively (`input()`) for `Y/N` confirmation before moving any files. There is no non-interactive/dry-run mode — running it will block on stdin.

## Architecture

`main.py` follows the standard CrewAI single-agent pattern, all in one file:

1. **LLM setup** — `LLM(...)` configured for DeepSeek's OpenAI-compatible API, using `DEEPSEEK_API_KEY` from the environment.
2. **Tool** (`kelola_file_downloads`) — the only piece of actual logic. It:
   - Lists files directly under `~/Downloads` (non-recursive).
   - Buckets each by extension into one of: `PDF`, `Gambar` (images), `Audio`, `Video`, `Dokumen` (default/fallback category, including office docs, text, csv).
   - Prints the planned moves and asks for interactive confirmation (`input()`) before executing.
   - On confirmation, creates category subfolders as needed and uses `shutil.move` to relocate each file.
3. **Agent** (`file_manager_agent`) — role/goal/backstory strings are in Indonesian; bound to the DeepSeek `llm` and the single tool above, with `allow_delegation=False`.
4. **Task** (`organize_task`) — instructs the agent to inspect `~/Downloads` and invoke the tool.
5. **Crew** — wires the single agent/task together and is kicked off under `if __name__ == "__main__"`.

Note: user-facing strings (agent role/goal/backstory, tool docstring, printed messages, the Y/N prompt) are written in **Indonesian** — preserve this language when editing them unless asked otherwise.

## CI

`.github/workflows/opencode.yml` wires up the `opencode` GitHub Action: any issue comment or PR review comment containing `/oc` or `/opencode` triggers an OpenCode run against the DeepSeek model, using the `DEEPSEEK_API_KEY` repo secret. This is unrelated to the CrewAI script itself — it's a chatops helper for repository comments.
