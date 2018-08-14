import * as crypto from 'crypto';
import * as fsExtra from 'fs-extra';
import {Logger} from 'loggerhythm';
import * as path from 'path';
import * as Sequelize from 'sequelize';

const logger: Logger = Logger.createLogger('sequelize_connection_manager:connection_factory');

const connections: {[hash: string]: Sequelize.Sequelize} = {};

/**
 * Returns a sequelize connection for the current configuration.
 *
 * @param  {Object} config          Contains the settings with which to establish a database connection.
 *                                  Required parameters are host, port, database, dialect, username and password.
 * @param  {String} config.host     The name of the host where the database is located
 * @param  {String} config.port     The port by which to connect to the host
 * @param  {String} config.dialect  The type of database to which to connect (postgres, sqlite, mysql, etc)
 * @param  {String} config.database The name of the database to connect to.
 * @param  {String} config.username The username with which to connect to the database.
 * @param  {String} config.password The password with which to connect to the database.
 * @return {Object}                 The connection for the passed configuration.
 */
export async function getConnection(config: Sequelize.Options): Promise<Sequelize.Sequelize> {

  let hash: string;

  if (config.dialect === 'sqlite') {
    hash = _getHash(config.storage, config.username, config.password);
  } else {
    hash = _getHash(config.database, config.username, config.password);
  }

  const connectionExists: boolean = typeof connections[hash] !== 'undefined';

  if (connectionExists) {
    logger.verbose(`Active connection to '${config.database}' found.`);

    return Promise.resolve(connections[hash]);
  }

  if (config.dialect === 'sqlite') {
    const isAbsolutePath: boolean = path.isAbsolute(config.storage);
    if (isAbsolutePath) {
      fsExtra.ensureFileSync(config.storage);
    }
  }

  const connection: Sequelize.Sequelize = new Sequelize(config.database, config.username, config.password, config);
  logger.verbose(`Connection to database '${config.database}' established.`);
  connections[hash] = connection;

  return Promise.resolve(connection);
}

/**
 * Generates a hash from config settings marking a unique connection.
 *
 * @param  {String} database The name of the database to connect to.
 * @param  {String} username The username with which to connect to the database.
 * @param  {String} password The password with which to connect to the database.
 * @return {String} The generated hash.
 */
function _getHash(database: string, username: string, password: string): string {
  const hash: crypto.Hash = crypto.createHash('sha256');
  const properties: string = `${database}${username}${password}`;

  return hash.update(properties).digest('hex');
}
