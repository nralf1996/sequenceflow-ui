const input = $input.item.json;

let subject = '';
let body = '';

if (input.draft && input.draft.subject && input.draft.body) {
  subject = input.draft.subject;
  body = input.draft.body;
} else if (input.subject && input.body) {
  subject = input.subject;
  body = input.body;
} else {
  const name = input.customerName || 'klant';
  subject = 'Re: ' + (input.subject || '');
  body =
    'Beste ' + name + ',\n\n' +
    'Dank voor uw bericht.\n\n' +
    'Kunt u ons uw ordernummer doorgeven? Dan helpen wij u direct verder.\n\n' +
    'Met vriendelijke groet,';
}

const SIGNATURE_PATTERN = /^(sequenceflow|navaron|ralf)$/i;

body = body
  .split('\n')
  .filter(line => !SIGNATURE_PATTERN.test(line.trim()))
  .join('\n')
  .trimEnd();

const draft = { subject, body };

return [{ json: { ...input, draft } }];
