// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var btnsClicked = [];

// The background page is asking us to find an address on the page.
if (window == top) {
  chrome.extension.onRequest.addListener(function(req, sender, sendResponse) {
    sendResponse(main());
  });
}

/*
 * $ extension - Find elements containing a word. Uppercase has no relevance.
 */
$.expr[':'].containsWord = function(a, i, m) {
  var searchWord = m[3].toUpperCase();
  var wordList = $(a).text().toUpperCase().split(/\b\s+/);
  var isWordFound = false;

  $.each(wordList, function(index,value){
    if(value == searchWord){
      isWordFound = true;
    }
  });
  return isWordFound;
};

/*
 * Helpers
 */
function capitaliseFirstLetter(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/*
 * Return a filtered list of buttons
 */
var filterButtons = function(buttons){
    var maxTextLength = 20;
    var resList = [];

    buttons.each(function(i,b){
        var text = $(b).text().replace(/\W/g, '');
        if(text.length < maxTextLength){
            resList.push(b);
        }
    });
    
    return resList;
};

/*
 * Find all wrappers in dom
 */
var findWrappers = function(){
  return $("[class*='cookie'],[id*='cookie'],[title*='cookie'],[name*='cookie'],[alt*='cookie'],[class*='Cookie'],[id*='Cookie'],[title*='Cookie'],[name*='Cookie'],[alt*='Cookie']");
}

/*
 *  Find accept and info buttons
 */
var textKeyWords = ["accepter", "ok", "luk", "tillad", "x", "×"];
var attrKeyWords = ["close", "luk", "hide", "accept"];

var findAcceptButtons = function(wrappers){
  var resList = [];

  $.each(wrappers, function(i,w){
      // Find elements containing key words
      $.each(textKeyWords, function(j,v){
        //for capital letters too
        for(var k = 0; k < 2; k++){
          var v = (k == 0) ? v : capitaliseFirstLetter(v);
          var aBtns = $(w).find(":containsWord('" + v + "')");
          resList = resList.concat(filterButtons(aBtns));
        }
      });
      // Find elements with key words in attributes
      $.each(attrKeyWords, function(j,v){
        //for capital letters too
        for(var k = 0; k < 2; k++){
          var v = (k == 0) ? v : capitaliseFirstLetter(v);
          var aBtns = $(w).find("[class*='" + v + "'],[id*='" + v + "'],[title*='" + v + "'],[name*='" + v + "'],[alt*='" + v + "']");
          resList = resList.concat(filterButtons(aBtns));
        }
      });
  });

  return $.unique(resList);
}

/*
 *  Help function for findWrappersByText. Returns ratio on an element.
 */
var getRatio = function(element){
    var width = $(element).width();
    var height = $(element).height();
    return width/height;
};

/*
 *  Help function for findWrappersByText. Recursive function to get element with the highest level and the same ratio.
 */
var getWrapper = function(element){
    var parent = $(element).parent();
    var bodyRatio = getRatio($("body"));
    var parentRatio = getRatio(parent);
    var elementRatio = getRatio(element);
    var threshold = 2;

    // When many paragraphs of text use parent element
    var element = ($(element).is("p")) ? $(element).parent() : element;
    // Stop if getting to body or wrapper
    if(elementRatio/bodyRatio < threshold){ 
      return element 
    };
    // Compare ratio og use ancestor farthest away with same dimensions
    if(Math.abs(elementRatio/parentRatio) < threshold){
        return getWrapper(parent);
    }else{
        return element;
    }
}

/*
 *  Returns the outer divs of elements that contains the word 'cookie'
 */
var findWrappersByText = function(){
  var resList = [];
  var cookieElements = $('*').filter(function(){ return ($(this).clone().children().remove().end().text().toLowerCase().indexOf('cookie') >=0) && !$(this).is("script");});
  $.each(cookieElements, function(i,v){
      resList.push(getWrapper(v));
  });
  return resList;
}

/*
 *  Its here the magic begins
 */
var runAlgorithm = function(){
  var wrappers = findWrappers();
  var acceptButtons = findAcceptButtons(wrappers);
  if(acceptButtons.length == 0){
    acceptButtons = acceptButtons.concat(findAcceptButtons(findWrappersByText()));
  }
  // Only click the buttons that are not already clicked
  acceptButtons = $(acceptButtons).not(btnsClicked).get();
  // Only click buttons that er visible
  acceptButtons = $(acceptButtons).not(":hidden").get();
  console.log(acceptButtons);
  $.each(acceptButtons, function(i,v){
    v.click();
  });
  btnsClicked = btnsClicked.concat(acceptButtons);
}

/* Run script */

var test = function(testState, testCount){
  if(testSites.length == testCount){
    isTesting = false;
    chrome.runtime.sendMessage({test: "isTesting", isTesting: isTesting}, function(){
      console.log("Testing done!");
    });
  }else{
    console.log("isTesting");
    if(testState == 0){
      console.log("testState == 0");
      // set state to 1
      // go to the first url
      updateTestState(1, function(){
        console.log("callback");
        var testPageUrl = testSites[testCount].url;
        location.href = testPageUrl;
      });
    }else if (testState == 1){
      // Show page with cookie pop-up
      updateTestState(2, function(){
        console.log("deleteAllCookies");
        chrome.runtime.sendMessage({test: "deleteCookies", domain: document.domain}, function(response) {
          location.reload();
        });
      });
    }else if (testState == 2){
      // Run when loaded
      updateTestState(3, function(){
        acceptButtonSelector = testSites[testCount].acceptButton;
        console.log($(acceptButtonSelector).length);
        if( $(acceptButtonSelector).length > 0 ){
          
          console.log("runAlgorithm");
          runAlgorithm();

          // Check if test succeded
          var isVisible = false;
          var waitForAnimationMilli = 1000;
          
          setTimeout(function(){
            var success = !$(acceptButtonSelector).is(":visible");

            // Handle result
            if(isVisible){
              console.log("test failed");
            }else{
              console.log("test succeded");
            }
            chrome.runtime.sendMessage({test: "oneTestDone", domain: document.domain, success: success}, function(response) {
              location.reload();
            });
          }, waitForAnimationMilli);
        }else{
          console.log("No button loaded!");
        };
      });
    }
  }
}

/* Test  */

var testSites = [
                  {url: "http://dr.dk", acceptButton: ".dr-cookie-info-box button"}, 
                  {url: "http://tv2.dk", acceptButton: "#tv2cookiebar .formbutton"},
                  /*{url: "http://dba.dk", acceptButton: "span[title=Luk]"},*/
                  {url: "http://degulesider.dk", acceptButton: ".accept-cookies-button"}];
//help functions



// Listen for start 

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.toContentScript == "runTest"){
    location.reload();
  };
});

// Test conversation

var updateTestState = function(newState, callback){
  console.log("updateTestState() - " + newState);
  chrome.runtime.sendMessage({test: "updateState", newState: newState}, function(response) {
    console.log("callback:");
    callback();
  });
}

// The main method

var main = function(){
  chrome.runtime.sendMessage({test: "getState"}, function(response) {
    var isTesting = response.isTesting;
    var testState = response.state;
    var testCount = response.count;
    console.log("Is testing: " + isTesting);
    console.log("Test state: " + testState);
    console.log("Test Count: " + testCount);
    if(isTesting){
      test(testState, testCount);
    }else{
      runAlgorithm();
    }
  });
}

main();

/*
 * Observe code for mutation. In case of a cookie pop up is appended after dom-ready event.
 */
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

var observer = new MutationObserver(function(mutations, observer) {
    // fired when a mutation occurs
    main();
});

// define what element should be observed by the observer
// and what types of mutations trigger the callback
observer.observe(document, {
    subtree: true,
    childList: true
});

setTimeout(function(){
  observer.disconnect();
  console.log("disconnect");
}, 5000);


