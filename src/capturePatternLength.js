

export default function capturePatternLength(pidx, pattern) {
	var length = 0;
	var escapeActive = false;    // flag to track when literal escape is active
	var depth = 0;               // count depth of group patterns
	var sym;

	while ((sym = pattern[pidx+length+1]) != ")" || escapeActive || depth) {
		if (!escapeActive) {
			if (sym == "(") {
				depth++;
			} else if (sym == ")") {
				depth--;
			}
		}

		escapeActive = sym === "/" && !escapeActive;
		length++;
	}

	return length + 2/* parens */;
}

