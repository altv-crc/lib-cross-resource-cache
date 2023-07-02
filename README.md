# Cross Resource Cache for alt:V

An easy-to-use database library for alt:V that utilizes MongoDB.

Easily write data to your database by binding documents to alt:V Entities such as players, vehicles, and colshapes.

Data is cross-resource accessible meaning it can work in a multi-resource environment.

## Features

- Connect to MongoDB Database
- Individual connections to MongoDB Database per resource
- Cross-resource data cache for alt:V Entities (players, vehicles, etc)
- Listen for individual data updates based on keys
- Flag different data keys as localMeta, syncedMeta, or streamSyncedMeta for easy server-to-client sync

# Installation

```
npm i @stuyk/cross-resource-cache
```

# Documentation

[Check out the Documentation on GitHub](https://github.com/altv-crc/lib-cross-resource-cache/wiki)
