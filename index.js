'use strict';

const url = require('url');

class WSSwitch
{
	constructor(server)
	{
		this.server = server;
		this.handlers = [];

		this.init();
	}

	init()
	{
		if(this.server && this.server.on)
			this.server.on('connection', this.switchRequest.bind(this));
	}

	addHandler(path, handler)
	{
		if(typeof(path) === 'string' || (path && path instanceof RegExp))
			path = { pathname: path };

		let handleFunction;
		switch(typeof(handler))
		{
			case 'function':
				handleFunction = handler;
				break;
			case 'object':
				if(!handler || typeof(handler.handle) !== 'function')
					throw new Error('handler must have a function called \'handle\'');

				handleFunction = handler.handle.bind(handler);
				break;
			default:
				throw new Error('handler must be function or object');
		}

		this.handlers.push(
			{
				pattern: path,
				handle: handleFunction
			}
		);

		return this;
	}

	switchRequest(ws, request)
	{
		request = request || ws.upgradeReq;
		if(!request)
			endWS(ws, 'Upgrade request not available');

		let requestURL = url.parse(request.url);

		if(!this.handlers || !this.handlers.length)
		{
			endWS(ws, 'No handlers specified');
			return;
		}

		let handler = this.findHandler(requestURL);
		if(handler)
		{
			let promise = handler.handle(ws, request);
			if(promise && promise instanceof Promise)
			{
				promise.catch((x) =>
				{
					console.error(x);
					endWS(ws);
				});
			}
		}
		else
		{
			endWS(ws, 'No handler matched');
		}

		return handler;
	}
	findHandler(requestURL)
	{
		return this.handlers.find((handler) =>
		{
			let pattern = handler.pattern;
			return 	matches(pattern.pathname || pattern.path, requestURL.pathname)
				&&	matches(pattern.hostname || pattern.host, requestURL.hostname)
				&&	matches(pattern.port, requestURL.port);
		});
	}
}

WSSwitch.prototype.for = WSSwitch.addHandler;

function matches(pattern, value)
{
	if(!pattern)
		return true;

	if(typeof(pattern) === 'string')
		return value === pattern;
	
	if(pattern instanceof RegExp)
		return pattern.test(value);

	return false;
}
function endWS(ws, message)
{
	if(message)
	{
		try
		{
			ws.send(message);
		}
		catch(x)
		{}
	}

	try
	{
		ws.terminate();
	}
	catch(x)
	{ }
}

if(module && module.exports)
module.exports = WSSwitch;
