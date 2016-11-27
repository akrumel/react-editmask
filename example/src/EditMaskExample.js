import React, { Component } from "react";

import MaskedInput from "react-editmask";


export default class EditMaskExample extends Component {
	render() {
		return <div className="examples">
				<h1>
					react-editmask Examples
				</h1>

				<div className="example">
					<label>Zip code</label>
					<MaskedInput
						mask={ MaskedInput.zipMask }
						placeholder={ MaskedInput.zipMask }
					/>
				</div>

				<div className="example">
					<label>Social Security Number</label>
					<MaskedInput
						mask={ MaskedInput.ssnMask }
						placeholder={ MaskedInput.ssnMask }
					/>
				</div>

				<div className="example">
					<label>US Phone Number</label>
					<MaskedInput
						mask={ MaskedInput.phoneMask }
						placeholder={ MaskedInput.phoneMask }
					/>
				</div>

				<div className="example">
					<label>Number with commas</label>
					<MaskedInput
						mask="d+(/.d*)?"
						placeholder="d+(/.d*)?"
						preprocess={ MaskedInput.fn.numberWithCommas.pre }
						postprocess={ MaskedInput.fn.numberWithCommas.post }
					/>
				</div>

			</div>
	}
}
