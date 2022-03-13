/* THE MAP IS INITIALIZED */

let latitude = 23.634501;

let longitude = -102.552784;

let platform = new H.service.Platform({
    apikey: constants.JS_API_KEY,
});
let defaultLayers = platform.createDefaultLayers();

let map = new H.Map(
    document.getElementById("divMap"),
    defaultLayers.vector.normal.map,
    {
        center: { lat: latitude, lng: longitude },
        zoom: 12,
        pixelRatio: window.devicePixelRatio || 1,
    }
);

window.addEventListener("resize", () => map.getViewPort().resize());

let behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

let ui = H.ui.UI.createDefault(map, defaultLayers);

let icons = {
    from_icon: new H.map.Icon("../icons/start.svg"),
    to_icon: new H.map.Icon("../icons/finish.svg"),
    transport_icon: document.createElement('div')
};

let markers = {
    from: new H.map.Marker(
        { lat: latitude, lng: longitude },
        { icon: icons.from_icon }
    ),
    to: "",
    transport: ""
}

let direction = "";
let transportMode;
let polyline;
let count = 0;

let animateMarker;

addChangeListeners();

getLocation();

/* THE MAP IS INITIALIZED */

function getLocation() {
    if (navigator.geolocation) {
        let options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        };
        navigator.geolocation.getCurrentPosition(geoSuccess, geoError, options);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function geoSuccess(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    map.setCenter({ lat: latitude, lng: longitude });
    console.log("lat:" + latitude + " lng:" + longitude);
    console.log(`More or less ${position.coords.accuracy} meters.`);

    addMarker(map, latitude, longitude, icons.from_icon, true);

    document.getElementById("ipt_from_lat").value = latitude;

    document.getElementById("ipt_from_lng").value = longitude;

    reverseGeocoding(latitude, longitude, null);
}

function geoError() {
    console.log("Geocoder failed.");
    map.addObject(markers.from);
    reverseGeocoding(latitude, longitude, null);
}

function searchGeocoding(id) {
    if (id) {
        direction = document.getElementById(id).value;
    } else {
        direction = document.getElementById("ipt_from").value;
    }

    if (direction) {
        let xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                let result = this.responseText;
                console.log("Geocoding Search result: " + result);

                let optionsArray = JSON.parse(result);

                let list;

                if (id) {
                    if (id.includes("from")) {
                        list = document.getElementById("list_from_suggestions");
                    } else {
                        list = document.getElementById("list_to_suggestions");
                    }
                } else {
                    list = document.getElementById("list_from_suggestions");
                }

                if (list.length > 0) {
                    while (list.length > 0) {
                        list.remove(0);
                    }
                }

                let options = "";

                if (optionsArray) {
                    for (let index = 0; index < optionsArray.items.length; index++) {
                        let element = optionsArray.items[index].title;

                        options += '<option value="' + element + '" />';
                    }

                    list.innerHTML = options;
                    setGeocoding(id);
                }
            }
        });

        xhr.open(
            "GET",
            `https://geocode.search.hereapi.com/v1/geocode?apiKey=${constants.API_KEY}&q=${direction}`
        );

        xhr.send();
    }
}

