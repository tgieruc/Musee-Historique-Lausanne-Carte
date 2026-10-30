// Native modal dialogs provide focus containment and make background content inert.
export function dialog(node, modal) {
	const opener = document.activeElement;
	let isModal = modal;
	function containTab(event) {
		if (!isModal || event.key !== 'Tab' || event.target.closest('dialog') !== node) return;
		const controls = [
			...node.querySelectorAll(
				'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
			)
		].filter((el) => el.closest('dialog') === node && el.getClientRects().length);
		const first = controls[0],
			last = controls.at(-1);
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last?.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first?.focus();
		}
	}
	node.addEventListener('keydown', containTab);
	function open(nextModal) {
		isModal = nextModal;
		if (node.open) node.close();
		if (isModal) node.showModal();
		else node.show();
		node.querySelector('[data-close]')?.focus();
	}
	open(modal);
	return {
		update: open,
		destroy() {
			node.removeEventListener('keydown', containTab);
			node.close();
			if (opener?.isConnected) opener.focus({ preventScroll: true });
		}
	};
}
