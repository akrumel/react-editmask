

export default function isPatternOperator(opCandidate) {
	switch (opCandidate) {
		case "*":
		case "?":
		case "+":
		case "!":
			return true;
		default:
			return false;
	}
}
