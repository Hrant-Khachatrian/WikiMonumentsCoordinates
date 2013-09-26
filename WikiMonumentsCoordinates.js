
var titleRegExp = /հուշարձանների ցանկ \(/;
if (document.title.search(titleRegExp) > 0) {
	var s = document.createElement('script');
	s.src = chrome.extension.getURL('morebits.js');
	document.head.appendChild(s);
	s.onload = function () {
		s.parentNode.removeChild(s);
	};
	var s2 = document.createElement('script');
	s2.src = chrome.extension.getURL('form.js');
	document.head.appendChild(s2);
	s2.onload = function () {
		s2.parentNode.removeChild(s2);
	};
}
