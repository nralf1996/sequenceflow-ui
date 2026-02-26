RULES:

1. contract.json is leading.
2. workflow.json must always output:

{
  "draft": {
    "subject": "string",
    "body": "string"
  }
}

3. Gmail node must use:
{{$json.draft.subject}}
{{$json.draft.body}}

4. Never use draftBody or draftSubject.
5. Always normalize output in a final Code node.
6. Templates must NOT include a signature (no company name under greeting).
7. route = "template" or "http"
8. Every branch must end in normalized output.
