jest.autoMockOff();

const isValidPatternCharacter = require("../isValidPatternCharacter").default;
const EditMask = require("../EditMask");

describe("isValidPatternCharacter()", () => {
	it("tests literal match - 'x'", function() {
		const pattern = "x";

		expect(isValidPatternCharacter('x', pattern, 0, false)).toBe(true);
		expect(isValidPatternCharacter('1', pattern, 0, false)).toBe(null);
		expect(isValidPatternCharacter('a', pattern, 0, false)).toBe(null);
	});

	it("tests any character - '.'", function() {
		const pattern = ".";

		expect(isValidPatternCharacter('1', pattern, 0, false)).toBe(true);
		expect(isValidPatternCharacter('a', pattern, 0, false)).toBe(true);
	});

	it("tests optional any character - '.?'", function() {
		const pattern = ".?";

		expect(isValidPatternCharacter('1', pattern, 0, false)).toBe(true);
		expect(isValidPatternCharacter('a', pattern, 0, false)).toBe(true);
	});

	it("tests digit character - 'd'", function() {
		const pattern = "d";

		expect(isValidPatternCharacter('1', pattern, 0, false)).toBe(true);
		expect(isValidPatternCharacter('a', pattern, 0, false)).toBe(false);
	});

	it("tests digit character - 'ddd'", function() {
		const pattern = "ddd";

		expect(isValidPatternCharacter('1', pattern, 0, false)).toBe(true);
		expect(isValidPatternCharacter('a', pattern, 0, false)).toBe(false);
	});

	it("tests optional digit character - 'd?'", function() {
		const pattern = "d?";

		expect(isValidPatternCharacter('1', pattern, 0, false)).toBe(true);
		expect(isValidPatternCharacter('a', pattern, 0, false)).toBe(null);
	});

	it("tests group with number - '(d)'", function() {
		const pattern = "(d)";

		expect(isValidPatternCharacter('1', pattern, 0, false)).toBe(true);
		expect(isValidPatternCharacter('a', pattern, 0, false)).toBe(false);
	});

	it("tests group in group with number - '((d))'", function() {
		const pattern = "((d))";

		expect(isValidPatternCharacter('1', pattern, 0, false)).toBe(true);
		expect(isValidPatternCharacter('a', pattern, 0, false)).toBe(false);
	});

	it("tests optional group with number - '(d)?'", function() {
		const pattern = "(d)?";

		expect(isValidPatternCharacter('1', pattern, 0, false)).toBe(true);
		expect(isValidPatternCharacter('a', pattern, 0, false)).toBe(null);
	});

	it("tests group with optional number - '(d?)'", function() {
		const pattern = "(d?)";

		expect(isValidPatternCharacter('1', pattern, 0, false)).toBe(true);
		expect(isValidPatternCharacter('a', pattern, 0, false)).toBe(false);
	});

	it("tests optional group with optional number - '(d?)?'", function() {
		const pattern = "(d?)?";

		expect(isValidPatternCharacter('1', pattern, 0, false)).toBe(true);
		expect(isValidPatternCharacter('a', pattern, 0, false)).toBe(null);
	});

	it("tests literal - 'x'", function() {
		const pattern = "x";

		expect(isValidPatternCharacter('1', pattern, 0, false)).toBe(null);
		expect(isValidPatternCharacter('a', pattern, 0, false)).toBe(null);
	});

	it("tests literal then digit - 'xd'", function() {
		const pattern = "xd";

		expect(isValidPatternCharacter('1', pattern, 0, false)).toBe(true);
		expect(isValidPatternCharacter('a', pattern, 0, false)).toBe(false);
	});

	it("tests 'x((xd))'", function() {
		const pattern = "x((xd))";

		expect(isValidPatternCharacter('1', pattern, 0, false)).toBe(true);
		expect(isValidPatternCharacter('a', pattern, 0, false)).toBe(false);
	});

	it("tests 'x((xd)?)'", function() {
		const pattern = "x((xd)?)";

		expect(isValidPatternCharacter('1', pattern, 0, false)).toBe(true);
		expect(isValidPatternCharacter('a', pattern, 0, false)).toBe(false);
	});

	it("tests 'x((xd)?)?'", function() {
		const pattern = "((d)?)?";

		expect(isValidPatternCharacter('1', pattern, 0, false)).toBe(true);
		expect(isValidPatternCharacter('a', pattern, 0, false)).toBe(null);
	});

	it("tests 'd+(/.d*)?' with lookahead", function() {
		const pattern = "d+(/.d*)?";

		expect(isValidPatternCharacter('1', pattern, 0, true)).toBe(true);
		expect(isValidPatternCharacter('a', pattern, 0, true)).toBe(null);
	});

	it("tests 'd*-*d*' with lookahead", function() {
		const pattern = "d*-*d*";

		expect(isValidPatternCharacter('1', pattern, 0, true)).toBe(true);
		expect(isValidPatternCharacter('-', pattern, 0, true)).toBe(true);
	});

	it("tests '/xd' with lookahead", function() {
		const pattern = "/xd";

		expect(isValidPatternCharacter('1', pattern, 0, true)).toBe(true);
		expect(isValidPatternCharacter('x', pattern, 0, true)).toBe(true);
	});

	it("tests '(d+)?x' with lookahead", function() {
		const pattern = "(d+)?x";

		expect(isValidPatternCharacter('1', pattern, 0, true)).toBe(true);
		expect(isValidPatternCharacter('x', pattern, 0, true)).toBe(true);
	});
});


