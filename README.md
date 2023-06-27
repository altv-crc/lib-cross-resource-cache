# Cross Resource Cache for alt:V

Make a player, vehicle, or any other Entity saved to a MongoDB database with cross-resource accessible data.

This library is highly geared towards `TypeScript`.

## Why?

- If you've ever tried working with multiple resources in alt:V it can be painful.
- Trying to synchronize database read / writes creates a lot of duplicate code between resources.
- The aim of this library is to reduce that complexity by making it all viable through setters/getters.
- This is an experimental project to see if we can make alt:V cross resource viable.

# Installation

```
npm i @stuyk/altv-cross-resource-cache
```

# Examples

## Connect to Database

* This should be the only `connection` instance for your whole gamemode. 

* The other database instances in other resources will connect automatically.

In your `server` folder you need to import this library and start the MongoDB connection process.

Make sure you have a MongoDB Community Server instance setup locally, or through MongoDB Atlas.

_The example belows uses a URL for localhost_

```ts
import * as alt from 'alt-server';
import * as crc from '@stuyk/cross-resource-cache';

crc.database.connect('mongodb://127.0.0.1:27017', 'mydatabase');

crc.onReady(() => {
    alt.log('Connected!');
});
```

## Sync Data

For the sake of this tutorial; imagine a single account is one character.

The function below is a simple `login/register` function combined into one.

* If the `username` exists, and the password is correct. They login.

* If the `username` does not exist it will use the password to register.

```ts
async function loginOrRegister(player: alt.Player, username: string, password: string) {
    if (!username || !password) {
        console.log(`username or password not provided`);
        return;
    }

    let document = await crc.database.get<Account>({ username }, 'account');
    if (!document) {
        const accountIdentifier = await crc.database.create<Account>(
            {
                username,
                password: crc.utility.password.create(password),
            },
            'account'
        );

        document = await crc.database.get<Account>({ _id: accountIdentifier }, 'account');
    }

    if (!crc.utility.password.check(password, document.password)) {
        console.log(`invalid password`);
        return;
    }

    await crc.data.sync(player, document._id, 'account');
}
```

## Writing Data

Simply put, when you `sync` data on an entity like a `Player`; you can now set data on the player and it will automatically save it to the database.

Here's how we can save cash values, or simply modify them.

```ts
async function addToBank(player: alt.Player, amount: number) {
    let originalValue = crc.data.getValue<number | undefined>(player, 'bank');
    if (!originalValue) {
        originalValue = 0;
    }

    await crc.data.setValue(player, 'bank', originalValue + amount);
}
```

## Event Driven Development

How about some events based on when a `key` for an entity is set.

Automatically synchronize new changes with ease.

```ts
interface Appearance {
    face1?: number;
    face2?: number;
    hair?: number;
}

async function setHairStyle(player: alt.Player, value: number) {
    let appearance = crc.data.getValue<Appearance>(player, 'appearance');
    if (!appearance) {
        appearance = {};
    }

    await crc.data.setValue(player, 'appearance', appearance);
}

crc.events.onKeyChange('appearance', (entity: alt.Player, newData: Appearance, oldData: Appearance) => {
    if (!(entity instanceof alt.Player)) {
        return;
    }

    if (newData.hair) {
        entity.setClothes(2, newData.hair, 0, 0);
    }

    // Do more processing
});
```