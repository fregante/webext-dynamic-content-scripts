type SimpleEventListener<Detail> = (detail: Detail) => void;

/**
 * Thinnest possible wrapper around native events
 *
 * @usage
 *   const smokeSignals = new SimpleEventTarget();
 *   smokeSignals.add(details => console.log(details))
 *   smokeSignals.emit('The BBQ is ready');
 */
export class SimpleEventTarget<Detail> extends EventTarget {
	coreEvent = 'DEFAULT';
	private readonly weakEvents = new WeakMap<SimpleEventListener<Detail>, EventListener>();

	add(callback: SimpleEventListener<Detail>): void {
		this.addEventListener(this.coreEvent, this.getNativeListener(callback));
	}

	remove(callback: SimpleEventListener<Detail>): void {
		this.removeEventListener(this.coreEvent, this.getNativeListener(callback));
	}

	emit(detail?: Detail): void {
		this.dispatchEvent(new CustomEvent(this.coreEvent, {detail}));
	}

	// Permanently map simplified callbacks to native listeners.
	// This acts as a memoization/deduplication which matches the native behavior.
	// Calling `add(cb); add(cb); remove(cb)` should only add it once and remove it once.
	private getNativeListener(
		callback: SimpleEventListener<Detail>,
	): EventListener {
		if (this.weakEvents.has(callback)) {
			return this.weakEvents.get(callback)!;
		}

		const native = ((event: CustomEvent<Detail>) => {
			callback(event.detail);
		}) as EventListener;

		this.weakEvents.set(callback, native);
		return native;
	}
}
