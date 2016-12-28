"use strict";

var tabIdToUrlHostMap = {};

function isFB(urlHost) {
    return /.*facebook\.(com)|(org)/.test(urlHost);
};

function redirectTab(tabId) {
    chrome.storage.local.get({ websites : [] }, function (items) {
	var websites = items.websites;
	var newUrl = "http://www.google.com";
	if (websites.length > 0) {
	    var randomIndex = Math.floor(Math.random() * websites.length);
	    newUrl = websites[randomIndex];
	}
	chrome.tabs.update(tabId, { url: newUrl });
    });
};

function maybeRedirectTab(tabId) {
    chrome.storage.local.get({ exception : false }, function (items) {
	if (items.exception) {
	    // Use up the exception
	    chrome.storage.local.set({ exception : false });
	} else {
	    redirectTab(tabId);
	}
    });

};

function populateMap() {
    chrome.tabs.query({}, function (items) {
	for (var i = 0; i < items.length; i++) {
	    var tab = items[i];
	    tabIdToUrlHostMap[tab.id] = purl(tab.url).attr('host');
	}
    });
};

populateMap();
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    var newUrl = changeInfo.url;
    if (newUrl) {
	var prevUrlHost = tabIdToUrlHostMap[tabId];
	var newUrlHost = purl(newUrl).attr('host');
	tabIdToUrlHostMap[tabId] = newUrlHost;

	// If the user is already on Facebook, don't stop her from continuing to use Facebook
	if (!(prevUrlHost && isFB(prevUrlHost))) {
	    if (isFB(newUrlHost)) {
		maybeRedirectTab();
	    }
	}
    }
});
