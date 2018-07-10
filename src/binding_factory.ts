import * as crypto from 'crypto';
import {Logger} from 'loggerhythm';
import * as Sequelize from 'sequelize';

const logger: Logger = Logger.createLogger('sequelize_connection_manager:binding_factory');

const connections: {[hash: string]: Sequelize.Sequelize} = {};

/**
 * Returns a sequelize connection for the current configuration.
 *
 * @method getConnection
 * @param  {String} database The name of the database to connect to
 * @param  {String} username The username with which to connect to the database
 * @param  {String} password The password with which to connect to the database
 * @param  {Object} config   A set of optional configs used for the connection (like dialect, supportBigNumbers, etc)
 * @return {Object}          The connection for the passed configuration.
 */
export function getConnection(database: string, username: string, password: string, config: Sequelize.Options): Promise<Sequelize.Sequelize> {

  const hash: string = _getHash(database, username, password);

  const connectionExists: boolean = typeof connections[hash] !== 'undefined';

  if (connectionExists) {
    logger.verbose(`Active postgres connection to '${database}' found.`);

    return Promise.resolve(connections[hash]);
  }
  const connection: Sequelize.Sequelize = new Sequelize(database, username, password, config);
  logger.verbose(`postgres connection to database '${database}' established.`);
  connections[hash] = connection;

  return Promise.resolve(connection);
}

/**
 * Generates a hash from config settings marking a unique connection.
 *
 * @method _getHash
 * @private
 * @param  {String} database The name of the database to connect to
 * @param  {String} username The username with which to connect to the database
 * @param  {String} password The password with which to connect to the database
 * @return {String} The generated hash.
 */
function _getHash(database: string, username: string, password: string): string {
  const hash: crypto.Hash = crypto.createHash('sha256');
  const properties: string = `${database}${username}${password}`;

  return hash.update(properties).digest('hex');
}
