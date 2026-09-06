# Data sources and interpretation

## Police.uk

- [API documentation](https://data.police.uk/docs/)
- [Available reporting months](https://data.police.uk/docs/method/crimes-street-dates/)
- [Street-level reports and location approximation](https://data.police.uk/docs/method/crime-street/)
- [Coverage, publication and anonymisation](https://data.police.uk/about/)
- [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)

The application requests `crimes-street/all-crime` using a latitude, longitude and `YYYY-MM` month. The API defines the point query as a one-mile radius. The dashboard uses the availability endpoint to discover months each session; no release date is hard-coded.

Data concerns England, Wales and Northern Ireland, and is published monthly. It is neither a live incident stream nor a complete record of every offence. Some categories describe anti-social behaviour rather than criminal offences. Source updates, missing submissions and anonymisation affect interpretation.

Positions are approximate. Do not interpret a point as identifying a particular household, person or exact incident address. Heat concentration changes with zoom and the renderer's radius and blur settings. Counts are not normalised by population, visitor numbers or time spent in an area.

Attribution: Contains public sector information licensed under the Open Government Licence v3.0.

## Postcodes.io

[Postcodes.io documentation](https://postcodes.io/docs/overview/)

Postcodes are resolved to coordinates and a country name. Scottish results receive an explicit unsupported-coverage message. A postcode's coordinates identify its representative location, not the visitor's exact position. The dashboard does not request browser geolocation.

Postcode queries pass through the application server to Postcodes.io. Their service and underlying datasets have their own terms and attribution; review them before redistributing postcode data in bulk.

## Basemap

Map imagery is requested directly from CARTO's dark basemap service. The map preserves visible [OpenStreetMap attribution](https://www.openstreetmap.org/copyright) and [CARTO attribution](https://carto.com/attributions). Tile providers can observe the visitor's IP address and requested tiles. Review the provider's terms and capacity before operating a high-traffic deployment.

## Responsible presentation

Keep reporting dates, approximate-location notes and coverage limitations visible. Avoid relabelling report counts as danger, safety rankings or predictions. Empty responses should remain distinct from unavailable services, and neither establishes the absence of crime.

Police.uk documents limited British Transport Police reports for Scotland, which do not represent general Scottish crime coverage. Crime Atlas does not offer Scotland as a supported exploration area; map clicks there may still return sparse transport-police records.
