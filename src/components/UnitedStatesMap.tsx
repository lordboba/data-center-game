import { KeyboardEvent, useMemo } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import statesAtlas from "us-atlas/states-10m.json";
import { DATA_CENTER_SITES, DataCenterSite } from "../data/gameData";

const MAP_WIDTH = 980;
const MAP_HEIGHT = 620;

type StateFeature = {
  id: string | number;
  properties?: Record<string, unknown>;
};

type StateFeatureCollection = {
  features: StateFeature[];
};

const STATE_NAME_BY_FIPS: Record<string, string> = {
  "01": "Alabama",
  "02": "Alaska",
  "04": "Arizona",
  "05": "Arkansas",
  "06": "California",
  "08": "Colorado",
  "09": "Connecticut",
  "10": "Delaware",
  "11": "District of Columbia",
  "12": "Florida",
  "13": "Georgia",
  "15": "Hawaii",
  "16": "Idaho",
  "17": "Illinois",
  "18": "Indiana",
  "19": "Iowa",
  "20": "Kansas",
  "21": "Kentucky",
  "22": "Louisiana",
  "23": "Maine",
  "24": "Maryland",
  "25": "Massachusetts",
  "26": "Michigan",
  "27": "Minnesota",
  "28": "Mississippi",
  "29": "Missouri",
  "30": "Montana",
  "31": "Nebraska",
  "32": "Nevada",
  "33": "New Hampshire",
  "34": "New Jersey",
  "35": "New Mexico",
  "36": "New York",
  "37": "North Carolina",
  "38": "North Dakota",
  "39": "Ohio",
  "40": "Oklahoma",
  "41": "Oregon",
  "42": "Pennsylvania",
  "44": "Rhode Island",
  "45": "South Carolina",
  "46": "South Dakota",
  "47": "Tennessee",
  "48": "Texas",
  "49": "Utah",
  "50": "Vermont",
  "51": "Virginia",
  "53": "Washington",
  "54": "West Virginia",
  "55": "Wisconsin",
  "56": "Wyoming",
};

type UnitedStatesMapProps = {
  builtSiteIds?: string[];
  selectedSiteId?: string;
  onSelectSite?: (siteId: string) => void;
  compact?: boolean;
  sites?: DataCenterSite[];
};

function stateFips(id: unknown): string {
  return String(id).padStart(2, "0");
}

export function UnitedStatesMap({
  builtSiteIds = [],
  selectedSiteId,
  onSelectSite,
  compact = false,
  sites = DATA_CENTER_SITES,
}: UnitedStatesMapProps) {
  const states = useMemo(() => {
    const topology = statesAtlas as unknown as {
      objects: { states: unknown };
    };
    return feature(
      statesAtlas as never,
      topology.objects.states as never,
    ) as unknown as StateFeatureCollection;
  }, []);

  const projection = useMemo(() => {
    return geoAlbersUsa().fitSize([MAP_WIDTH, MAP_HEIGHT], states as never);
  }, [states]);

  const path = useMemo(() => geoPath(projection), [projection]);
  const builtSet = useMemo(() => new Set(builtSiteIds), [builtSiteIds]);
  const builtStates = useMemo(() => {
    return new Set(
      DATA_CENTER_SITES.filter((site) => builtSet.has(site.id)).map(
        (site) => site.stateFips,
      ),
    );
  }, [builtSet]);
  const selectedSite = sites.find((site) => site.id === selectedSiteId);

  const handleKeyDown = (
    event: KeyboardEvent<SVGGElement>,
    site: DataCenterSite,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectSite?.(site.id);
    }
  };

  return (
    <svg
      className={compact ? "us-map us-map--compact" : "us-map"}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label="Accurate map of the United States with data center candidate locations"
    >
      <defs>
        <filter id="map-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="18"
            stdDeviation="14"
            floodColor="#10211d"
            floodOpacity="0.14"
          />
        </filter>
      </defs>
      <g filter="url(#map-shadow)">
        {states.features.map((state) => {
          const id = stateFips(state.id);
          const isBuilt = builtStates.has(id);
          const isSelected = selectedSite?.stateFips === id;
          const stateName = STATE_NAME_BY_FIPS[id] ?? `State ${id}`;

          return (
            <path
              key={id}
              d={path(state as never) ?? undefined}
              className={[
                "state-shape",
                isBuilt ? "state-shape--built" : "",
                isSelected ? "state-shape--selected" : "",
              ].join(" ")}
            >
              <title>{stateName}</title>
            </path>
          );
        })}
      </g>
      <g className="site-layer">
        {sites.map((site) => {
          const point = projection([site.longitude, site.latitude]);
          if (!point) return null;
          const [x, y] = point;
          const isBuilt = builtSet.has(site.id);
          const isSelected = selectedSiteId === site.id;

          return (
            <g
              key={site.id}
              className={[
                "site-marker",
                isBuilt ? "site-marker--built" : "",
                isSelected ? "site-marker--selected" : "",
                onSelectSite ? "site-marker--interactive" : "",
              ].join(" ")}
              role={onSelectSite ? "button" : "presentation"}
              aria-label={`${site.metro}, ${site.state}`}
              tabIndex={onSelectSite ? 0 : -1}
              transform={`translate(${x} ${y})`}
              onClick={() => onSelectSite?.(site.id)}
              onKeyDown={(event) => handleKeyDown(event, site)}
            >
              <circle className="site-marker__halo" r={isSelected ? 16 : 11} />
              <circle className="site-marker__core" r={isBuilt ? 6.5 : 5.5} />
              {(isSelected || isBuilt || (!compact && !onSelectSite)) && (
                <text className="site-marker__label" x="10" y="-9">
                  {site.metro}
                </text>
              )}
              <title>
                {site.metro}, {site.state}
              </title>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
