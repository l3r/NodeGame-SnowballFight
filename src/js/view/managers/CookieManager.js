define(function() {
	var _cookies = {};

	function parseCookies()
	{
		if( document.cookie ) {
			var splitPair = document.cookie.toString().split(";"),
				i = splitPair.length;

			while(i--)
			{
				var splitPiece = splitPair[i].split("="),
					name = splitPiece[0].trim(),
					value = splitPiece[1].trim();

				_cookies[ name ] = value;
			}
		}
	}

	function setCookie( name, value, expires, path, domain, secure )
	{
		var newCookie = name + "=" + escape(value) +
			((expires) ? "; expires=" + expires.toGMTString() : "") +
			((path) ? "; path=" + path : "") +
			((domain) ? "; domain=" + domain : "") +
			((secure) ? "; secure" : "");

		document.cookie = newCookie;

		_cookies[ name ] = value;
	}

	function init()
	{
		parseCookies();
	}

	require.ready( init );

	return window.CookieManager = {
		setCookie: setCookie,

		getCookie: function( name )
		{
			return  decodeURI( _cookies[ name ] );
		},

		hasCookie: function( name ) {
			return name in _cookies;
		}
	};
});