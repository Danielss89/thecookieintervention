var isTesting = false;
var testState = 0;
var testCount = 0; // Test page count

// Help function

var deleteCookies = function(domain){
  chrome.cookies.getAll({domain: domain},function(cookies){
    for(var i=0; i<cookies.length;i++) {
      chrome.cookies.remove({url: "http://" + cookies[i].domain + cookies[i].path, name: cookies[i].name});
      chrome.cookies.remove({url: "https://" + cookies[i].domain + cookies[i].path, name: cookies[i].name});
    }
  });
}

// Send start message to content script
var sendTestCommand = function(){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {toContentScript: "runTest"});
  });
}

// Test conversation
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.test == "isTesting"){
    isTesting = request.isTesting;
    if(isTesting){
      sendTestCommand();
    }else{
      testCount = 0;
      testState = 0;
    }
  }
  if(request.test == "getState"){
    sendResponse({isTesting: isTesting, state: testState, count: testCount});
  }
  if(request.test == "updateState"){
    testState = request.newState;
    sendResponse("callback");
  }
  if(request.test == "deleteCookies"){
    deleteCookies(request.domain);
    sendResponse("callback");
  }
  if(request.test == "oneTestDone"){
    console.log("***************");
    console.log(request.domain);
    console.log("Test success: " + request.success);

    testCount++;
    testState = 0;
    sendResponse("callback");
  }
});