function iptChecks(id) {
    if (id) {
        if (id.includes("from")) {
            if (document.getElementById(id).value == null || document.getElementById(id).value == '') { //ipt_from
                if (document.getElementById("ipt_to").value) {
                    document.getElementById("divRouteOptions").style = "display: none;";
                    document.getElementById("divTotals").style = "display: none;";
                    if (markers.from) {
                        map.removeObject(markers.from);
                        markers.from = null;
                        document.getElementById("ipt_from_lat").value = '';
                        document.getElementById("ipt_from_lng").value = '';
                    }
                    if (polyline) {
                        map.removeObject(polyline);
                        polyline = null;
                    }
                    map.setCenter({ lat: markers.to.getGeometry().lat, lng: markers.to.getGeometry().lng });
                } else {
                    document.getElementById("divRouteOptions").style = "display: none;";
                    document.getElementById("divTotals").style = "display: none;";
                    if (markers.from) {
                        map.removeObject(markers.from);
                        markers.from = null;
                        document.getElementById("ipt_from_lat").value = '';
                        document.getElementById("ipt_from_lng").value = '';
                    }
                    if (markers.to) {
                        map.removeObject(markers.to);
                        markers.to = null;
                        document.getElementById("ipt_to_lat").value = '';
                        document.getElementById("ipt_to_lng").value = '';
                    }
                    if (polyline) {
                        map.removeObject(polyline);
                        polyline = null;
                    }
                }
            }
        } else {
            if (document.getElementById(id).value == null || document.getElementById(id).value == '') { //ipt_to
                if (document.getElementById("ipt_from").value) {
                    document.getElementById("divRouteOptions").style = "display: none;";
                    if (markers.to) {
                        map.removeObject(markers.to);
                        markers.to = null;
                        document.getElementById("ipt_to_lat").value = '';
                        document.getElementById("ipt_to_lng").value = '';
                    }
                    if (polyline) {
                        map.removeObject(polyline);
                        polyline = null;
                    }

                    document.getElementById("divTotals").style = "display: none;";
                    map.setCenter({ lat: markers.from.getGeometry().lat, lng: markers.from.getGeometry().lng });
                } else {
                    document.getElementById("divRouteOptions").style = "display: none;";
                    document.getElementById("divTotals").style = "display: none;";
                    if (markers.from) {
                        map.removeObject(markers.from);
                        markers.from = null;
                        document.getElementById("ipt_from_lat").value = '';
                        document.getElementById("ipt_from_lng").value = '';
                    }
                    if (markers.to) {
                        map.removeObject(markers.to);
                        markers.to = null;
                        document.getElementById("ipt_to_lat").value = '';
                        document.getElementById("ipt_to_lng").value = '';
                    }
                    if (polyline) {
                        map.removeObject(polyline);
                        polyline = null;
                    }
                }
            }
        }
    }

    searchGeocoding(id);
}

function setGeocoding(id) {
    if (id) {
        direction = document.getElementById(id).value;
    } else {
        direction = document.getElementById("ipt_from").value;
    }

    if (direction) {
        let xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                let result = this.responseText;
                console.log("Obtain geocode result: " + result);

                let optionsArray = JSON.parse(result);

                for (let index = 0; index < optionsArray.items.length; index++) {
                    let title = optionsArray.items[index].title;

                    if (direction.toUpperCase().includes(title.toUpperCase())) {
                        let newPosition = optionsArray.items[index].position;

                        latitude = newPosition.lat;
                        longitude = newPosition.lng;

                        map.setCenter({ lat: latitude, lng: longitude });
                        map.setZoom(14);


                        console.log(
                            "New position set: " + latitude + "," + longitude
                        );

                        if (id) {
                            if (id.includes("from")) {
                                if (markers.from) {
                                    map.removeObject(markers.from);
                                    addMarker(map, latitude, longitude, icons.from_icon, true);
                                } else {
                                    addMarker(map, latitude, longitude, icons.from_icon, true);
                                }
                            } else {
                                markers.to ? map.removeObject(markers.to) : null;
                                addMarker(map, latitude, longitude, icons.to_icon, false);
                            }
                        } else {
                            if (markers.from) {
                                map.removeObject(markers.from);
                                addMarker(map, latitude, longitude, icons.from_icon, true);
                            }
                        }
                    }
                }
            }
        });

        xhr.open(
            "GET",
            `https://geocode.search.hereapi.com/v1/geocode?apiKey=${constants.API_KEY}&q=${direction}`
        );

        xhr.send();
    }
}

