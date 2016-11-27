jest.autoMockOff();

describe("EditMask", () => {
	var EditMask = require("../EditMask").default;


	it("tests any character - '.'", function() {
		var mask = new EditMask("..");
		var rslt;

		rslt = mask.process("a", 0, 0);
		expect(rslt.text).toBe("a");
		expect(rslt.complete).toBe(false);

		rslt = mask.process("ab", 0, 0);
		expect(rslt.text).toBe("ab");
		expect(rslt.complete).toBe(true);
	});

	it("tests numbers", function() {
		var mask = new EditMask("ddd");
		var rslt;

		rslt = mask.process("5", 0, 0);
		expect(rslt.text).toBe("5");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("543", 0, 0);
		expect(rslt.text).toBe("543");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		// extra characters ignored
		rslt = mask.process("5432", 0, 0);
		expect(rslt.text).toBe("543");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		// bogus input
		rslt = mask.process("a", 0, 0);
		expect(rslt.text).toBe("");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("a2", 1, 1);
		expect(rslt.text).toBe("2");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);
	})

	it("tests literal", function() {
		var mask = new EditMask("xxx");
		var rslt;

		rslt = mask.process("5", 0, 0);
		expect(rslt.text).toBe("xxx");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("", 0, 0);
		expect(rslt.text).toBe("");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("5", 1, 1);
		expect(rslt.text).toBe("xxx");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(3);
		expect(rslt.selectionEnd).toBe(3);
	})

	it("tests literal optional", function() {
		var mask = new EditMask("x-?x");
		var rslt;

		rslt = mask.process("x", 0, 0);
		expect(rslt.text).toBe("x");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("xx", 0, 0);
		expect(rslt.text).toBe("xx");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("x-", 0, 0);
		expect(rslt.text).toBe("x-");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("x-x", 0, 0);
		expect(rslt.text).toBe("x-x");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);
	})

	it("tests literal optional - options: appendLiterals=true", function() {
		var mask = new EditMask("x-?x", { appendLiterals: true });
		var rslt;

		rslt = mask.process("x", 0, 0);
		expect(rslt.text).toBe("x");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("xx", 0, 0);
		expect(rslt.text).toBe("xx");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("x-", 2, 2);
		expect(rslt.text).toBe("x-x");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(3);
		expect(rslt.selectionEnd).toBe(3);

		rslt = mask.process("x-x", 3, 3);
		expect(rslt.text).toBe("x-x");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(3);
		expect(rslt.selectionEnd).toBe(3);
	})

	it("tests numbers and literals", function() {
		var mask = new EditMask("<d d>");   // space is just another literal
		var rslt;

		rslt = mask.process("5", 0, 0);
		expect(rslt.text).toBe("<5");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("<5 3>", 1, 1);
		expect(rslt.text).toBe("<5 3>");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(1);
		expect(rslt.selectionEnd).toBe(1);

		rslt = mask.process("53", 1, 1);
		expect(rslt.text).toBe("<5 3");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(2);
		expect(rslt.selectionEnd).toBe(2);

		rslt = mask.process("<5 3", 1, 1);
		expect(rslt.text).toBe("<5 3");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(1);
		expect(rslt.selectionEnd).toBe(1);

		// simulate the 3 was deleted from <5 3>
		rslt = mask.process("<5 >", 3, 3);
		expect(rslt.text).toBe("<5 >");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(3);
		expect(rslt.selectionEnd).toBe(3);

		// bogus input as first character
		rslt = mask.process("a<5 4>", 1, 1);
		expect(rslt.text).toBe("<5 4>");
		expect(rslt.complete).toBe(true);
		// start and end index at 1 because < symbol inserted, 'a' eaten, '<' eaten - so cursor after < insertion
		expect(rslt.selectionStart).toBe(1);
		expect(rslt.selectionEnd).toBe(1);

		// bogus input as first character and last
		rslt = mask.process("a<5 4>x", 1, 1);
		expect(rslt.text).toBe("<5 4>");
		expect(rslt.complete).toBe(true);
		// start and end index at 1 because < symbol inserted, 'a' eaten, '<' eaten - so cursor after < insertion
		expect(rslt.selectionStart).toBe(1);
		expect(rslt.selectionEnd).toBe(1);
	})

	it("tests numbers and literals - options: appendLiterals=true", function() {
		var mask = new EditMask("<d d>", { appendLiterals: true });   // space is just another literal
		var rslt;

		rslt = mask.process("5", 0, 0);
		expect(rslt.text).toBe("<5 ");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("<5 3", 4, 4);
		expect(rslt.text).toBe("<5 3>");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(5);
		expect(rslt.selectionEnd).toBe(5);
	})

	it("tests literal +", function() {
		var mask = new EditMask("x-+x");
		var rslt;

		rslt = mask.process("x", 0, 0);
		expect(rslt.text).toBe("x");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("x-", 0, 0);
		expect(rslt.text).toBe("x-");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("x-x", 0, 0);
		expect(rslt.text).toBe("x-x");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("x---x", 0, 0);
		expect(rslt.text).toBe("x---x");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("x--x-x", 0, 0);
		expect(rslt.text).toBe("x--x");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);
	})

	it("tests digits +", function() {
		var mask = new EditMask("d+");
		var rslt;

		rslt = mask.process("1", 0, 0);
		expect(rslt.text).toBe("1");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("11", 0, 0);
		expect(rslt.text).toBe("11");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("11x", 0, 0);
		expect(rslt.text).toBe("11");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);
	})

	it("tests digits *", function() {
		var mask = new EditMask("d*");
		var rslt;

		rslt = mask.process("", 0, 0);
		expect(rslt.text).toBe("");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("1", 0, 0);
		expect(rslt.text).toBe("1");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("11", 0, 0);
		expect(rslt.text).toBe("11");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("11x", 0, 0);
		expect(rslt.text).toBe("11");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);
	})

	it("tests digits and literals with +", function() {
		var mask = new EditMask("d+-+d+");
		var rslt;

		rslt = mask.process("1", 0, 0);
		expect(rslt.text).toBe("1");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("11", 0, 0);
		expect(rslt.text).toBe("11");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("11x", 0, 0);
		expect(rslt.text).toBe("11");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("11-", 0, 0);
		expect(rslt.text).toBe("11-");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("11--", 0, 0);
		expect(rslt.text).toBe("11--");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("1-2", 0, 0);
		expect(rslt.text).toBe("1-2");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("11--222", 0, 0);
		expect(rslt.text).toBe("11--222");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);
	})

	it("tests digits and literals with +", function() {
		var mask = new EditMask("d+-+d+");
		var rslt;

		rslt = mask.process("1", 0, 0);
		expect(rslt.text).toBe("1");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("11", 0, 0);
		expect(rslt.text).toBe("11");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("11x", 0, 0);
		expect(rslt.text).toBe("11");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("11-", 0, 0);
		expect(rslt.text).toBe("11-");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("11--", 0, 0);
		expect(rslt.text).toBe("11--");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("1-2", 0, 0);
		expect(rslt.text).toBe("1-2");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("11--222", 0, 0);
		expect(rslt.text).toBe("11--222");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);
	})

	it("tests digits and literals with *", function() {
		var mask = new EditMask("d*-*d*");
		var rslt;

		rslt = mask.process("", 0, 0);
		expect(rslt.text).toBe("");
		expect(rslt.complete).toBe(true);

		rslt = mask.process("1", 0, 0);
		expect(rslt.text).toBe("1");
		expect(rslt.complete).toBe(true);

		rslt = mask.process("11", 0, 0);
		expect(rslt.text).toBe("11");
		expect(rslt.complete).toBe(true);

		rslt = mask.process("11x", 0, 0);
		expect(rslt.text).toBe("11");
		expect(rslt.complete).toBe(true);

		rslt = mask.process("11-", 0, 0);
		expect(rslt.text).toBe("11-");
		expect(rslt.complete).toBe(true);

		rslt = mask.process("11--", 0, 0);
		expect(rslt.text).toBe("11--");
		expect(rslt.complete).toBe(true);

		rslt = mask.process("1-2", 0, 0);
		expect(rslt.text).toBe("1-2");
		expect(rslt.complete).toBe(true);

		rslt = mask.process("11--222", 0, 0);
		expect(rslt.text).toBe("11--222");
		expect(rslt.complete).toBe(true);
	})

	it("tests literal escape (/)", function() {
		var mask = new EditMask("/dd");
		var rslt;

		rslt = mask.process("", 0, 0);
		expect(rslt.text).toBe("");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("d", 0, 0);
		expect(rslt.text).toBe("d");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("d5", 0, 0);
		expect(rslt.text).toBe("d5");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("5", 0, 0);
		expect(rslt.text).toBe("d5");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("5", 1, 1);
		expect(rslt.text).toBe("d5");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(2);
		expect(rslt.selectionEnd).toBe(2);
	})

	it("tests literal escape (/) and +", function() {
		var mask = new EditMask("/d+");
		var rslt;

		rslt = mask.process("", 0, 0);
		expect(rslt.text).toBe("");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("d", 0, 0);
		expect(rslt.text).toBe("d");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		rslt = mask.process("dd", 0, 0);
		expect(rslt.text).toBe("dd");
		expect(rslt.complete).toBe(true);
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);
	})

	it("tests literal escape (/) and *", function() {
		var mask = new EditMask("/d*");
		var rslt;

		rslt = mask.process("", 0, 0);
		expect(rslt.text).toBe("");
		expect(rslt.complete).toBe(true);

		rslt = mask.process("d", 0, 0);
		expect(rslt.text).toBe("d");
		expect(rslt.complete).toBe(true);

		rslt = mask.process("dd", 0, 0);
		expect(rslt.text).toBe("dd");
		expect(rslt.complete).toBe(true);
	})

	it("tests simple ()", function() {
		var mask = new EditMask("(d+)");
		var rslt;

		rslt = mask.process("5", 0, 0);
		expect(rslt.text).toBe("5");
		expect(rslt.complete).toBe(true);
		expect(rslt.groups[0].length).toBe(1);
		expect(rslt.groups[0][0]).toBe("5");

		rslt = mask.process("55", 0, 0);
		expect(rslt.text).toBe("55");
		expect(rslt.complete).toBe(true);
	})

	it("tests ()?", function() {
		var mask = new EditMask("(d+)?-");
		var rslt;

		rslt = mask.process("5", 0, 0);
		expect(rslt.text).toBe("5");
		expect(rslt.complete).toBe(false);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0].length).toBe(1);
		expect(rslt.groups[0][0]).toBe("5");

		rslt = mask.process("5-", 0, 0);
		expect(rslt.text).toBe("5-");
		expect(rslt.complete).toBe(true);
		expect(rslt.groups.length).toBe(1);

		rslt = mask.process("55-", 0, 0);
		expect(rslt.text).toBe("55-");
		expect(rslt.complete).toBe(true);

		rslt = mask.process("-", 0, 0);
		expect(rslt.text).toBe("-");
		expect(rslt.complete).toBe(true);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0]).toBeUndefined();
	})

	it("tests ()+", function() {
		var mask = new EditMask("(d-)+x!");
		var rslt;

		rslt = mask.process("5", 0, 0);
		expect(rslt.text).toBe("");
		expect(rslt.complete).toBe(false);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0]).toBeUndefined();
		expect(rslt.truncatedValue).toBe("5");
		expect(rslt.truncatedCursor).toBe(0);

		rslt = mask.process("5-", 0, 0);
		expect(rslt.text).toBe("5-");
		expect(rslt.complete).toBe(false);

		rslt = mask.process("5-5", 2, 2);
		expect(rslt.text).toBe("5-");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(2);
		expect(rslt.selectionEnd).toBe(2);
	})

	it("tests ()*", function() {
		var mask = new EditMask("(d-)*x!");
		var rslt;

		rslt = mask.process("5", 0, 0);
		expect(rslt.text).toBe("");
		expect(rslt.complete).toBe(false);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0]).toBeUndefined();
		expect(rslt.truncatedValue).toBe("5");
		expect(rslt.truncatedCursor).toBe(0);

		rslt = mask.process("5-", 0, 0);
		expect(rslt.text).toBe("5-");
		expect(rslt.complete).toBe(false);

		rslt = mask.process("5-5", 2, 2);
		expect(rslt.text).toBe("5-");
		expect(rslt.complete).toBe(false);
		expect(rslt.selectionStart).toBe(2);
		expect(rslt.selectionEnd).toBe(2);

		rslt = mask.process("x", 0, 0);
		expect(rslt.text).toBe("x");
		expect(rslt.complete).toBe(true);

		rslt = mask.process("5-x", 0, 0);
		expect(rslt.text).toBe("5-x");
		expect(rslt.complete).toBe(true);

		rslt = mask.process("5-5-x", 0, 0);
		expect(rslt.text).toBe("5-5-x");
		expect(rslt.complete).toBe(true);
	})

	it("tests (d-)x cursor location", function() {
		var mask = new EditMask("(d-)x");
		var rslt;

		// cursor before incomplete capture group incomplete
		rslt = mask.process("5", 0, 0);
		expect(rslt.text).toBe("");
		expect(rslt.complete).toBe(false);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0]).toBeUndefined();
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);
		expect(rslt.truncatedValue).toBe("5");
		expect(rslt.truncatedCursor).toBe(0);

		// cursor after incomplete capture group incomplete
		rslt = mask.process("5", 1, 1);
		expect(rslt.text).toBe("");
		expect(rslt.complete).toBe(false);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0]).toBeUndefined();
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);
		expect(rslt.truncatedValue).toBe("5");
		expect(rslt.truncatedCursor).toBe(1);

		// cursor after invalid value group incomplete
		rslt = mask.process("-", 1, 1);
		expect(rslt.text).toBe("");
		expect(rslt.complete).toBe(false);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0]).toBeUndefined();
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);
		expect(rslt.truncatedValue).toBe("-");
		expect(rslt.truncatedCursor).toBe(1);
	})

	it("tests (d-)+x cursor location", function() {
		var mask = new EditMask("(d-)+x");
		var rslt;

		// cursor before incomplete capture group incomplete
		rslt = mask.process("5", 0, 0);
		expect(rslt.text).toBe("");
		expect(rslt.complete).toBe(false);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0]).toBeUndefined();
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);
		expect(rslt.truncatedValue).toBe("5");
		expect(rslt.truncatedCursor).toBe(0);

		// cursor after incomplete capture group incomplete
		rslt = mask.process("5", 1, 1);
		expect(rslt.text).toBe("");
		expect(rslt.complete).toBe(false);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0]).toBeUndefined();
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);
		expect(rslt.truncatedValue).toBe("5");
		expect(rslt.truncatedCursor).toBe(1);

		// cursor after invalid value group incomplete
		rslt = mask.process("-", 1, 1);
		expect(rslt.text).toBe("");
		expect(rslt.complete).toBe(false);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0]).toBeUndefined();
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);
		expect(rslt.truncatedValue).toBe("-");
		expect(rslt.truncatedCursor).toBe(1);
	})

	it("tests (d-)*x cursor location", function() {
		var mask = new EditMask("(d-)*x");
		var rslt;

		// cursor before incomplete capture group incomplete
		rslt = mask.process("5", 0, 0);
		expect(rslt.text).toBe("x");
		expect(rslt.complete).toBe(true);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0]).toBeUndefined();
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);
		expect(rslt.truncatedValue).toBe("5");
		expect(rslt.truncatedCursor).toBe(0);

		// cursor after incomplete capture group incomplete
		rslt = mask.process("5", 1, 1);
		expect(rslt.text).toBe("x");
		expect(rslt.complete).toBe(true);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0]).toBeUndefined();
		expect(rslt.selectionStart).toBe(1);
		expect(rslt.selectionEnd).toBe(1);
		expect(rslt.truncatedValue).toBe("5");
		expect(rslt.truncatedCursor).toBe(2);

		// cursor after invalid value group incomplete
		rslt = mask.process("-", 1, 1);
		expect(rslt.text).toBe("x");
		expect(rslt.complete).toBe(true);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0]).toBeUndefined();
		expect(rslt.selectionStart).toBe(1);
		expect(rslt.selectionEnd).toBe(1);
		expect(rslt.truncatedValue).toBe("-");
		expect(rslt.truncatedCursor).toBe(2);
	})

	it("tests (d-)?x cursor location", function() {
		var mask = new EditMask("(d-)?x");
		var rslt;

		// cursor before incomplete capture group complete
		// the '-' is not filled in because there are no chars past the 5
		// and appendLiterals defaults to false, thus processing stops when
		// no more input characters
		rslt = mask.process("5", 0, 0);
		expect(rslt.text).toBe("x");
		expect(rslt.complete).toBe(true);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0]).toBeUndefined();
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);
		expect(rslt.truncatedValue).toBe("5");
		expect(rslt.truncatedCursor).toBe(0);

		// cursor before incomplete capture group but valid literal
		rslt = mask.process("5x", 0, 0);
		expect(rslt.text).toBe("5-x");
		expect(rslt.complete).toBe(true);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0][0]).toBe("5");
		expect(rslt.selectionStart).toBe(0);
		expect(rslt.selectionEnd).toBe(0);

		// cursor between 5 & x incomplete capture group but valid literal
		rslt = mask.process("5x", 1, 1);
		expect(rslt.text).toBe("5-x");
		expect(rslt.complete).toBe(true);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0][0]).toBe("5");
		expect(rslt.selectionStart).toBe(1);
		expect(rslt.selectionEnd).toBe(1);

		// cursor after incomplete capture group but valid literal
		rslt = mask.process("5x", 2, 2);
		expect(rslt.text).toBe("5-x");
		expect(rslt.complete).toBe(true);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0][0]).toBe("5");
		expect(rslt.selectionStart).toBe(3);
		expect(rslt.selectionEnd).toBe(3);

		// cursor after incomplete capture group w/ mask complete
		rslt = mask.process("5", 1, 1);
		expect(rslt.text).toBe("x");
		expect(rslt.complete).toBe(true);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0]).toBeUndefined();
		expect(rslt.selectionStart).toBe(1);
		expect(rslt.selectionEnd).toBe(1);
		expect(rslt.truncatedValue).toBe("5");
		expect(rslt.truncatedCursor).toBe(2);

		// cursor after invalid value group w/ mask complete
		rslt = mask.process("-", 1, 1);
		expect(rslt.text).toBe("x");
		expect(rslt.complete).toBe(true);
		expect(rslt.groups.length).toBe(1);
		expect(rslt.groups[0]).toBeUndefined();
		expect(rslt.selectionStart).toBe(1);
		expect(rslt.selectionEnd).toBe(1);
		expect(rslt.truncatedValue).toBe("-");
		expect(rslt.truncatedCursor).toBe(2);
	})

	it("tests date format", function() {
		var mask = new EditMask("dd?//dd?//dddd");
		var rslt;

		rslt = mask.process("12/12", 0, 0);
		expect(rslt.text).toBe("12/12");
		expect(rslt.complete).toBe(false);

		rslt = mask.process("1/1", 0, 0);
		expect(rslt.text).toBe("1/1");
		expect(rslt.complete).toBe(false);

		rslt = mask.process("1212", 0, 0);
		expect(rslt.text).toBe("12/12");
		expect(rslt.complete).toBe(false);

		rslt = mask.process("12121990", 0, 0);
		expect(rslt.text).toBe("12/12/1990");
		expect(rslt.complete).toBe(true);

		rslt = mask.process("12/121990", 0, 0);
		expect(rslt.text).toBe("12/12/1990");
		expect(rslt.complete).toBe(true);

		rslt = mask.process("12/12/1990", 0, 0);
		expect(rslt.text).toBe("12/12/1990");
		expect(rslt.complete).toBe(true);

		rslt = mask.process("1/1/1990", 0, 0);
		expect(rslt.text).toBe("1/1/1990");
		expect(rslt.complete).toBe(true);

	})

})