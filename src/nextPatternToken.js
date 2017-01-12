
import capturePatternLength from "./capturePatternLength";
import isPatternOperator from "./isPatternOperator";


export default function nextPatternToken(pidx, pattern) {
	var sym = pattern[pidx];
	var length;

	switch (sym) {
		case "(":
			length = capturePatternLength(pidx, pattern);

			if (isPatternOperator(pattern[pidx + length])) {
				length++;
			}

			break;
		case "/":
			length = isPatternOperator(pattern[pidx + 2]) ?3 :2;

			break;
		case "d":
		case ".":
		default:
			length = isPatternOperator(pattern[pidx + 1]) ?2 :1;
	}

	return pattern.substr(pidx, length);
}
