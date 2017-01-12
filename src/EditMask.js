import { assert } from "akutils";
import defaults from "lodash.defaults";
import clone from "lodash.clone";
import isUndefined from "lodash.isundefined";

import capturePatternLength from "./capturePatternLength";
import CountSpec from "./CountSpec";
import extractGroupPattern from "./extractGroupPattern";
import isOperator from "./isPatternOperator";
import isValidPatternCharacter from "./isValidPatternCharacter";
import nextToken from "./nextPatternToken";
import { anyCharTestFn, digitTestFn } from "./patternTests";


const defaultOptions = {
	appendLiterals: false,
	eatInvalid: true,
	lookahead: true,
	postprocess: config => { },
	preprocess: (value, config) => value,
}


/*
	Class implements edit masking support. In this case edit masking means processing an
	input value in relation to a pattern such that the resulting text string conforms to
	the pattern. Patterns are defined using a combination of symbols and literals.
	A symbol represents a class of characters, such as numeric or alphabetic character.
	Literals are characters that are specific values that should occur in the string.
	Literals are automatically inserted into the processed string when they are missing.
	Placing a question mark (?) after a symbol or literal makes it optional.

	The pattern syntax is a simplified regular expression syntax.

	EditMask instances are stateless. This means each call to process() is independent.

	Why yet another edit masking library?
		The driving factor was the need to correctly position the cursor within the React environment.
		The cursor will tend to move to the end of a controlled input field when the value is altered
		during the update process. The EditMask.process() method tracks where the cursor should be placed
		after pattern processing. A component can then used the returned selectionStart and selectionEnd
		object properties to update the cursor position in the component's componentDidUpdate() method.

		For example:
		 	handleChange: function(event) {
		 		var masked = dateMask.processForElt(value, event.target);

				this.selectionStart = masked.selectionStart;
				this.selectionEnd = masked.selectionEnd;

				// do update stuff here
			},

		 	componentDidUpdate: function(prevProps, prevState) {
		 		if (this.selectionStart != null) {
		 			var elt = React.findDOMNode(this.refs.input);

			    	elt.setSelectionRange(this.selectionStart, this.selectionEnd);
			    	this.selectionStart = null;
		 		}
		 	},

	Pattern expressions:
		. - any single character except newline
		d - digit
		? - makes previous symbol or literal optional
		+ - one or more of the previous symbol or literal
		* - zero or more of the previous expression
		() - capture grouping
		/ - next symbol character becomes a literal value (notice using the forward slash and not the
		    backslash to make reading expression strings easier)
		! - makes the previous expression required and is only meaningful after a literal. Literals are
		    automatically inserted if there are characters to process in the input value when lookahead is
		    set to true. The '!' after a literal means the user must actually input the literal character
		    for it to be inserted into the matched text.
		all other - literal value

	Pattern examples:
		SSN: ddd-dd-dddd
		Date: dd?//dd?//dddd    (forward slash is the literal escape character - not backslash)
		Phone: /(ddd/) ddd-dddd  (space is a literal value, parentheses are used for group expressions
			                      so must be escaped when used as a literal)
		Currency: d+(.d?d?)?      (currently '.' is not a pattern symbol as it is in regular expressions.
		                          parentheses are used to group a set of pattern expressions, usually
		                          to apply an multiplicity operator like '?' or '+')

	An edit mask behavior can be configured using the following options:
		lookahead - the current input character is matched against subsequent pattern commands when the
			current input character does not match the current pattern command. Default is true.
		eatInvalid - discards input characters that do not match the pattern. Lookahead takes precedence
			over this option. If lookahead is enabled, this means the current input character will
			first be matched against future pattern symbols and only discarded if no future match is found.
			Default is true.
		appendLiterals - automatically appends matching literals following end of input string processing.
			This is handy when a pattern ends with one or more literals. With this option, the terminating
			literals are appended as soon as the last non-literal character is entered. This could be awkward
			if the last non-terminal symbol is optional. Default is false.

	Lookahead explained
		Two common scenarios drive the lookahead feature:
			1) Numbers formatted by symbols: examples include telephone number and ssn. In these cases it
			   is convenient for the user to type the numbers and have the symbols automatically inserted
			2) Copy-and-paste: similar to #1 but in this case a formatted value is pasted into an input
			   field, often in a different format. It is handy to have the invalid values removed and the
			   proper formatting inserted

		Lookahead is the feature that enables auto insertion of literal values, such as the '-' in ssn
		and the '()' around the area code in a telephone number. Lookahead is used by the EditMask as long
		as there is input to process. In the current implementation, lookahead halts when an expression
		using one of the multiplicity operators (?, *, +) is encountered.

	Not yet implemented pattern symbols (implement as needed):
		a - alpha character (case insensitive)
		U - uppercase alpha (converts lowercase letters)
		L - lowercase alpha
		w - alpha or numerical (case insensitive)
		{m[,n]} - m..n of the previous symbol or literal

	Design note
		The goal of the EditMask class is to use a syntax similar to regular expressions to perform
		masking of textual input. The goal is NOT to implement a regular expression library - javascript
		already has a very nice one. To that end, only features needed to implement

	Potential improvement
		Smart lookahead/eatInvalid decision making. In the event of a mismatch perform processing
		for rest of string/pattern for both cases. Choose the lookeahed or eatInvalid based on
		which yields a longer string (or actually utilizes the most pattern commands). Ideally
		would be possible to use the results to prevent having process the input again.
*/
export default class EditMask {
	constructor(pattern, options={ }) {
		const opts = defaults({}, options, defaultOptions);

		this.appendLiterals = opts.appendLiterals;
		this.eatInvalid = opts.eatInvalid;
		this.lookahead = opts.lookahead;
		this.pattern = pattern;
		this.postprocess = opts.postprocess;
		this.preprocess = opts.preprocess;
	}

