/*
	custom.js - development mode
	JS library for SA project
 */


SA = {}

SA.Service = {
	loadContent: function(options, callback) {
		var url = options.url || "";		

		if (url != "") {
			var data = options.data || "";
			var containerId = options.containerId || "";

			$.get(url, function(data){
				$('#' + containerId).html(data);
			})

		}
	},
}