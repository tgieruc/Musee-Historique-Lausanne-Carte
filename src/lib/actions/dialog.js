// Native modal dialogs provide focus containment and make background content inert.
export function dialog(node, modal) {
	let opener = document.activeElement;
	let isModal;
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
	function open(options) {
		const nextModal = typeof options === 'boolean' ? options : options.modal;
		if (options?.opener) opener = options.opener;
		if (node.open && nextModal === isModal) return;
		const focused = document.activeElement;
		const children = [...node.querySelectorAll('dialog[open]')].map((child) => ({
			child,
			modal: child.matches(':modal')
		}));
		for (const { child } of children.toReversed()) child.close();
		isModal = nextModal;
		if (node.open) node.close();
		if (isModal) node.showModal();
		else node.show();
		for (const { child, modal } of children) {
			if (modal) child.showModal();
			else child.show();
		}
		if (children.length && focused?.isConnected) focused.focus({ preventScroll: true });
		else node.querySelector('[data-close]')?.focus();
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
