const raw = $json.__test
  ? {
      Subject: 'Waar blijft mijn bestelling?',
      From: 'Sara Janssen <sara@example.com>',
      snippet: 'Waar blijft mijn bestelling?',
      text: 'Wat is de status van mijn bestelling?'
    }
  : $json;

const subject = raw.Subject || raw.subject || '';
const from    = raw.From    || raw.from    || '';
const snippet = raw.snippet || '';
const text    = raw.text    || raw.snippet || '';

let customerName = 'klant';
const nameMatch = from.match(/^([^<@\n]+?)\s*</);
if (nameMatch) {
  const candidate = nameMatch[1].trim();
  if (candidate.length > 0) customerName = candidate;
}

const haystack = (subject + ' ' + text).toLowerCase();

let intent = 'other';

if (/beschadigd|kapot|defect|stuk|krassen|scheur/.test(haystack)) {
  intent = 'damaged';
} else if (/waar blijft|niet ontvangen|nog niet binnen|te laat|vertraging/.test(haystack)) {
  intent = 'late_delivery';
} else if (/ontbreekt|missen|niet compleet|mist|ontbrekend/.test(haystack)) {
  intent = 'missing_items';
} else if (/retour|terugsturen|refund|terugbetaling/.test(haystack)) {
  intent = 'return';
} else if (/track|tracking|status|bezorg|levering|t&t/.test(haystack)) {
  intent = 'order_status';
}

const route = intent === 'order_status' ? 'http' : 'template';
const shouldProcess = true;
const confidence = 0.8;

return [{
  json: {
    shouldProcess,
    route,
    intent,
    confidence,
    customerName,
    subject,
    from,
    snippet,
    text
  }
}];
