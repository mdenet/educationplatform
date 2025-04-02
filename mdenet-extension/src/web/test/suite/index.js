// Imports mocha for the browser, defining the `mocha` global.
import 'mocha/mocha.js';

export function run() {

	return new Promise((c, e) => {
		mocha.setup({
			ui: 'tdd',
			reporter: undefined
		});

		// Bundles all files in the current directory matching `*.test`
		const importAll = (r) => r.keys().forEach(r);
		importAll(require.context('.', true, /\.test$/));

		try {
			// Run the mocha test
			mocha.run((failures) => {
				console.log('Mocha tests completed!');
				if (self.__coverage__) {
					fetch('http://localhost:4000/coverage', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(self.__coverage__)
					});
				}
			});
		} catch (err) {
			console.error(err);
			e(err);
		}
	});
}
