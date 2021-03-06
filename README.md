react-editmask
=========================

An edit mask for React based on regular expression syntax with cursor handling.


## Installation

react-editmask requires **React 0.14 or later.**

To install the stable version:

```
npm install --save react-editmask
```

This assumes you are using [npm](https://www.npmjs.com/) as your package manager.


## Example usage

```
<MaskedInput
	mask="ddd-dd-dddd"
	placeholder="Social security number"
/>
```

An example is included to demonstrate the edit mask concepts and use of the built-in edit masks
and comma pre/post processing functions.

View the [react-editmask example](https://akrumel.github.io/react-editmask/)


## Overview

Edit masking with the browser's <input> is tricky because adding/removing characters before the
cursor will cause undesired cursor positioning, typically moves to end of input. And masking is
all about eating unwanted input and adding desired literal characters. The mask expression
syntax is *based* on the regular expression syntax and consists of mask and literal characters.
See the 'Pattern expressions' section below for the mask characters. Any character in a mask
expression that is not a mask character is a literal character.


### Literal handling

Inserting literal characters is a central feature of all edit masks. This allows typing
'1234567890' to be transformed into '(123) 456-7890' or '11111900' to become '11/11/1990'.
Intuitively handling the deletion of inserted formatted characters was an important design
goal for react-editmask. This is accomplished by inserting literal characters only when required
to match the next mask character, a feature called lookahead.

An example should help clarify deletion handling. The edit mask for a US phone number could be
'(ddd) ddd-dddd', where 'd' is the mask character matching a number character. The literals are
'(', ')', ' ', and '-' characters. Starting with an empty <input>:

| Time | Display | Type   | Output |
|------|---------|--------|--------|
|   0  |         |  1     | (1     |
|   1  |   (1    |  <del> | (      |
|   2  |   (     |  <del> |        |


### Augmented Masking

react-editmask enables augmented edit masking for situations that easier to perform in code
than through regular expression type domain languages. Inserting commas in numbers is a
commonly desired feature that is tricky and difficult to perform using regular-type expressions.
See the stackoverflow question on this topic for a [detailed analysis](http://stackoverflow.com/a/5917250).
The short answer is: (:?^|\s)(?=.)((?:0|(?:[1-9](?:\d*|\d{0,2}(?:,\d{3})*)))?(?:\.\d*[1-9])?)(?!\S).

This problem is handled through `preprocess` and `postprocess` properties. The properties are functions
and have the following signatures:

- `preprocess` : `(value, config) => value`
- `postprocess` : `(config) => value`

The `config` argument is the structure used by `EditMask.js` for processing <input> values during
`onChange` events. This is an imperative structure, not immutable, so the `preprocess` and
`postprocess` functions make changes to this structure as appropriate. The three properties of
concern to the augmentation functions are

- `text` - the processed text and only applicable to postprocess
- `selectionStart` - this is the `selectionStart` value from [HTMLInputElement.setSelectionRange()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setSelectionRange)
- `selectionEnd` - this is the `selectionEnd` value from [HTMLInputElement.setSelectionRange()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setSelectionRange)

The trick to writing the `pre/postprocess` functions is to move the `selectionStart` and `selectionEnd`
values as appropriate for characters these function add/remove from the `value` or `config.text`
before the selection indices. So if you prepend a character then you would add one and if you remove
a character then subtract one.

Here is an example of a MaskedInput that inserts commas for a floating point number:

```
<MaskedInput
	mask="d+(/.d*)?"
	acceptChars={ MaskedInput.acceptChar.digitsAdDots  }
	preprocess={ MaskedInput.fn.numberWithCommas.pre }
	postprocess={ MaskedInput.fn.numberWithCommas.post }
/>
```

See the [numberWithCommasPre](https://github.com/akrumel/react-editmask/blob/master/src/fn/numberWithCommasPre.js)
and [numberWithCommasPost](https://github.com/akrumel/react-editmask/blob/master/src/fn/numberWithCommasPost.js)
functions for implementation examples.

### Module contents

This module contain two main files:
* `MaskedInput` - renders an <input type='text' /> component with edit masking support. This component
	uses the EditMask class for formatting and cursor management
* `EditMask` - The mask engine for times when you want to implement your own edit mask functionality.

## Pattern expressions
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

### Pattern examples
	SSN: ddd-dd-dddd
	Date: dd?//dd?//dddd      (forward slash is the literal escape character - not backslash)
	Phone: /(ddd/) ddd-dddd   (space is a literal value, parentheses are used for group expressions
		                      so must be escaped when used as a literal)
	Currency: d+(.d?d?)?      (currently '.' is not a pattern symbol as it is in regular expressions.
	                          parentheses are used to group a set of pattern expressions, usually
	                          to apply an multiplicity operator like '?' or '+')

## Properties

### `mask` : `string`

the masking pattern to be applied to the `<input>`

### `acceptChars` : function or regular expression (optional - default is `/./` which allows all characters)

The acceptChars property is an optional property that can be set to a regular expression or function. This property is used to accept or reject key presses independent of the edit mask. This is useful in filtering out characters excluded by the edit mask but that coule trigger literal due to lookahead processsing. The enter key is passed through the react onKeyPress event handler and is short-circuited past the acceptChars property processing.

Function signature is:

```
acceptChar(key, value, selectionStart, selectionEnd)
```

Returns `true` to allow the character and `false` to exclude. Specifying a function for this property is an advanced use case and most situations are more easily handled using a regular expression.

Masks containing literal characters often require an `acceptChar` property to prevent non-matching characters from truncating the value from the cursor and inserting the next literal. For example, consider this edit mask for USD:

```
<MaskedInput
	mask="d+(.d?d?)?"
	acceptChars={ /[\d\.]/ }
/>
```

The `acceptChars` property will only allow digits and the `.` (period). All other characters are excluded from being processed by the mask. Without the `acceptChars` property, typing the letter `a` into `12I34.5` (where `I` represents the cursor) would result in the value being `12.`.

As a general rule, if you mask contains literals then build a regular expression that excludes all characters not in the mask. This could be done by default by the component and may be implemented in the future.


### `formatter` : function (optional)

Function called when the input does not have the focus. The returned value becomes the display value.
This is useful for situations where you want to increase the context while not being actively edited,
such as appending a dollar sign.

### `postprocess` : `(config) => value` (optional)

See the 'Augmented Masking' discussion above for details.

### `preprocess` : `(value, config) => value` (optional)

See the 'Augmented Masking' discussion above for details.

### `onChange` : `(event: SyntheticEvent) => any`

A callback which will be called any time the mask's value changes.

This will be passed a `SyntheticEvent` with the input accessible via `event.target` as usual.

**Note:** this component currently calls `onChange` directly, it does not generate an `onChange` event which will bubble up like a regular `<input>` component, so you *must* pass an `onChange` if you want to get a value back out.

### Other props

Any props supported by `<input>` components.


## API

### `value` : `string`

The standard React <input> `value` property.

### `isComplete()` : `boolean`

Returns `true` if the input value completely satisfies the mask.

### Masks

Commonly used masks are specified in country files in the `lib` directory.  At present there is a single file for the US:

```
import { float } from "react-editmask/lib/usMasks";

<MaskedInput
	mask={ float }
/>
```

### Augmentation functions

#### Number with commas

Pre and postprocess functions for adding commas to numeral values.

- `MaskedInput.fn.numberWithCommas.pre`
- `MaskedInput.fn.numberWithCommas.post`


## Not yet implemented
	a - alpha character (case insensitive)
	U - uppercase alpha (converts lowercase letters)
	L - lowercase alpha
	w - alpha or numerical (case insensitive)
	{m[,n]} - m..n of the previous symbol or literal