function addMarker(map, lat, lng, icon, isFromMarker) {
    let marker;

    if (isFromMarker) {
        markers.from = new H.map.Marker(
            {
                lat: lat,
                lng: lng,
            },
            { icon: icon, volatility: true, data: "Start marker" }
        );

        marker = markers.from;
    } else {
        markers.to = new H.map.Marker(
            {
                lat: lat,
                lng: lng,
            },
            { icon: icon, volatility: true, data: "Finish marker" }
        );

        marker = markers.to;
    }

    marker.draggable = true;

    map.addObject(marker);

    if (marker.getData().includes("Start")) {
        document.getElementById("ipt_from_lat").value =
            marker.getGeometry().lat;

        document.getElementById("ipt_from_lng").value =
            marker.getGeometry().lng;
    } else {
        document.getElementById("ipt_to_lat").value =
            marker.getGeometry().lat;

        document.getElementById("ipt_to_lng").value =
            marker.getGeometry().lng;
    }


    if (markers.from && markers.to) {
        document.getElementById("divRouteOptions").style = "display: block;";
        transportMode ? makeRoute(transportMode) : null;
    } else {
        if (polyline) {
            map.removeObject(polyline);
            polyline = null;
        }
        document.getElementById("divTotals").style = "display: none;";
    }

    // disable the default draggability of the underlying map
    // and calculate the offset between mouse and target's position
    // when starting to drag a marker object:
    marker.addEventListener(
        "dragstart",
        function (ev) {
            let target = ev.target,
                pointer = ev.currentPointer;
            if (target instanceof H.map.Marker) {
                let targetPosition = map.geoToScreen(target.getGeometry());
                target["offset"] = new H.math.Point(
                    pointer.viewportX - targetPosition.x,
                    pointer.viewportY - targetPosition.y
                );
                behavior.disable();
            }
        },
        false
    );

    // re-enable the default draggability of the underlying map
    // when dragging has completed
    marker.addEventListener(
        "dragend",
        function (ev) {
            let target = ev.target;
            if (target instanceof H.map.Marker) {
                behavior.enable();
            }

            if (target.getData().includes("Start")) {
                document.getElementById("ipt_from_lat").value =
                    target.getGeometry().lat;

                document.getElementById("ipt_from_lng").value =
                    target.getGeometry().lng;

                reverseGeocoding(target.getGeometry().lat, target.getGeometry().lng, "ipt_from");

            } else {
                document.getElementById("ipt_to_lat").value =
                    target.getGeometry().lat;

                document.getElementById("ipt_to_lng").value =
                    target.getGeometry().lng;

                reverseGeocoding(target.getGeometry().lat, target.getGeometry().lng, "ipt_to");
            }

            if (markers.from && markers.to) {
                document.getElementById("divRouteOptions").style = "display: block;";
                transportMode ? makeRoute(transportMode) : null;
            } else {
                if (polyline) {
                    map.removeObject(polyline);
                    polyline = null;
                }
                document.getElementById("divTotals").style = "display: none;";
            }

        },
        false
    );

    // Listen to the drag event and move the position of the marker
    // as necessary
    marker.addEventListener(
        "drag",
        function (ev) {
            let target = ev.target,
                pointer = ev.currentPointer;
            if (target instanceof H.map.Marker) {
                target.setGeometry(
                    map.screenToGeo(
                        pointer.viewportX - target["offset"].x,
                        pointer.viewportY - target["offset"].y
                    )
                );
            }
        },
        false
    );
}

function reverseGeocoding(lat, lng, id) {
    let xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
            console.log("Reverse geocoding result: " + this.responseText);
            let result = JSON.parse(this.responseText);

            if (id) {
                document.getElementById(id).value = result.items[0].address.label;
                lookById(id, result.items[0].id);
            } else {
                document.getElementById("ipt_from").value = result.items[0].address.label;
                lookById("ipt_from", result.items[0].id);
            }
        }
    });

    xhr.open(
        "GET",
        `https://revgeocode.search.hereapi.com/v1/revgeocode?apiKey=${constants.API_KEY}&at=${lat},${lng}`
    );

    xhr.send();
}

function lookById(id, resultId) {
    let xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
            console.log("Look by Id result: " + this.responseText);
            let result = JSON.parse(this.responseText);

            if (id) {
                document.getElementById(id).value = result.address.label;
                searchGeocoding(id);
            } else {
                document.getElementById("ipt_from").value = result.address.label;
                searchGeocoding("ipt_from");
            }
        }
    });

    xhr.open(
        "GET",
        `https://lookup.search.hereapi.com/v1/lookup?apiKey=${constants.API_KEY}&id=${resultId}`
    );

    xhr.send();
}

