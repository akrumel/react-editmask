import omit from "lodash.omit";
import React, { Component, PropTypes } from "react";
import ReactDOM from "react-dom";

import EditMask from "./EditMask";
import identity from "./identity";

const propNamesBlacklist = [
	'appendLiterals',
	'eatInvalid',
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
	An <input type="text"> element that support edit masking using the EditMask
	class. Set the edit mask by specifying a valid string on the 'mask' property. The component
	exposes the isComplete() function to allow consumers of the component's value to query if the
	mask has been fullfilled by the current value.

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
export default class MaskedLabel extends Component {
	constructor(props, context) {
		super(props, context);

		this.state = {
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

	/*
		Gets if the current value 'completes' the mask, meaning the entire edit mask processed
		the value.
	*/
	isComplete() {
		return this.state.isComplete;
	}

	_updateValue(props=this.props) {
		const { appendLiterals, eatInvalid, lookahead, mask, postprocess, preprocess, value } = props;
		var maskedValue = "";
		var editMask = null;

		if (value !== undefined && value !== null) {
			maskedValue = _toString(value);
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
		var { value } = this.state;
		var props = omit(this.props, propNamesBlacklist);

		return <span { ...props } ref="input">
				{ value }
			</span>
	}
 }

MaskedLabel.defaultProps = {
	preprocess: identity,
	postprocess: identity,
}

MaskedLabel.propTypes = {
	mask: PropTypes.string.isRequired,
	preprocess: PropTypes.func,
	postprocess: PropTypes.func,
},

MaskedLabel.fn = {
	numberWithCommas: {
		pre: require("./fn/numberWithCommasPre").default,
		post: require("./fn/numberWithCommasPost").default,
	}
}