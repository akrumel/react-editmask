import { isBoolean } from "lodash";

import CountSpec from "./CountSpec";
import extractGroupPattern from "./extractGroupPattern";
import nextToken from "./nextPatternToken";

import { anyCharTestFn, digitTestFn } from "./patternTests";


/*
	Determines if a character is a matching/valid character for an edit mask pattern.

	Parameters:
		ch - the character to check
		pattern - the edit mask pattern
		pidx - index into the pattern
		countSpec - the CountSpec instance for the pattern

	Returns one of three values:
		true - yes
		false - no
		null - maybe but not this token (optional)
*/
export default function isValidPatternCharacter(ch, pattern, pidx, eatInvalid) {
	var checking;

	do {
// console.log(`Start loop: ch=${ch}, sym=${pattern[pidx]}, pattern=${pattern}, pidx=${pidx}`)
		switch(pattern[pidx]) {
			case '.':  // any characater
				var { result, nextIdx } = isValidCharacter(ch, pattern, pidx, eatInvalid, anyCharTestFn);
				break;
			case '(':  // capture group
				var { result, nextIdx } = isValidGroupCharacter(ch, pattern, pidx, eatInvalid);
				break;
			case 'd':  // digit
				var { result, nextIdx } = isValidCharacter(ch, pattern, pidx, eatInvalid, digitTestFn);
				break;
			default:   // literal
				var { result, nextIdx } = isValidLiteral(ch, pattern, pidx);
		}

		checking = eatInvalid ?result == null :result === undefined;

		// console.log(`isValidPatternCharacter(): sym=${pattern[pidx]}, ch=${ch}, pattern=${pattern}, ` +
		// 		`pidx=${pidx}, eatInvalid=${eatInvalid}, result=${result}, nextIdx=${nextIdx}, checking=${checking}`);

		pidx = nextIdx;
	} while (checking && pidx < pattern.length);

	return result === undefined ?null :result;
}


/**************************************************************************************************
	Helper functions for isValidPatternCharacter()
***************************************************************************************************/

export function isValidCharacter(nextCh, pattern, pidx, eatInvalid, testFn) {
	const valid = testFn(nextCh);

	if (valid) {
		// no need for nextIdx since done
		return { result: true };
	}

	const token = nextToken(pidx, pattern);
	const countSpec = new CountSpec(token);

	return {
		result: (countSpec.isOptionalToken() || eatInvalid) && null,  // false or null
		nextIdx: pidx + token.length,
	}
}

export function isValidGroupCharacter(ch, pattern, pidx, eatInvalid) {
	const groupMask = nextToken(pidx, pattern);
	const groupPattern = extractGroupPattern(groupMask);
// console.log(`isValidGroupCharacter() - ch=${ch}, groupPattern=${groupPattern}, groupMask=${groupMask}, ` +
// 		`pattern=${pattern}, pidx=${pidx}, valid=${valid}`)

	const valid = isValidPatternCharacter(ch, groupPattern, 0, eatInvalid);

	if (valid) {
		// no need for nextIdx since done
		return { result: valid }
	}

	const countSpec = new CountSpec(groupMask);

	return {
		result: countSpec.isOptionalToken() && null,  // false or null
		nextIdx: pidx + groupMask.length,
	}
}

export function isValidLiteral(ch, pattern, pidx) {
	const literalEscape = pattern[pidx] == '/';
	const sym = literalEscape ?pattern[pidx+1] :pattern[pidx];

// console.log(`isValidLiteral() - ch=${ch}, sym=${sym}, escape=${literalEscape}, valid=${ch === sym}`)
	if (ch === sym) {
		return { result: true }
	}

	const token = nextToken(pidx, pattern);

	return { nextIdx: pidx + token.length };
}

