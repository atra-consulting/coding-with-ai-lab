# Übungsaufgaben

## Agenten selber erstellen und anpassen
### Security Reviewer Subagent erstellen
```
git clone https://github.com/atra-consulting/coding-with-ai-lab.git
cd coding-with-ai-lab
claude
```

Prompt für Claude:
```
/plan-and-do Create a new security-reviewer agent. It checks both front-end and 
back-end code for common security vulnerabilities and security best practices.
It replaces all existing security review functionality in all ./claude/agents.
Update CLAUDE.md and all ./claude/agents with this new agent.
```

### Subagent, Skills & Specs portieren
```
git clone https://github.com/spring-projects/spring-petclinic.git
cd spring-petclinic
claude
```

Prompt für Claude:
```
../coding-with-ai-lab has custom project skills, subagents, and specs (what does
the application do how?) in docs/specs. Copy all of them over here and adapt them
to the technnology stack in this repo. Also create a CLAUDE.md that references
the subagents and specs and lists when to use each agent. Split the specs to match
subagents - ideally, each subagent has to read just one spec file. Keep CLAUDE.md
as small as possible, moving as much content into the specs or the subagents. Your
writing style: As short & brief as possible, short sentences, simple words 
non-native speakers understand, no passive voice. Use sentence fragments.
```
## Software Factory
### Software Factory bauen

```
cd coding-with-ai-lab
start.sh
```
Als Admin einloggen, dann "gent-Aufgaben" öffnen

Dashboard existing in der App.

## Agentenbasierte Software-Entwicklung
### Tickets im KI-Dialog umsetzen


