import omit from "lodash.omit";
import React, { Component, PropTypes } from "react";
import ReactDOM from "react-dom";

import EditMask from "./EditMask";
import identity from "./identity";

const propNamesBlacklist = [
	'acceptChar',
	'appendLiterals',
	'eatInvalid',
	'formatter',
	'lookahead',
	'mask',
	'postprocess',
	'preprocess',
	'type',
];


// helper function to convert values to a string form suitable for masking
function _toString(value) {
	if (value === null || value === undefined) {
		return "";
	} else {
		return String(value);
	}
}


/**
	An <input type="text"> element that support edit masking using the solidify-ui/utils/EditMask
	class. Set the edit mask by specifying a valid string on the 'mask' property. The component
	exposes the isComplete() function to allow consumers of the component's value to query if the
	mask has been fullfilled by the current value.

	Accept Characters - 'acceptChars' property
		The acceptChars property is an optional property that can be set to a regular expression
		or function. This property is used to accept or reject key presses independent of the
		edit mask. This is useful in filtering out characters excluded by the edit mask but that
		coule trigger literal due to lookahead processsing. The enter key is passed through the
		react onKeyPress event handler and is short-circuited past the acceptChars property
		processing.

	Formatter Function - 'formatter' property
		The formmatter property is an optional property that can be set to a function. The
		function is called during each render() when the component does not have the focus.
		The signature of the method is:
			function formatter(value) { ... }
		where value is the value to be displayed. This is useful when the user is not editing
		the model value and the UI should add additional formatting characters. An example
		where formatting is useful is currency where you want to add commas and fixed number
		of decimal places when the user is not editing the value. This provides a similar
		functionality to how Excel support formatting when not editing a cell.

		The value returned by the formatter() function does not affect the internal value state.
*/
export default class MaskedInput extends Component {
	constructor(props, context) {
		super(props, context);

		this.state = {
			hasFocus: false,
			mounted: true,
			value: '',
		}
	}

	get value() {
		return this.state && this.state.value;
	}

	componentWillMount() {
		this._updateValue();
	}

	componentWillUnmount() {
		this.setState({ mounted: false })
	}

	componentWillReceiveProps(nextProps) {
		const { value } = nextProps;
		const { value: prevValue } = this.props;

		if (value !== prevValue) {
			this._updateValue(nextProps);
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.selectionStart != null) {
			var elt = ReactDOM.findDOMNode(this.refs.input);

			elt.setSelectionRange(this.selectionStart, this.selectionEnd);
			this.selectionStart = null;
		}
	}

	/*
		Gets if the current value 'completes' the mask, meaning the entire edit mask processed
		the value.
	*/
	isComplete() {
		return this.state.isComplete;
	}

	_handleBlur(event) {
		const { onBlur } = this.props;

		this.setState(
			{
				hasFocus: false,
			},
			() => onBlur && onBlur(event)
		);
	}

	_handleChange(event) {
		const { onChange } = this.props;
		var value = event.target.value;
		var masked;

		if (this.state.mask) {
			masked = this.state.mask.processForElt(value, event.target);

			value = masked.text;
			this.selectionStart = masked.selectionStart;
			this.selectionEnd = masked.selectionEnd;

			this.setState({ isComplete: masked.complete });
		}

		if (masked && masked.text==this.state.value) {
			// resort to forceUpdate() so componentDidUpdate() gets called to update the cursor
			this.forceUpdate();
		} else {
			if (onChange) {
				event.persist();
			}

			// React deficiency: controlled inputs must synchronously trigger render with the onchange
			// event or the cursor will move to the end. See discussion at
			// https://github.com/facebook/react/pull/1759. So
			// we burn some cycles and set what the value will be when the model udpates
			// asynchronously. Could use the local 'value' variable but this accounts for any potential
			// changes property setting may perform.
			this.setState(
				{
					value: masked.text
				},
				() => {
						if (onChange) {
							event.target.value = masked.text;

							onChange && onChange(event);
						}
					}
			);
		}
	}

	_handleFocus(event) {
		const { onFocus } = this.props;

		this.setState(
			{
				hasFocus: true,
			},
			() => onFocus && onFocus(event)
		);
	}

	_handleKeyPress(event) {
		const { acceptChar } = this.props;
		const { charCode, key } = event;

		if (charCode === 13 /* enter */) {
			return;
		} else if (acceptChar instanceof RegExp && !acceptChar.test(key)) {
			event.preventDefault();
		} else if (typeof acceptChar === 'function' && !acceptChar(key, value, target.selectionStart, target.selectionEnd)) {
			event.preventDefault();
		}
	}

	_updateValue(props=this.props) {
		const { appendLiterals, defaultValue, eatInvalid, lookahead, mask, postprocess, preprocess, value } = props;
		var maskedValue = "";
		var editMask = null;

		if (value !== undefined && value !== null) {
			maskedValue = _toString(value);
		} else if (props.defaultValue !== undefined && defaultValue !== null) {
			maskedValue = _toString(defaultValue);
		}

		if (mask) {
			editMask = new EditMask(mask, { appendLiterals, eatInvalid, lookahead, postprocess, preprocess });

			maskedValue = editMask.process(maskedValue, 0, 0).text;
		}

		this.setState({
				value: maskedValue,
				mask: editMask,
			});
	}

	render() {
		const { formatter, type } = this.props;
		var value = this.state.value;
		var props = omit(this.props, propNamesBlacklist);

		// formatting function only invoked when not in focus. this allows the formatter to change
		// the value without worrying about the cursor which should make using formatting libraries
		// easier to integrate.
		if (!this.state.hasFocus && formatter) {
			value = formatter(value);
		}

		return <input { ...props }
				ref="input"
				type="text"
				value={ value }
				onBlur={ event => this._handleBlur(event) }
				onChange={ event => this._handleChange(event) }
				onFocus={ event => this._handleFocus(event) }
				onKeyPress={ event => this._handleKeyPress(event) }
				type={ type==="password" ?type :"text" }
			/>
	}
 }

MaskedInput.defaultProps = {
	acceptChar: /./,
	preprocess: identity,
	postprocess: identity,
	type: "text",
}

MaskedInput.propTypes = {
	acceptChar: PropTypes.oneOfType([
			PropTypes.func,
			PropTypes.instanceOf(RegExp),
		]),
	formatter: PropTypes.func,
	mask: PropTypes.string.isRequired,
	preprocess: PropTypes.func,
	postprocess: PropTypes.func,
},

MaskedInput.acceptChar = {
	digits: /\d/,                   // us zip code
	digitsAndDashes: /[\d-]/,       // us ssn #
	digitsAndSlashes: /[\d\/]/,     // dates
	digitsAndDots: /[\d\.]/,        // floating point number such as currency
}

MaskedInput.fn = {
	numberWithCommas: {
		pre: require("./fn/numberWithCommasPre").default,
		post: require("./fn/numberWithCommasPost").default,
	}
}