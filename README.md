# unify-js
  These is a simple clientside connection library for unify.go but any client sided library can be used,the unify server is written to be very simple and without major constraints, so feel free to use yours.

##Install
  
    npm install unify-js

##API
Unify.js provides a very simple api for the 3 core transports(JSONP,Ajax and Websocket) and allows the communication with the unify server. Its really a simplle library with a simple callback approach,where the callback supplied is called on every response from the server nad allows writing data effectively but without defining any constrainst as its server side api.

##Example

  ```javascript
    
        
        json= Unify.JSON({path:"io/break", fn: function(pl){
          console.log("recieved payload:",pl);
        }).connect();
    
        xhr = Unify.XHR({path:"io/break", fn: function(pl){
          console.log("recieved payload:",pl);
        }).connect();
  
        socket = Unify.Websocket({path:"io/break", fn: function(pl){
          console.log("recieved payload:",pl);
        }).connect();
        
        //send some data
        json.write("sorry");
        json.flush()
  
        xhr.write("sorry");
        xhr.flush()

        socket.write("sorry");
        socket.flush()

  ```
    
    
