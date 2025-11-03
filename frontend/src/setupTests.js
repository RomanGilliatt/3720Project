// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Provide lightweight mocks for browser speech APIs and scrolling used by components
Object.defineProperty(window, 'speechSynthesis', {
	configurable: true,
	writable: true,
	value: {
		getVoices: () => [],
		speak: jest.fn(),
		cancel: jest.fn(),
		onvoiceschanged: null,
	},
});

// Some tests call scrollIntoView via refs; mock it to avoid errors in jsdom
Element.prototype.scrollIntoView = jest.fn();

// Mock SpeechSynthesisUtterance in jest environment
// Provide a minimal constructor compatible with how the app uses it
window.SpeechSynthesisUtterance = function (text) {
	this.text = text;
	this.voice = null;
	this.volume = 1;
	this.onstart = null;
	this.onend = null;
	this.onerror = null;
};
