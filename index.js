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
		if(this.server)
			this.server.on('connection', this.switchRequest.bind(this));
	}

	addHandler(path, handler)
	{
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
				path,
				isRegex: path instanceof RegExp,
				handle: handleFunction
			}
		);
		return this;
	}

	switchRequest(ws)
	{
		var pathname = url.parse(ws.upgradeReq.url).pathname;

		if(!this.handlers || !this.handlers.length)
		{
			endWS(ws);
			return;
		}

		let handler = this.findHandler(pathname)
		if(handler)
		{
			let promise = handler.handle(ws);
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
			endWS(ws);
		}
		return handler;
	}
	findHandler(pathname)
	{
		return this.handlers.find((handler) =>
				pathname == handler.path
			|| 	(
					handler.isRegex
				&& 	handler.path.test(pathname)
				)
			);
	}
}

WSSwitch.prototype.for = WSSwitch.addHandler;

function endWS(ws)
{
	try
	{
		ws.terminate();
	}
	catch(x)
	{ }
}

if(module && module.exports)
module.exports = WSSwitch;
