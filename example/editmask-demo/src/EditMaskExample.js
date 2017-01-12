import React, { Component } from "react";

import MaskedInput from "react-editmask";
import {
	float,
	phone,
	ssn,
	zip,
} from "react-editmask/lib/usMasks";

export default class EditMaskExample extends Component {
	render() {
		return <div className="examples">
				<h1>
					react-editmask Examples
				</h1>

				<div className="example">
					<label>Zip code</label>
					<MaskedInput
						mask={ zip }
						placeholder={ zip }
					/>
				</div>

				<div className="example">
					<label>Social Security Number</label>
					<MaskedInput
						mask={ ssn }
						placeholder={ ssn }
					/>
				</div>

				<div className="example">
					<label>US Phone Number</label>
					<MaskedInput
						mask={ phone }
						placeholder={ phone }
					/>
				</div>

				<div className="example">
					<label>Number with commas</label>
					<MaskedInput
						mask={ float }
						placeholder={ float }
						preprocess={ MaskedInput.fn.numberWithCommas.pre }
						postprocess={ MaskedInput.fn.numberWithCommas.post }
					/>
					<p>
						This example utilizes the `preprocess` and `postprocess` properties for add/remove the commas
						independent of the edit masking.
					</p>
				</div>

			</div>
	}
}
