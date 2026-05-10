# Data Center Game Model Notes

This game is a playable model, not a forecast. It uses public data to set the shape of the 2022-2030 curve and then compresses real units into game decisions.

## Sources used

- Epoch AI, Frontier Data Centers, accessed May 9, 2026: https://epoch.ai/data/data-centers
- Epoch AI dataset download used by the build: https://epoch.ai/data/data_centers/data_centers.zip
- IEA, Energy and AI, Energy demand from AI: https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai
- IEA, Energy and AI, Energy supply for AI: https://www.iea.org/reports/energy-and-ai/energy-supply-for-ai
- U.S. Census Bureau ACS 1-year 2024 table B01003 for state population: https://api.census.gov/data/2024/acs/acs1?get=NAME,B01003_001E&for=state:*
- U.S. Bureau of Economic Analysis SAGDP current-dollar GDP by state, 2025 release: https://apps.bea.gov/regional/zip/SAGDP.zip
- U.S. Energy Information Administration Electric Power Annual 2024, table 2.10 industrial prices: https://www.eia.gov/electricity/annual/table.php?t=epa_02_10.html
- Federal Election Commission official 2024 presidential general election results compiled from state election offices: https://www.fec.gov/introduction-campaign-finance/election-results-and-voting-information/

## Demand curve

The game target uses Epoch's frontier data center timeline rollup as the H100-equivalent capacity that the player is trying to keep up with. The rollup chooses the latest timeline row on or before each year for each data center and sums `H100 equivalents` and `Power (MW)`.

| Year | H100e target | Power target MW |
| --- | ---: | ---: |
| 2022 | 3,941 | 57 |
| 2023 | 118,742 | 340 |
| 2024 | 585,947 | 1,611 |
| 2025 | 3,765,163 | 5,904 |
| 2026 | 11,897,305 | 15,002 |
| 2027 | 24,160,918 | 22,674 |
| 2028 | 48,290,532 | 35,510 |
| 2029 | 49,026,133 | 35,919 |
| 2030 | 48,250,842 | 36,213 |

The raw Epoch data is partial and uncertain. Epoch describes the hub as a selection of the largest existing or planned data centers, mostly in the United States, and estimates it covered roughly 15-17% of shipped AI compute as of late 2025. The game therefore presents this as "frontier demand pressure" rather than a complete global census.

## United States siting model

The logistics layer is set in the United States. Each parcel belongs to one of twelve real U.S. data-center or logistics regions: Northern Virginia, Phoenix, Dallas-Fort Worth, Atlanta, Columbus, Memphis, Des Moines, Chicago, Hillsboro, Salt Lake City, Reno, and Pittsburgh.

Each region uses state-level real-world inputs: 2024 state population from Census ACS table B01003, 2025 current-dollar state GDP from BEA SAGDP1 line 3, 2024 industrial electricity price from EIA Electric Power Annual table 2.10, and 2024 presidential margin from official FEC results compiled from state election offices.

The location modifiers are intentionally transparent: higher population and permitting difficulty increase public-support sensitivity; lower industrial electricity prices reduce power-project cost; larger labor markets slightly improve compute deployment efficiency; higher water-stress scores reduce water project effectiveness and increase water demand pressure; and state political context changes policy support.
