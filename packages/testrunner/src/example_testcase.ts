import { suite, test } from "@testdeck/mocha"
import { expect } from "chai"
import { _$, waitClickPause } from "./util/element"

@suite
export class Suite {
	static async before() {
		browser.pause(1000)
	}
	
	@test
	example_testcase() {
		let plus_btn = _$(`plus_btn`)
		let minus_btn = _$(`minus_btn`)
		
		waitClickPause(plus_btn, 2)
		waitClickPause(plus_btn, 2)

		waitClickPause(minus_btn, 2)
		waitClickPause(minus_btn, 2)
	}
}