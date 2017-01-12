
export function anyCharTestFn(ch) {
	// matches everything except newline
	return ch != 0x0a ?ch :null;
}

export function digitTestFn(ch) {
	return !isNaN(parseInt(ch)) ?ch :null;
}
