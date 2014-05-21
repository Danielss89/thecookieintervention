var deleteAllCookies = function() {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];
      var eqPos = cookie.indexOf("=");
      var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

var runTest = function(){
  /* 
   *  senario for dr.dk
   */
  // Go to url
  location.href = "http://dr.dk";

  //Start test
  console.log("*******************");
  console.log("testing url: " + );
  // Show page with cookie pop-up
  deleteAllCookies();
  location.reload();
  // Wait until its loaded
  $(".dr-cookie-info-box button").load(function() {
    main();
  });
  // Make sure animations are over, then check if its gone
  var isVisible = $(".dr-cookie-info-box button").is(":visible");
  
  if(isVisible){
    console.log("test failed");
  }else{
    console.log("test succeded");
  }
}
