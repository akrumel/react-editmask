import React from 'react';
import ReactDOM from 'react-dom';

import EditMaskExample from "./EditMaskExample";

// Load the babel polyfill for es2015 support
require("babel-polyfill");


// fire up the UI
ReactDOM.render(
	<EditMaskExample/>,
	document.getElementById('react-ui')
);


