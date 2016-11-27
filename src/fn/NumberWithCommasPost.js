
export default function NumberWithCommasPost(config) {
	var { selectionStart, selectionEnd, text } = config;

	if (!text) { return text }

	// courtesy of http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
	const parts = text.split(".");
	const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	var next = parts.length === 1 ?intPart :`${intPart}.${parts[1]}`;

	if (next.length === text.length) {
		return
	}

	// compare text and ptext until selectionStart and adjust for each added char
	var nidx = 0;
	var tidx = 0;

	while (nidx < selectionStart) {
		if (next[nidx] !== text[tidx]) {
			selectionStart++;
			selectionEnd++;
		} else {
			tidx++;
		}

		nidx++;
	}

	config.selectionEnd = selectionEnd;
	config.selectionStart = selectionStart;
	config.text = next;
}