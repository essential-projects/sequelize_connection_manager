# Sequelize Connection Manager

Creates and manages connections against a database, using sequelize.

The manager can be used to avoid having multiple connections running against the
same database.

It stores each created connection in an internal connection storage and provides
methods for creating and retrieving such a connection and for destroying it.

# Usage

Usage is simple enough.

You need to have a valid Sequelize connection config at hand that you
can pass to the manager.

Then you can just use one of the calls for getting or destroying a connection.

## Get a Connection

To retrieve a connection to a specific database, use the following call:

```TypeScript

import * as Sequelize from 'sequelize';
import {
  SequelizeConnectionManager,
} from '@essential-projects/sequelize_connection_manager';

const databaseConfig: Sequelize.Options = {
  dialect: 'postgres',
  database: 'sample_database',
  username: 'someusername',
  password: 'somepassword',
};

const sequelizeConnectionManager: SequelizeConnectionManager =
  new SequelizeConnectionManager();

const sequelizeConnection: Sequelize.Sequelize =
  await sequelizeConnectionManager.getConnection(config)
```

This will get you a connection to the postgres database `sample_database`, using
the given credentials for authentication.

If no such connection has been established before, a new one will be created.

If a matching connection already exists, the manager will return that one instead.

## Close a Connection

To close an existing connection, pass the same config to the following call:

```TypeScript
await sequelizeConnectionManager.destroyConnection(config)
```

**Caution:**
Be advised that this will close the connection for **any** component that uses
it!
