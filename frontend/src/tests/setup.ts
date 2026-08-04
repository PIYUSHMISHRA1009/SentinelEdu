import '@testing-library/jest-dom';

// Polyfill ResizeObserver for components (e.g., Recharts) under jsdom
// jsdom does not implement ResizeObserver; providing a minimal stub fixes tests that mount responsive charts
class ResizeObserverStub {
	observe() { /* no-op */ }
	unobserve() { /* no-op */ }
	disconnect() { /* no-op */ }
}
// @ts-ignore
global.ResizeObserver = global.ResizeObserver || ResizeObserverStub as any;

// Mock framer-motion to avoid requiring React's JSX runtime in tests and simplify motion components
jest.mock('framer-motion', () => {
	const React = require('react');
	const passthrough = (tag = 'div') =>
		React.forwardRef(function FMStub(props: any, ref: any) {
			return React.createElement(tag, { ...props, ref }, props.children);
		});
	const motionProxy = new Proxy({}, { get: (_target, prop: string) => passthrough(prop) });
	const AnimatePresence = React.forwardRef(function AnimatePresenceStub(props: any, ref: any) {
		const { children, ...rest } = props || {};
		return React.createElement(React.Fragment, { ref, ...rest }, children);
	});
	return { motion: motionProxy, AnimatePresence };
});
