import isPatternOperator from "./isPatternOperator";


/*
	Helper class to count minimum and maximum number of an edit mask token allowed to exist
	in the value string.
*/
export default class CountSpec {
	constructor(token) {
		var op = token.length > 1 && token[token.length-2] === "/"
			?""
			:token[token.length-1];

		if (isPatternOperator(op, token)) {
			switch (op) {
				case "*":
					this.operator = op;
					this.min = 0;
					this.max = Number.MAX_SAFE_INTEGER;

					break;
				case "?":
					this.operator = op;
					this.min = 0;
					this.max = 1;

					break;
				case "+":
					this.operator = op;
					this.min = 1;
					this.max = Number.MAX_SAFE_INTEGER;

					break;
				case "!":
					this.operator = op;
					this.min = 1;
					this.max = 1;

					break;
				default:
					throw new Error(`Unknown operator: ${op}`);
			}
		} else {
			this.min = -1;
			this.max = -1;
		}
	}

	isDefault() {
		return this.min === -1;
	}

	isOneOrMore() {
		return this.operator === "+";
	}

	isOptional() {
		return this.operator === "?";
	}

	isOptionalToken() {
		return this.isOptional() || this.isZeroOrMore();
	}

	isRequired() {
		return this.operator === "!";
	}

	isZeroOrMore() {
		return this.operator === "*";
	}
}
