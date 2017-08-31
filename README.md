# ws-switch
  Simple switch for websocket requests

```shell
npm install --save ws-switch
```
WS-Switch is designed for the `ws` module but works with an WebSocket-library that supports the `connection` event.  
WS-Switch allows you to create your own server and simplify the switching of new connections.

## Usage

```js
const WS = require('ws');
const WSSwitch = require('ws-switch');

let server = new WS.Server({ port: 1234 });
let wsSwitch = new WSSwitch(server);
//You can also ommit the server and pass new ws-objects directly to wsSwitch.switchRequest
//But notice: As ws removed the upgradeReq-attribute you either must commit it to the switchRequest-method
//or place it manually as upgradeReq into the ws-object.


wsSwitch.for('/', (ws) => //Handles requests matching string '/'
{

});

wsSwitch.for(/^\/foo/, (ws) => 	//Handles requests matching regex ^/foo
								//which includes every string starting with /foo
								//even '/foo/bar' and '/foobar'
{
	
});

let handler404 =
{
	handle: function(ws)
	{
		/* Send not-found message */
	}
};

wsSwitch.for({ hostname: 'example.com' }, handler404); //Handles every request for example.com

wsSwitch.for({ hostname: '.+\.example.com', pathname: /^/ }, handler404); //Handles every request for *.example.com

wsSwitch.for(/^/, handler404); //Handles every request
```

Handlers are processed sequentially, so handler 3 will be called only if handler 1 and 2 don't match

### Examples
- `/`  
Handler 1
- `/foo`  
Handler 2
- `/foo/bar/abc`  
Handler 2
- `/foobar/abc`  
Handler 2
- `/barfoo`  
Handler 3
- `/abc`  
Handler 3

### Exceptions

If the handler-function returns a Promise, WS-Switch will catch exceptions in that Promise and end the connection.

```js

wsSwitch.on(/^\/foo/, async (ws) =>
{
	let foo = await something();

	throw new Error();
	//WebSocket will be terminated
}
```

## API

### `new WSSwitch(server)`

#### arguments
- `server: object`  
Any object compatible to ws.Server
If ommited, you have to pass websockets **and their upgradeRequests** manually via the switchRequest-method

#### returns
- `WSSwitch: object`

### `WSSwitch.for(pathname, onConnection)`

#### arguments
- `path: string or RegExp`
- `onConnection: function(websocket)`

#### returns
- `this`

### `WSSwitch.for(path, onConnection)`

#### arguments
- `path: object`
	- `pathname | path: string or RegExp`
	- `hostname | host: string or RegExp`
	- `port: int`
- `onConnection: function(websocket)`

#### returns
- `this`

### `WSSwitch.addHandler(pathname, onConnection)`
Same as `WSSwitch.for`

### `WSSwitch.addHandler(path, onConnection)`
Same as `WSSwitch.for`

### `WSSwitch.switchRequest(websocket, upgradeRequest)`
If a WebSocket-Server is given in constructor, this method is called automatically

#### arguments
- `websocket: WebSocket`
- `upgradeRequest: HTTP.IncommingMessage`

#### returns
- `handler: object`
