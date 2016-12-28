"use strict";

function setExceptionButton() {
    var exceptionHtml = $('<button>').text('Allow one Facebook visit').click(function () {
	chrome.storage.local.set({ exception : true });
	$("#exception").html("You can visit Facebook now!");
    });
    
    $("#exception").html(exceptionHtml);
}

function setMessageHtml(messageHtml) {
    $("#curr-tab-msg").html(messageHtml);
};

function setMessageStr(str) {
    setMessageHtml($("<p>").text(str));
}

function setSaveButton(urlp) {
    var msg = 'Save ' + urlp.attr('host');
    var messageHtml = $('<button>').text(msg).click(function () {
	saveWebsite(urlp.attr('source'));
    });
    
    setMessageHtml(messageHtml);
};

function analyzeTab() {
    // Find the current tab
    chrome.tabs.query({
	active: true,
	lastFocusedWindow: true
    }, function(arr) {
	var tab = arr[0];
	var urlp = purl(tab.url);
	// Check that its URL is from Craigslist and the path starts with "search"
	if (/.*facebook\.(com)|(org)/.test(urlp.attr('host'))) {
	    setMessageStr("Cannot save Facebook");
	} else {
	    setSaveButton(urlp);
	}
    });
};

// Saves the tab in local storage if it is not already present.
function saveWebsite(url) {
    // Look up the websites we have already saved
    chrome.storage.local.get({ websites : [] }, function (items) {
	var websites = items.websites;
	var addTabFlag = true;
	// Figure out whether we are already tracking the search
	for (var i = 0; i < websites.length; i++) {
	    if (url === websites[i]) {
		setMessageStr("Current website is already saved.");
		addTabFlag = false;
	    }
	}
	
	if (addTabFlag) {
	    // If we aren't tracking the search yet, add it to the list of websites
	    websites.push(url);
	    var storageObj = {'websites': websites};
	    chrome.storage.local.set(storageObj, function() {
		setMessageStr('Saved ' + purl(url).attr('host') + '!');
		// Fix the UI
		updateWebsites();
	    });
	}
    });
};

function removeWebsite(url) {
    removeFromStorage('websites', url, setNumWebsites);
};

function removeFromStorage(storageKey, thingToRemove, setNumFn, pred) {
    var storageObj = {};
    storageObj[storageKey] = [];
    
    chrome.storage.local.get(storageObj, function (items) {
	var array = items[storageKey];
	var i = 0;
	for (; i < array.length; i++) {
	    if (array[i] === thingToRemove) {
		break;
	    }
	}
	if (i >= array.length) {
	    // This should not happen
	    console.log("Warning: " + thingToRemove + " was not found in " + storageKey + " --- removeFromStorage");
	} else {
	    // Remove the offending item and fix the message for number of items
	    array.splice(i, 1);
	    setNumFn(array);

	    // Put the new array back in storage
	    var storageObj = {};
	    storageObj[storageKey] = array;
	    chrome.storage.local.set(storageObj);
	}
    });
};

function websiteHtml(url) {
    var result = $("<li>");
    result.append($("<a>").attr('href', url).text(purl(url).attr('host')));
    result.append($("<button>").text('Remove').click(function () {
	removeWebsite(url);
	$(this).parent().remove();
    }));
    return result;
};

function setNumWebsites(websites) {
    var message;
    if (websites.length === 0) {
	message = $("<p>").text("No saved websites.");
    } else if (websites.length === 1) {
	message = $("<p>").text("Saved 1 website:");
    } else {
	message = $("<p>").text("Saved " + websites.length + " websites:");
    }
    $('#numWebsites').html(message);
};

function updateWebsites() {
    updateArray('websites', '#websites', websiteHtml, setNumWebsites);
};

function updateArray(storageKey, divID, htmlFn, setNumFn) {
    // Get the relevant items
    var storageObj = {};
    storageObj[storageKey] = [];
    chrome.storage.local.get(storageObj, function (items) {
	var array = items[storageKey];

	// Create the message about the number of items in the array
	setNumFn(array);

	// Get the div to be updated, clear any existing data
	var arrayDiv = $(divID);
	arrayDiv.empty();

	if (array.length > 0) {
	    // Create a list HTML element
	    var ulist = $("<ul>");
	    for (var i = 0; i < array.length; i++) {
		// Populate the list with an HTML element for each item
		ulist.append(htmlFn(array[i]));
	    }

	    // Add the list to the DOM
	    arrayDiv.html(ulist);
	}
    });
};

window.onload = function (e) {
    setExceptionButton();
    analyzeTab();
    updateWebsites();
};