	processForElt(value, elt) {
		return this.process(value, elt.selectionStart, elt.selectionEnd)
	}

	process(value, selStart=0, selEnd=0) {
		var config = {
			pattern: this.pattern,
			pidx: 0,                    // index into the pattern
			vidx: 0,                    // index into the value
			text: "",                   // the processed text
			selectionStart: selStart,
			selectionEnd: selEnd,
			usedLookahead: false,
			groups: [],                 // the matched groups
			complete: false,            // did evaluation of value utilize entire pattern

			// scratch variables used by pattern processing
			// counter for number of reads using current pattern symbol when repeating operator
			//     attached (+ or *)
			conseqReads: 0,
			//text for the current grouping
			currGroup: "",

			// count group depth recursion
			iters: 0,

			captureGroup() {
				if (this.currGroup) {
					this.groups.push(this.currGroup);

					this.currGroup = "";
				}
			}

		}

		value = this.preprocess(value, config);

		this._evaluate(value, config);

		this.postprocess(config);

		//truncated text handling
		var truncatedValue;
		var truncatedCursor;

		if (config.vidx < value.length) {
			truncatedValue = value.substring(config.vidx);
			truncatedCursor = config.selectionStart;
		}

		// make sure selection is not greater than text length. This can happen when pattern finishes
		//  before end of text that contains the cursor
		config.selectionStart = Math.min(config.selectionStart, config.text.length);
		config.selectionEnd = Math.min(config.selectionEnd, config.text.length);

		return {
			text: config.text,
			complete: config.complete,
			selectionStart: config.selectionStart,
			selectionEnd: config.selectionEnd,
			groups: config.groups,
			truncatedValue: truncatedValue,
			truncatedCursor: truncatedCursor,
		}
	}

	/*
		Evaluates a value against
	*/
	_evaluate(value, config) {
		config.iters++;

		try {
			if (value == null || value == undefined) {
				config.text = value;
				config.complete = false;

				return;
			}

			var pattern = config.pattern;
			var plen = pattern.length;
			var lastPidx, token, countSpec;
			var processing = true;

			// Note: this loop will keep going even if value has been exceeded so can handle literal values
			//       at end of pattern
			while (config.pidx < plen && processing) {
				// only parse tokens when pattern index changes
				if (config.pidx != lastPidx) {
					token = nextToken(config.pidx, pattern);
					countSpec = new CountSpec(token);
				}

				let ch = value[config.vidx];
				// flag to indicate processing before the cursor. note, always true if appending literals
				// because no input string characters remaining and cursor was at end of input value
		        let posBeforeSelStart = config.text.length < config.selectionStart
		        						|| (!ch && config.text.length==config.selectionStart);

		        // handy line for debugging jest tests
		        // console.log(`sym=${sym}, ch=${ch}, isNumber=${isNumber} pidx=${pidx}, vidx=${vidx}`)

				if (ch && config.iters==1 && !isValidPatternCharacter(ch, pattern, config.pidx, this.eatInvalid)) {
					if (this.eatInvalid) {
						eatInvalid(config, posBeforeSelStart);
						continue;
					} else {
						config.captureGroup();
						config.complete = !config.usedLookahead && config.pidx >= pattern.length;

						return;
					}
				}

				switch(token[0]) {
					case '.':  // any characater
						processing = this._evaluateAnyChar(ch, token, countSpec, posBeforeSelStart, config);

						break;
					case '(':  // capture group
						processing = this._evaluateCaptureGroup(value, token, countSpec, posBeforeSelStart, config);

						break;
					case 'd':  // digit
						processing = this._evaluateDigit(ch, token, countSpec, posBeforeSelStart, config);

						break;
					default:   // literal
						processing = this._evaluateLiteral(ch, token, countSpec, posBeforeSelStart, config);
				}
			}

			config.captureGroup();
			config.complete = !config.usedLookahead && config.pidx >= pattern.length;
		} finally {
			config.iters--;
		}
	}

