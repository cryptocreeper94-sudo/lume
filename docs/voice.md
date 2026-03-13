# Voice-to-Code Guide

Lume supports **voice programming** — speak your code and Lume converts it to working programs.

---

## CLI: `lume voice`

The interactive voice session reads transcribed text from your terminal.

### Basic Usage

```bash
lume voice
```

This starts an interactive session:
```
  ✦ Lume Voice — Interactive Voice-to-Code
  Engine: system · Language: en
  Mode: Batch (compile at end)

  1> create a variable called name and set it to Alice
  [transcribed] create a variable called name and set it to Alice ✓
  2> show the name on screen
  [transcribed] show the name on screen ✓
  3> compile

  ✦ 2 instructions captured. Compiling...
  ✓ Saved voice-session-1709884321.lume
  ✓ Compiled → voice-session-1709884321.js
```

### Flags

| Flag | Description |
|------|-------------|
| `--live` | Compile each line immediately (real-time feedback) |
| `--review` | Review all instructions before compiling |
| `--output=file.lume` | Save to a specific file |
| `--engine=whisper` | Specify speech recognition engine |

### Voice Commands

These special commands control the session (spoken or typed):

| Command | Action |
|---------|--------|
| `compile` / `done` | Finish and compile all instructions |
| `undo` | Remove the last instruction |
| `start over` | Clear all instructions |
| `read it back` | List all captured instructions |
| `pause` | Pause transcription |
| `continue` | Resume transcription |
| `delete line N` | Delete a specific line |

### Live Mode

```bash
lume voice --live
```

Each line is compiled immediately, showing the resulting AST or JavaScript:
```
  1> set the count to zero
  [compiled] let count = 0; ✓
  2> add 5 to the count
  [compiled] count = count + 5; ✓
```

---

## CLI: `lume listen`

A simpler, non-interactive mode. Reads from stdin and outputs a `.lume` file.

```bash
echo "create a greeting variable" | lume listen
echo "show hello world" | lume listen --english
```

Useful for piping from external speech recognition tools:
```bash
whisper transcribe audio.wav | lume listen > app.lume
```

---

## Playground (Browser)

The [Lume Playground](/playground) includes a **microphone button** for in-browser voice programming using the Web Speech API.

### How It Works

1. Click the 🎤 **Voice** button (or recording indicator)
2. Speak naturally in English
3. Your speech is transcribed in real-time
4. Transcription is cleaned (stutter collapse, filler stripping, spoken punctuation)
5. Cleaned text is appended to the editor
6. The pattern library compiles it live in the AST panel

### Voice Cleanup

The Transcription Cleanup Layer automatically processes:

| Feature | Example | Result |
|---------|---------|--------|
| **Stutter Collapse** | "set set the name" | "set the name" |
| **Filler Stripping** | "um like show the result" | "show the result" |
| **Spoken Punctuation** | "wait 5 seconds period" | "wait 5 seconds." |
| **New Line** | "new line show the result" | `\n`show the result |
| **Comma** | "create user comma name" | "create user, name" |

### Homophone Correction

The voice pipeline corrects common homophones:

| Spoken | Corrected |
|--------|-----------|
| "right" (context: assignment) | "write" |
| "no" (context: boolean) | "know" |
| "their" (context: variable) | "there" |
| "its" (context: possessive) | "it's" |
| "too" (context: addition) | "to" |
| "wait" (context: variable) | "weight" |
| "won" (context: number) | "one" |
| "for" (context: preposition) | "four" |
| "I" (context: variable) | "eye" |
| "see" (context: variable) | "sea" |

---

## Configuration

Voice settings can be customized in `.lume/voice-config.json`:

```json
{
    "voice": {
        "engine": "system",
        "language": "en",
        "compile_commands": ["compile", "done", "build it", "run it"],
        "cancel_commands": ["start over", "cancel", "clear all"],
        "undo_commands": ["undo", "take that back", "remove last"],
        "readback_commands": ["read it back", "what do I have", "show instructions"],
        "pause_commands": ["pause", "hold on", "wait"],
        "resume_commands": ["continue", "go ahead", "resume"]
    }
}
```

---

## Run-On Sentence Splitting

The voice pipeline automatically splits compound instructions:

**Input:** "create a user and then show the dashboard"  
**Split into:**
1. "create a user"
2. "show the dashboard"

Connectors recognized: `and then`, `then`, `after that`, `next`, `also`.
