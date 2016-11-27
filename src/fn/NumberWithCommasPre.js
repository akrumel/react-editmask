
export default function NumberWithCommasPre(value, config) {
	var { selectionStart, selectionEnd } = config;
	const next = value && value.replace(/,/g, '');

	if (next === value) { return value }

	// compare nextValue and value until selectionStart and adjust for each removed char
	var nidx = 0;
	var vidx = 0;

	while (nidx < selectionStart) {
		if (next[nidx] !== value[vidx]) {
			selectionStart--;
			selectionEnd--;
		} else {
			nidx++;
		}

		vidx++;
	}

	config.selectionEnd = selectionEnd;
	config.selectionStart = selectionStart;

	return next
}