	_evaluateCaptureGroup(value, token, countSpec, posBeforeSelStart, config) {
		var oneOrMore = countSpec.isOneOrMore();
		var zeroOrMore = countSpec.isZeroOrMore();
		var repeatable = zeroOrMore || oneOrMore;
		var origConfig = clone(config);   // used to reset properties to value before capture
		var iterations = 0;                 // count number of time capture group evaluated
		var prevConfig;                     // used for multiple iteration reset support

		// reconfigure the state object for recursive use
		config.groups = [];                 // all groups from this capture groups will be stored in an array
		config.pattern = extractGroupPattern(token); //config.pidx, config.pattern);
		config.usedLookahead = false;       // turn off lookahead

		do {
			prevConfig = clone(config);

			config.complete = false;
			config.pidx = 0;          // recursively evaluating the capture group's pattern
			this._evaluate(value, config);

			if (config.complete) {
				iterations++;
			}
		} while (config.complete && repeatable);

		var capturedGroups = config.groups;

		// update config values
		config.pidx = origConfig.pidx + token.length; // update the pattern index first since used in calcs
		config.groups = origConfig.groups;    // further updated based on operator
		config.pattern = origConfig.pattern;
		config.usedLookahead = origConfig.usedLookahead;

		var keepProcessing;

		if (oneOrMore) {
			keepProcessing = iterations;

			// reset selection and text to previous iteration location
			config.selectionStart = prevConfig.selectionStart;
			config.selectionEnd = prevConfig.selectionEnd;
			config.text = prevConfig.text;

			if (keepProcessing) {
				// going to continue processing value from location of last capture group iteration
				config.vidx = prevConfig.vidx;           // reset the value index
				config.groups.push(prevConfig.groups);   // add the groups processed through prev iteration
			} else {
				config.vidx = origConfig.vidx;   // reset the value index
				config.groups.push(undefined);   // indicated capture group got nothing
			}
		} else if (zeroOrMore) {
			keepProcessing = true;

			// reset selection and text to previous iteration location
			config.selectionStart = prevConfig.selectionStart;
			config.selectionEnd = prevConfig.selectionEnd;
			config.text = prevConfig.text;

			if (iterations) {
				// going to continue processing value from location of last capture group iteration
				config.vidx = prevConfig.vidx;           // reset the value index
				config.groups.push(prevConfig.groups);   // add the groups processed through prev iteration
			} else {
				config.vidx = origConfig.vidx;   // reset the value index
				config.groups.push(undefined);   // indicated capture group got nothing
			}
		} else if (countSpec.isOptional()) {
			keepProcessing = true;

			if (config.complete) {
				config.groups.push(capturedGroups);
			} else {
				// going to continue processing value from location of last capture group iteration
				// so reset selection to original iteration location
				config.selectionStart = origConfig.selectionStart;
				config.selectionEnd = origConfig.selectionEnd;

				// reset the value index and text
				config.text = origConfig.text;
				config.vidx = origConfig.vidx;

				// indicated capture group got nothing
				config.groups.push(undefined);
			}
		} else {
			keepProcessing = config.complete;

			if (keepProcessing) {
				config.groups.push(capturedGroups);
			} else {
				// ate some characters and no more processing so move cursor back to original position
				config.selectionStart = origConfig.selectionStart;
				config.selectionEnd = origConfig.selectionEnd;

				// reset the value index and text
				config.text = origConfig.text;
				config.vidx = origConfig.vidx;

				// indicated capture group got nothing
				config.groups.push(undefined);
			}

		}

		config.complete = keepProcessing && config.pidx >= config.pattern.length;

		assert( a => a.not(isUndefined(keepProcessing), "keepProcessing must be explicitly set"));

		return keepProcessing;
	}

	_evaluateDigit(ch, token, countSpec, posBeforeSelStart, config) {
		return this._evaluationChar(ch, token, countSpec, posBeforeSelStart, config, digitTestFn);
	}

	_evaluateAnyChar(ch, token, countSpec, posBeforeSelStart, config) {
		return this._evaluationChar(ch, token, countSpec, posBeforeSelStart, config, anyCharTestFn);
	}

