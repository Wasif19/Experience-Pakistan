const accessToken = mapboxToken;

function getCoordinates(address) {
  const encodedAddress = encodeURIComponent(address);
  const apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${accessToken}`;

  return fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry.coordinates;
        const latitude = coordinates[1];
        const longitude = coordinates[0];

        return { latitude, longitude };
      } else {
        throw new Error(
          "Unable to retrieve coordinates. Please check the address."
        );
      }
    })
    .catch((error) => {
      throw new Error(`Error: ${error.message}`);
    });
}

// Example usage
const addressToSearch = restaurantAddress;
console.log(addressToSearch);

getCoordinates(addressToSearch)
  .then((coordinates) => {
    console.log(
      `Latitude: ${coordinates.latitude}, Longitude: ${coordinates.longitude}`
    );

    // Use the coordinates as needed, e.g., add a marker to the map
    mapboxgl.accessToken = mapboxToken;
    navigator.geolocation.getCurrentPosition(successFunction, errorFunction, {
      enableHighAccuracy: true,
    });
    function successFunction(poistion) {
      console.log(poistion);
      let pos = [poistion.coords.longitude, poistion.coords.latitude];
      setupMap(pos);
    }

    function setupMap(pos) {
      const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v12",
        center: pos,
        zoom: 15,
      });
      const marker1 = new mapboxgl.Marker().setLngLat(pos).addTo(map);
      const nav = new mapboxgl.NavigationControl();
      map.addControl(nav);

      var directions = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
      });

      map.addControl(directions, "top-left");
      directions.setOrigin([pos[0], pos[1]]);
      directions.setDestination([coordinates.longitude, coordinates.latitude]);
    }
    function errorFunction() {}
  })
  .catch((error) => {
    console.error(error.message);
  });
