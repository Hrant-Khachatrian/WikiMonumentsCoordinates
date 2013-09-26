// expects Morebits.js and jQuery

var WikiMonumentsCoordinates = {
	detectWMCPage : function () {
		// actual detection is done before loading
		return true;
	},
	initButtons : function () {
		if (!WikiMonumentsCoordinates.detectWMCPage()) {
			return;
		}
		$('.WikiMonumentsCoordinates_Button').remove();
		$('table.wikitable > tbody > tr').each(function () {
			var $tr = $(this);
			var number = $tr.find('td:nth-child(5) a').text();
			var $tdCoord = $tr.children('td:nth-child(4)');
			if ($tdCoord.text().length > 10) {
				// coordinate is there, move on!
				return true;
			}
			var $button = $('<button class="WikiMonumentsCoordinates_Button">Ավելացնել կոորդինատ</button>');
			$button.click(function () {
				WikiMonumentsCoordinates.showForm(number);
				return false;
			});
			$tdCoord.html('').append($button);
		});
	},
	initMap : function () {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=WikiMonumentsCoordinates_GoogleMaps_Init';
		document.body.appendChild(script);
	},
	showForm : function (number) {
		var $form = $('<div style="position: fixed; width:600px; height:508px; top:40px;left:240px; background:white; border:1px solid #999;padding: 20px 50px">' +
				'<h3>Նշեք կոորդինատը (հուշարձան #' + number + ')</h3>' +
				'<p>Մոտեցրեք քարտեզը և մկնիկի ձախ կտտոցով նշեք հուշարձանի ճշգրիտ տեղը, ապա սեղմեք «Հիշել»՝ կոորդինատները հոդվածում ավելացնելու համար։ Կոորդինատներն ավելացրեք միայն, եթե լիովին վստահ եք, որ դրանք ճշգրիտ են:</p>' +
				'<div class="wlmcMap" style="width: 100%; height: 310px"></div>' +
				'<div>' +
				'   <input type="text" class="wlmcLat" style="padding:5px;border:1px #666 solid" placeholder="Լայնություն" />' +
				'   <input type="text" class="wlmcLon" style="padding:5px;border:1px #666 solid" placeholder="Երկայնություն" />' +
				'</div>' +
				'</div>');
		$form.appendTo($('body'));
		var $buttonClose = $('<button style="margin:12px 0; float:right; padding:5px 15px">Փակել</button>').appendTo($form);
		var $buttonSave = $('<button style="margin:12px 0;padding:5px 15px">Հիշել</button>').appendTo($form);
		$buttonSave.click(function () {
			var lat = $form.find('.wlmcLat').val(), lon = $form.find('.wlmcLon').val();
			if (!lat && !lon) {
				alert("Կոորդինատը նշելու համար խնդրում ենք սեղմել քարտեզի այն կետի վրա, որտեղ գտնվում է հուշարձանը");
				return;
			}
			WikiMonumentsCoordinates.saveCoordinate(number, lat, lon);
			$buttonSave.text('Խնդրում ենք սպասել․․․');
			$buttonSave.unbind('click');
			$buttonSave.attr('disabled', 'disabled');
			$form.css('cursor', 'no-drop');
		});
		$buttonClose.click(function () {
			$form.remove();
		});

		var $mapContainer = $form.find('.wlmcMap');
		var $inputLat = $form.find('.wlmcLat');
		var $inputLng = $form.find('.wlmcLon');
		$mapContainer.bind('WikiMonumentsCoordinates_GoogleMaps_Loaded', function () {
			var initLat = parseFloat(localStorage.getItem('WikiMonumentsCoordinates_lat')) || 40.32;
			var initLon = parseFloat(localStorage.getItem('WikiMonumentsCoordinates_lon')) || 44.82;
			var initZoom = parseFloat(localStorage.getItem('WikiMonumentsCoordinates_zoom')) || 6;

			var location = new google.maps.LatLng(initLat, initLon);
			var mapOptions = {
				zoom: initZoom,
				center: location,
				mapTypeId: google.maps.MapTypeId.HYBRID
			};

			WikiMonumentsCoordinates.map = new google.maps.Map($mapContainer.get(0), mapOptions);

			var marker = null;
			var updateMarkerCoordinates = function () {
				$inputLat.val(marker.position.lat());
				$inputLng.val(marker.position.lng());
			};
			google.maps.event.addListener(WikiMonumentsCoordinates.map, 'click', function(e) {
				if (WikiMonumentsCoordinates.map.zoom < 13) {
					WikiMonumentsCoordinates.map.panTo(e.latLng);
					alert("Կոորդինատը նշելու համար խնդրում ենք էլ ավելի մոտեցնել քարտեզը: Այս մասշտաբով հնարավոր չէ ճշգրիտ կոորդինատ նշել:");
					return;
				}
				if (marker == null) {
					marker = new google.maps.Marker({
						position: e.latLng,
						map: WikiMonumentsCoordinates.map,
						draggable:true
					});
					google.maps.event.addListener(marker, 'drag', updateMarkerCoordinates);
				}
				marker.setPosition(e.latLng);
				WikiMonumentsCoordinates.map.panTo(e.latLng);
				updateMarkerCoordinates();
			});
		});

		WikiMonumentsCoordinates.initMap();
	},
	saveCoordinate : function (number, lat, lon) {
		if (Morebits == undefined) {
			return;
		}
		var page = new Morebits.wiki.page(mw.config.get('wgPageName'));
		lat = Math.round(lat * 1000000) / 1000000;
		lon = Math.round(lon * 1000000) / 1000000;
		localStorage.setItem('WikiMonumentsCoordinates_lat', lat);
		localStorage.setItem('WikiMonumentsCoordinates_lon', lon);
		localStorage.setItem('WikiMonumentsCoordinates_zoom', WikiMonumentsCoordinates.map.zoom);
		page.load(function () {
			var text = page.getPageText();
			var regex = new RegExp("\\|\\s*լայն\\s*=\\s*\\|\\s*երկ\\s*=\\s*\\|\\s*համարանիշ\\s*=\\s*" + number + "\\s*\\|", 'i');
			text = text.replace(regex, "|լայն = " + lat + " |երկ = " + lon + " |համարանիշ = " + number + " |");
			page.setPageText(text);
			page.setBotEdit(true);
			page.setEditSummary(number + ' համարով հուշարձանի կոորդինատի ավելացում գործիքով');
			page.save(function () {
				location.reload();
			});
		});
	}
};
$(function () {
	WikiMonumentsCoordinates.initButtons();
});
var WikiMonumentsCoordinates_GoogleMaps_Init = function () {
	$('.wlmcMap').trigger('WikiMonumentsCoordinates_GoogleMaps_Loaded');
};