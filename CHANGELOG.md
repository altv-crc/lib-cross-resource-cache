# 1.0.8

- Remove annoying database log

# 1.0.7

- Fix logger timestamps

# 1.0.6

- Fix small bug where `sync` did not set `collection` for proper updating.

# 1.0.5

- Fix small bug with `_id` in update function

# 1.0.4

- Added deleteDocument function

# 1.0.3

- Simplify `onSync` logic to just pass any entity.
- Allows for more control over what to do with entity data when onSync is called.

# 1.0.2

- Fixed bug where specifying `_id` would not convert it to ObjectID for usage.
