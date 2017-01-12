import isOperator from "./isPatternOperator";


export default function extractGroupPattern(token) {
	var count = token.length - (isOperator(token[token.length - 1]) ?3 :2);

	return token.substr(1, count);
}
