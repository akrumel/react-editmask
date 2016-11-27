react-editmask
=========================

An edit mask for React


### Installation

react-editmask requires **React 0.14 or later.**

To install the stable version:

```
npm install --save react-editmask
```

This assumes you are using [npm](https://www.npmjs.com/) as your package manager.


### Overview

This module contain two main files:
* MaskedInput - renders an <input type='text' /> component with edit masking support. This component
	uses the EditMask class for formatting and cursor management
* EditMask - The mask engine

#### Pattern expressions:
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

#### Pattern examples:
	SSN: ddd-dd-dddd
	Date: dd?//dd?//dddd      (forward slash is the literal escape character - not backslash)
	Phone: /(ddd/) ddd-dddd   (space is a literal value, parentheses are used for group expressions
		                      so must be escaped when used as a literal)
	Currency: d+(.d?d?)?      (currently '.' is not a pattern symbol as it is in regular expressions.
	                          parentheses are used to group a set of pattern expressions, usually
	                          to apply an multiplicity operator like '?' or '+')

####Example usage

```
<MaskedInput
	mask={ MaskedInput.zipMask }
	placeholder={ MaskedInput.zipMask }
/>
```

### Examples

An example is included to demonstrate the edit mask concepts and use of the built-in edit masks
and comma pre/post processing functions.

View the [react-editmask example](https://akrumel.github.io/react-editmask/)