function checkCoordsIpts(iptLat, iptLng, id) {
    if (id.includes("from")) {
        if (iptLat.value && iptLng.value) {
            reverseGeocoding(iptLat.value, iptLng.value, "ipt_from");
        }
    } else {
        if (iptLat.value && iptLng.value) {
            reverseGeocoding(iptLat.value, iptLng.value, "ipt_to");
        }
    }
}

/*function makeRoute(typeOfTransport) {
  transportMode = typeOfTransport.toLowerCase();
 
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };
 
  fetch(`https://router.hereapi.com/v8/routes?apikey=${constants.API_KEY}&origin=${markers.from.getGeometry().lat},${markers.from.getGeometry().lng}&destination=${markers.to.getGeometry().lat},${markers.to.getGeometry().lng}&return=polyline,summary,actions,instructions,turnByTurnActions&transportMode=${transportMode}`, requestOptions)
    .then(response => response.json())
    .then(result => onSuccess(result))
    .catch(error => onError(error));
}*/

function makeRoute(typeOfTransport) {

    transportMode = typeOfTransport.toLowerCase();

    let router = platform.getRoutingService(null, 8),
        routeRequestParams = {
            routingMode: 'fast',
            transportMode: `${transportMode}`,
            origin: `${markers.from.getGeometry().lat},${markers.from.getGeometry().lng}`, // Brandenburg Gate
            destination: `${markers.to.getGeometry().lat},${markers.to.getGeometry().lng}`, // Friedrichstraße Railway Station
            return: 'polyline,summary'
        };

    router.calculateRoute(
        routeRequestParams,
        onSuccess,
        onError
    );
}

/**
 * This function will be called once the Routing REST API provides a response
 * @param {Object} result A JSONP object representing the calculated route
 *
 * see: http://developer.here.com/rest-apis/documentation/routing/topics/resource-type-calculate-route.html
 */
function onSuccess(result) {
    let route = result.routes[0];

    addRouteShapeToMap(route);
}

/**
 * This function will be called if a communication error occurs during the JSON-P request
 * @param {Object} error The error message received.
 */
function onError(error) {
    alert('Can\'t reach the remote server');
}

/**
 * Creates a H.map.Polyline from the shape of the route and adds it to the map.
 * @param {Object} route A route as received from the H.service.RoutingService
 */
