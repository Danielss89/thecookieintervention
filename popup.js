function onLoad() {
  $("#reportLink").click(function(){
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
      reportURL(tabs[0].url);
    });
  });

  $("#runTest").click(function(){
    console.log("runTest - toBackgroundPage");
    chrome.extension.sendMessage({test: "isTesting", isTesting: true},function(response){
      console.log(response);
    });
  });
}

function reportURL(url){
  console.log("Reporting url: " + url);
  $.get("http://janniks.dk/okcookie/postwithget.php", {url: url})
    .done(function(data){
      console.log(data);
      var json = JSON.parse(data);
      $(".reportedUrl").html(url);
      if(json.error){
        // show: Something went wrong, send an e-mail
        $("#reportSuccess").show();
      }else{
        // show: everything went fine
        $("#reportSuccess").show();
      }
    });
}

window.onload = onLoad;