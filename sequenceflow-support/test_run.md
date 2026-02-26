# n8n Test Run

## 1. Import workflow
- Open n8n → Workflows → Import from file
- Select `sequenceflow-support/workflow.json`
- Save workflow

## 2. Test template path (e.g. damaged)
- Open node **Parse Email** → click **Test step**
- Paste as mock input (from `testcases.json` case 1):
  ```json
  {
    "Subject": "Mijn pakket is beschadigd aangekomen",
    "From": "Jan Dekker <jan.dekker@gmail.com>",
    "snippet": "Goedemiddag, ik heb zojuist mijn pakket ontvangen maar het is duidelijk beschadigd.",
    "text": "Goedemiddag, ik heb zojuist mijn pakket ontvangen maar het is duidelijk beschadigd. De doos is ingedeukt en een van de producten is kapot. Ordernummer: 4839201."
  }
  ```
- Run → confirm output contains:
  - `intent: "damaged"`
  - `route: "template"`
  - `shouldProcess: true`

## 3. Run through template branch
- Click **Execute workflow from here** on **Parse Email**
- Open **Edit Fields** output → confirm:
  - `$json.draft.subject` = `"Re: Mijn pakket is beschadigd aangekomen"`
  - `$json.draft.body` starts with `"Beste Jan Dekker,"`

## 4. Open Normalize Output → confirm output shape
- `$json.draft.subject` present ✓
- `$json.draft.body` present, no "SequenceFlow" or personal name lines ✓

## 5. Test HTTP path (order_status)
- Open node **Parse Email** → Test step with mock input:
  ```json
  {
    "Subject": "Status van mijn bestelling opvragen",
    "From": "Mark Verhoeven <mark.verhoeven@gmail.com>",
    "snippet": "Dag, ik vraag me af wat de huidige status is van mijn bestelling.",
    "text": "Dag, ik vraag me af wat de huidige status is van mijn bestelling. Tracking nummer?. Ordernummer: 8374621."
  }
  ```
- Confirm output: `intent: "order_status"`, `route: "http"`
- Open **HTTP Request** output → confirm body fields present:
  - `text`, `intent`, `customerName`, `subject`, `from`

## 6. Verify Gmail draft creation
- Open **Create a draft** node → confirm expressions resolve:
  - Subject field: `={{ $json.draft.subject }}` → not empty
  - Message field: `={{ $json.draft.body }}` → not empty
- Execute → check Gmail Drafts folder for the created draft