function addRouteShapeToMap(route) {
    if (route) {
        route.sections.forEach((section) => {
            // decode LineString from the flexible polyline
            let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);

            if (polyline) {
                markers.transport ? map.removeObject(markers.transport) : null;
                map.removeObject(polyline);
                polyline = null;
                clearInterval(animateMarker);
                count = 0;
                markers.transport = null;
            }

            let color = 'rgb(0, 0, 0)';

            switch (section.transport.mode) {
                case "car":
                    icons.transport_icon.innerHTML = icon_data.car;
                    break;
                case "truck":
                    icons.transport_icon.innerHTML = icon_data.truck;
                    break;
                case "pedestrian":
                    icons.transport_icon.innerHTML = icon_data.pedestrian;
                    break;
                case "bicycle":
                    icons.transport_icon.innerHTML = icon_data.bicycle;
                    break;
                case "scooter":
                    icons.transport_icon.innerHTML = icon_data.scooter;
                    break;
                case "taxi":
                    icons.transport_icon.innerHTML = icon_data.taxi;
                    break;
                default: //bus
                    icons.transport_icon.innerHTML = icon_data.bus;
                    break;
            }

            // Create a polyline to display the route:
            polyline = new H.map.Polyline(linestring, {
                style: {
                    lineWidth: 5,
                    strokeColor: color
                }
            });

            // Add the polyline to the map
            map.addObject(polyline);
            // And zoom to its bounding rectangle
            map.getViewModel().setLookAtData({
                bounds: polyline.getBoundingBox()
            });

            document.getElementById("titleSummary").innerHTML = `Summary of ${section.transport.mode.toUpperCase()}`;

            document.getElementById("lblTimeDuration").innerHTML = formattingTimeValue(section.summary.duration);

            document.getElementById("lblLength").innerHTML = `${parseFloat(section.summary.length / 1000)} km`;

            document.getElementById("divTotals").style = "display: block;";

            let decodedPolyline = decode(section.polyline);

            console.log(decodedPolyline["polyline"].length);

            let pasos = (decodedPolyline["polyline"].length % 2 == 0) ? 2 : 3;

            let iconContent;

            animateMarker = setInterval(() => {
                if (count < decodedPolyline["polyline"].length) {
                    if (markers.transport) {

                        map.setCenter({ lat: decodedPolyline["polyline"][count][0], lng: decodedPolyline["polyline"][count][1] });
                        count += pasos;
                        markers.transport.setGeometry({ lat: decodedPolyline["polyline"][count][0], lng: decodedPolyline["polyline"][count][1] });

                        if (iconContent) {

                            let PI = 3.14159;
                            let lat1 = decodedPolyline["polyline"][count][0] * PI / 180;
                            let long1 = decodedPolyline["polyline"][count][1] * PI / 180;
                            let lat2 = decodedPolyline["polyline"][count + 1][0] * PI / 180;
                            let long2 = decodedPolyline["polyline"][count + 1][1] * PI / 180;


                            let dLon = (long2 - long1);

                            let y = Math.sin(dLon) * Math.cos(lat2);
                            let x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1)
                                * Math.cos(lat2) * Math.cos(dLon);

                            let brng = Math.atan2(y, x);

                            brng = (brng * 180) / Math.PI;
                            brng = (brng + 360) % 360;

                            iconContent.style.transform = 'rotate(' + brng + 'deg)';
                        }

                    } else {
                        icons.transport_icon.style.margin = '-20px 0 0 -20px';

                        markers.transport = new H.map.DomMarker({ lat: decodedPolyline["polyline"][count][0], lng: decodedPolyline["polyline"][count][1] }, {
                            icon: new H.map.DomIcon(icons.transport_icon, {
                                onAttach: function (clonedElement, domIcon, domMarker) {
                                    iconContent = clonedElement.getElementsByTagName('svg')[0];
                                }
                            })
                        });

                        map.addObject(markers.transport);

                        map.setCenter({ lat: decodedPolyline["polyline"][count][0], lng: decodedPolyline["polyline"][count][1] });

                        count += pasos;
                    }
                } else {
                    clearInterval(animateMarker);
                    count = 0;
                    map.removeObject(markers.transport);
                    markers.transport = null;
                }
            }, 100);

        });
    } else {
        alert('The route for this type of transport cannot be computed');
    }
}

function formattingTimeValue(duration) {
    let days = parseInt(duration / (24 * 3600));

    duration = duration % (24 * 3600);
    let hours = parseInt(duration / 3600);

    duration %= 3600;
    let minutes = parseInt(duration / 60);

    duration %= 60;
    let seconds = parseInt(duration);

    return `${days} d ${hours} h ${minutes} min ${seconds} sec`;
}

function addChangeListeners() {

    document.getElementById("lblDirections").addEventListener('mouseover', () => {
        document.getElementById("lblDirections").style.color = 'rgb(84, 186, 185)';
    }, false);

    document.getElementById("lblDirections").addEventListener('mouseout', () => {
        document.getElementById("lblDirections").style.color = 'rgb(0, 0, 0)';
    }, false);


    document.getElementById("lblDirections").addEventListener('click', () => {
        document.getElementById("divDirections").style.display = 'none';
        document.getElementById("divCoordinates").style.display = 'block';
    }, false);

    document.getElementById("lblCoords").addEventListener('mouseover', () => {
        document.getElementById("lblCoords").style.color = 'rgb(84, 186, 185)';
    }, false);

    document.getElementById("lblCoords").addEventListener('mouseout', () => {
        document.getElementById("lblCoords").style.color = 'rgb(0, 0, 0)';
    }, false);

    document.getElementById("lblCoords").addEventListener('click', () => {
        document.getElementById("divCoordinates").style.display = 'none';
        document.getElementById("divDirections").style.display = 'block';
    }, false)
}