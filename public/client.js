$(document).ready(function () {
  // Form submittion with new message in field with id 'm'
  
  let socket = io();
  socket.on('user count', function(data) {
    console.log(data);
    
  });
  //console.log("something here inside client.js")
  $('form').submit(function () {
    var messageToSend = $('#m').val();

    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });
});
