# UrbanCoolSim Dataset Directory

Place raw and preprocessed spatial/climate datasets here.

Expected directory layout:

```text
dataset/
├── raw/
│   ├── lst/          # Landsat 8/9 LST or ECOSTRESS rasters (.tif, .nc)
│   ├── reflectance/  # Sentinel-2 surface reflectance (.tif)
│   ├── weather/      # ERA5-Land hourly meteorological forcing (.nc, .csv)
│   ├── vector/       # OpenStreetMap building footprints, roads (.geojson, .gpkg, .shp)
│   └── landcover/    # ESA WorldCover 10m LULC (.tif)
└── processed/
    └── grid_10m/     # Resampled and unified 10m x 10m spatial grid arrays (.parquet, .tif)
```

For complete instructions on sourcing, access requirements, formats, and preprocessing guidelines, consult [dataset_needs.md](../dataset_needs.md) in the project root.
