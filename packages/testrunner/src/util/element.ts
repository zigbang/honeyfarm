export function _$(itemName: string) {
	return $(`~${itemName}`)
}

export function waitClickPause (targetEl: WebdriverIO.Element, pausetime: number = 0) {
	targetEl.waitForDisplayed()
	browser.pause(1000)
	targetEl.click()

	browser.pause(pausetime*1000)
}