	_evaluationChar(nextCh, token, countSpec, posBeforeSelStart, config, testFn) {
		var ch = testFn(nextCh);
		var optional = countSpec.isOptional();
		var zeroOrMore = countSpec.isZeroOrMore();
		var oneOrMore = countSpec.isOneOrMore();
		var pinc = token.length;
		var lidx;

		if (!nextCh) {
			if (optional) {
				config.pidx += pinc;
			} else if (zeroOrMore) {
				config.conseqReads = 0;
				config.pidx += pinc;
			} else if (oneOrMore) {
				if (config.conseqReads) {
					config.conseqReads = 0;
					config.pidx += pinc;
				} else {
					return false;
				}
			} else {
				return false;
			}
		} else if (ch) {
			config.text += ch;
			config.currGroup += ch;
			config.vidx++;

			if (oneOrMore || zeroOrMore) {
				config.conseqReads++;
			} else {
				config.pidx += pinc;
			}
		} else if (optional) {
			config.pidx += pinc;
		} else if (zeroOrMore) {
			config.conseqReads = 0;
			config.pidx += pinc;
		} else if (oneOrMore) {
			if (config.conseqReads) {
				config.conseqReads = 0;
				config.pidx += pinc;
			} else {
				return false;
			}
		} else if (this.lookahead && (lidx=doLookahead(config.pidx+pinc, nextCh, config.pattern))) {
			config.pidx = lidx;
			config.usedLookahead = true;
		} else if (this.eatInvalid) {
			eatInvalid(config, posBeforeSelStart);
		} else {
			return false;
		}

		return true;   // more to do
	}

	_evaluateLiteral(ch, token, countSpec, posBeforeSelStart, config) {
		var sym = token[0];
		var pinc = token.length;
		var optional = countSpec.isOptional()
		var oneOrMore = countSpec.isOneOrMore();
		var zeroOrMore = countSpec.isZeroOrMore();
		var required = countSpec.isRequired();

		// if patterns symbol is the literal escape character then update the pattern
		// symbol info to account
		if (sym == '/') {
			if (token.length === 1) {
				throw new Error("/ literal escape character cannot terminate a pattern");
			}

			// side effects of accounting for literal escape character
			sym = token[1];
		}

		if (sym == ch) {              // symbol and value character match
			config.captureGroup();

			config.text += sym;
			config.vidx++;

			if (oneOrMore || zeroOrMore) {
				config.conseqReads++;
			} else {
				config.pidx += pinc;
			}
		} else if (countSpec.isDefault() && (ch || this.appendLiterals)) {
			// value character is not a match and no multiplicity operator so append the current
			// literal token and keep processing
			config.captureGroup();

			// do not increment value index
			config.text += sym;
			config.pidx += pinc;

			if (posBeforeSelStart) {
				config.selectionStart++;
				config.selectionEnd++;
			}
		} else {
			if (ch && optional) {
				// still have input and literal was optional so go to next token
				config.pidx += pinc;
			} else if (zeroOrMore) {
				// not a match and match not necessary so go to next token
				config.conseqReads = 0;
				config.pidx += pinc;
			} else if (ch && oneOrMore) {
				// not a match and only continue if matched literal at least once
				if (config.conseqReads) {
					config.conseqReads = 0;
					config.pidx += pinc;
				} else {
					return false;
				}
			} else if (!ch && oneOrMore && config.conseqReads) {
				// handle case where no more characters and + at end and have read at least
				// one macthing character
				config.conseqReads = 0;
				config.pidx += pinc;
			} else {
				// done processing
				return false;
			}
		}

		return true;    // more to do
	}
}


/**************************************************************************************************
	helper functions
***************************************************************************************************/

/*
	Finds the next matching pattern symbol for the current value character.
*/
function doLookahead(pidx, ch, pattern, testFn) {
	for (let lidx=pidx, sym; sym=pattern[lidx]; lidx++) {
		let listeralEscape = sym == '/';
		let operatorIdx = listeralEscape ?lidx+2 :lidx+1;
		let optional = pattern[operatorIdx] == '?'
		let oneOrMore = pattern[operatorIdx] == '+'

		if (listeralEscape && lidx+1 == pattern.length) {
			throw new Error("/ literal escape character cannot terminate a pattern");
		}

		switch (sym) {
			case '.':  // number required
				if (anyCharTestFn(ch)) {
					return lidx;
				}

				break;
			case '(':  // capture group
				// not exactly clear how capture groups should be handled so doing something simple for
				// now and just stopping when hit one.
				return lidx
			case 'd':  // number required
				if (digitTestFn(ch)) {
					return lidx;
				}

				break;
			default:   // literal
				if (listeralEscape) {
					sym = pattern[lidx+1];
				}

				if (sym == ch) {
					return lidx;
				}
		}

		if (listeralEscape) {
			// consume the escape operator
			lidx++;
		}

		if (oneOrMore || optional) {
			//consume the operator: + or ?
			lidx++;   // for loop will also ++
		}
	}
}

function eatInvalid(config, posBeforeSelStart) {
	config.vidx++;

	if (posBeforeSelStart) {
		config.selectionStart--;
		config.selectionEnd--;
	}
}




